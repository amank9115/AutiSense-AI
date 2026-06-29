import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Achievement, UserGamification, UserAchievement } from '@prisma/client';

// Level configuration
const LEVEL_CONFIG = {
  basePoints: 100,
  multiplier: 1.5,
  maxLevel: 50,
};

// Point values for actions
const POINT_VALUES = {
  SCREENING_COMPLETED: 50,
  SESSION_SHARED: 20,
  APPOINTMENT_BOOKED: 15,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 10,
  FIRST_SCREENING: 100,
  MILESTONE_5_SCREENINGS: 200,
  MILESTONE_10_SCREENINGS: 500,
};

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly prisma: PrismaService) {
    this.initializeAchievements();
  }

  // === Points and Levels ===

  async awardPoints(
    userId: string,
    action: keyof typeof POINT_VALUES,
    metadata?: any,
  ): Promise<UserGamification> {
    const points = POINT_VALUES[action] || 0;

    const gamification = await this.getOrCreateUserGamification(userId);

    const newTotal = gamification.totalPoints + points;
    const newLevel = this.calculateLevel(newTotal);
    const pointsToNext = this.pointsNeededForLevel(newLevel + 1) - newTotal;

    const updated = await this.prisma.userGamification.update({
      where: { userId },
      data: {
        totalPoints: newTotal,
        currentLevel: newLevel,
        pointsToNextLevel: Math.max(0, pointsToNext),
      },
    });

    this.logger.log(`Awarded ${points} points to user ${userId} for ${action}`);

    // Check for achievements
    await this.checkAchievements(userId, action, metadata);

    return updated;
  }

  async updateStreak(userId: string): Promise<UserGamification> {
    const gamification = await this.getOrCreateUserGamification(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = 1;
    let longestStreak = gamification.longestStreak;

    if (gamification.lastActivityDate) {
      const lastDate = new Date(gamification.lastActivityDate);
      lastDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        newStreak = gamification.currentStreak + 1;
        longestStreak = Math.max(longestStreak, newStreak);
      } else if (diffDays === 0) {
        newStreak = gamification.currentStreak; // Same day, no change
      }
      // else diffDays > 1: streak broken, reset to 1
    }

    const updated = await this.prisma.userGamification.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: today,
      },
    });

    // Streak bonus
    if (newStreak > 1 && newStreak % 7 === 0) {
      await this.awardPoints(userId, 'STREAK_BONUS', { streak: newStreak });
    }

    return updated;
  }

  // === Achievements ===

  async checkAchievements(
    userId: string,
    action: string,
    metadata?: any,
  ): Promise<UserAchievement[]> {
    const earned: UserAchievement[] = [];

    // Get all active achievements
    const achievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
    });

    for (const achievement of achievements) {
      const alreadyEarned = await this.prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: { userId, achievementId: achievement.id },
        },
      });

      if (alreadyEarned) continue;

      const shouldEarn = await this.checkAchievementCriteria(
        userId,
        achievement,
        action,
        metadata,
      );

      if (shouldEarn) {
        const userAchievement = await this.prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        // Award achievement points
        if (achievement.points > 0) {
          await this.prisma.userGamification.update({
            where: { userId },
            data: {
              totalPoints: { increment: achievement.points },
              badgesEarned: { increment: 1 },
            },
          });
        }

        earned.push(userAchievement);
        this.logger.log(
          `User ${userId} earned achievement: ${achievement.name}`,
        );
      }
    }

    return earned;
  }

  private async checkAchievementCriteria(
    userId: string,
    achievement: Achievement,
    action: string,
    metadata?: any,
  ): Promise<boolean> {
    const gamification = await this.getOrCreateUserGamification(userId);

    switch (achievement.requirementType) {
      case 'count':
        // E.g., complete 5 screenings
        return gamification.screeningsCompleted >= achievement.requirementValue;

      case 'streak':
        return gamification.currentStreak >= achievement.requirementValue;

      case 'score':
        // E.g., achieve 90% engagement score
        return metadata?.score >= achievement.requirementValue;

      case 'level':
        return gamification.currentLevel >= achievement.requirementValue;

      default:
        return false;
    }
  }

  async getUserAchievements(
    userId: string,
  ): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async getAvailableAchievements(userId: string): Promise<Achievement[]> {
    const earnedIds = (
      await this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      })
    ).map((ua) => ua.achievementId);

    return this.prisma.achievement.findMany({
      where: {
        isActive: true,
        id: { notIn: earnedIds },
      },
    });
  }

  // === Child Gamification ===

  async awardChildStars(childId: string, stars: number): Promise<void> {
    await this.prisma.childGamification.upsert({
      where: { childId },
      update: {
        stars: { increment: stars },
      },
      create: {
        childId,
        stars,
      },
    });
  }

  async awardChildSticker(childId: string, stickerId: string): Promise<void> {
    const childGaming = await this.prisma.childGamification.findUnique({
      where: { childId },
    });

    const stickers = (childGaming?.stickers as string[]) || [];
    if (!stickers.includes(stickerId)) {
      await this.prisma.childGamification.update({
        where: { childId },
        data: {
          stickers: [...stickers, stickerId],
        },
      });
    }
  }

  async getChildRewards(childId: string): Promise<{
    stars: number;
    stickers: string[];
    unlockedThemes: string[];
    screeningsCompleted: number;
  }> {
    const childGaming = await this.prisma.childGamification.findUnique({
      where: { childId },
    });

    return {
      stars: childGaming?.stars || 0,
      stickers: (childGaming?.stickers as string[]) || [],
      unlockedThemes: (childGaming?.unlockedThemes as string[]) || [],
      screeningsCompleted: childGaming?.screeningsCompleted || 0,
    };
  }

  // === Leaderboard ===

  async getLeaderboard(limit = 10): Promise<UserGamification[]> {
    return this.prisma.userGamification.findMany({
      take: limit,
      orderBy: [{ currentLevel: 'desc' }, { totalPoints: 'desc' }],
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // === Helpers ===

  private async getOrCreateUserGamification(
    userId: string,
  ): Promise<UserGamification> {
    let gamification = await this.prisma.userGamification.findUnique({
      where: { userId },
    });

    if (!gamification) {
      gamification = await this.prisma.userGamification.create({
        data: { userId },
      });
    }

    return gamification;
  }

  private calculateLevel(points: number): number {
    let level = 1;
    let pointsNeeded = LEVEL_CONFIG.basePoints;

    while (points >= pointsNeeded && level < LEVEL_CONFIG.maxLevel) {
      level++;
      pointsNeeded = this.pointsNeededForLevel(level);
    }

    return level;
  }

  private pointsNeededForLevel(level: number): number {
    return Math.floor(
      LEVEL_CONFIG.basePoints * Math.pow(LEVEL_CONFIG.multiplier, level - 1),
    );
  }

  private async initializeAchievements(): Promise<void> {
    const defaultAchievements = [
      {
        code: 'first_screening',
        name: 'First Steps',
        description: 'Complete your first screening session',
        icon: 'star',
        category: 'screening',
        requirementType: 'count',
        requirementValue: 1,
        points: 50,
        rarity: 'common',
      },
      {
        code: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day activity streak',
        icon: 'local_fire_department',
        category: 'engagement',
        requirementType: 'streak',
        requirementValue: 7,
        points: 100,
        rarity: 'rare',
      },
      {
        code: 'screening_10',
        name: 'Screening Pro',
        description: 'Complete 10 screening sessions',
        icon: 'verified',
        category: 'screening',
        requirementType: 'count',
        requirementValue: 10,
        points: 200,
        rarity: 'epic',
      },
      {
        code: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: 'trending_up',
        category: 'milestone',
        requirementType: 'level',
        requirementValue: 5,
        points: 150,
        rarity: 'rare',
      },
    ];

    for (const achievement of defaultAchievements) {
      await this.prisma.achievement.upsert({
        where: { code: achievement.code },
        update: achievement,
        create: achievement,
      });
    }
  }
}
