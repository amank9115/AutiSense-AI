import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExportStatus, ExportFormat } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  private readonly exportDir = process.env.EXPORT_DIR || './exports';

  constructor(private prisma: PrismaService) {}

  async requestExport(userId: string, format: ExportFormat): Promise<string> {
    const request = await this.prisma.dataExportRequest.create({
      data: { userId, format, status: 'pending' },
    });

    // Process asynchronously
    this.processExport(request.id, userId, format).catch((err) => {
      this.logger.error(`Export ${request.id} failed`, err);
    });

    return request.id;
  }

  async getExportStatus(requestId: string, userId: string) {
    return this.prisma.dataExportRequest.findFirst({
      where: { id: requestId, userId },
    });
  }

  async getImmediateExport(userId: string): Promise<Record<string, any>> {
    const [user, children, sessions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          organizationMemberships: true,
        },
      }),
      this.prisma.child.findMany({
        where: { parentId: userId },
        include: { screeningSessions: true },
      }),
      this.prisma.screeningSession.findMany({
        where: { userId },
        include: { results: true, analysisData: true, report: true },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile: user,
      children,
      screeningSessions: sessions,
    };
  }

  private async processExport(
    requestId: string,
    userId: string,
    format: ExportFormat,
  ): Promise<void> {
    try {
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'processing' },
      });

      const data = await this.gatherUserData(userId);
      const filename = `export-${userId}-${Date.now()}`;
      const exportPath = path.join(this.exportDir, filename);

      await fs.mkdir(this.exportDir, { recursive: true });

      if (format === 'json_only') {
        await fs.writeFile(`${exportPath}.json`, JSON.stringify(data, null, 2));
      } else {
        await this.createArchive(exportPath, data);
      }

      const downloadUrl = `/api/v1/gdpr/export/download/${filename}${format === 'json_only' ? '.json' : '.zip'}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          downloadUrl,
          expiresAt,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Export ${requestId} completed`);
    } catch (error) {
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          errorMessage: (error as Error).message,
        },
      });
    }
  }

  private async gatherUserData(userId: string) {
    const [
      user,
      children,
      screeningSessions,
      chatSessions,
      sharedReports,
      achievements,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          organizationMemberships: true,
        },
      }),
      this.prisma.child.findMany({
        where: { parentId: userId },
        include: { screeningSessions: true, behavioralTrends: true },
      }),
      this.prisma.screeningSession.findMany({
        where: { userId },
        include: { results: true, analysisData: true },
      }),
      this.prisma.chatSession.findMany({
        where: { userId },
        include: { messages: true },
      }),
      this.prisma.reportShare.findMany({
        where: { sharedById: userId },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
    ]);

    return {
      manifest: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        userId,
      },
      profile: user,
      children,
      screeningSessions,
      chatSessions,
      sharedReports,
      achievements,
    };
  }

  private async createArchive(exportPath: string, data: Record<string, any>): Promise<void> {
    const fsSync = require('fs');
    const archiver = require('archiver');
    
    return new Promise((resolve, reject) => {
      const output = fsSync.createWriteStream(`${exportPath}.zip`);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err: Error) => reject(err));

      archive.pipe(output);
      archive.append(JSON.stringify(data.manifest, null, 2), { name: 'manifest.json' });
      archive.append(JSON.stringify(data.profile, null, 2), { name: 'profile/user-profile.json' });
      archive.append(JSON.stringify(data.children, null, 2), { name: 'children/children.json' });
      archive.append(JSON.stringify(data.screeningSessions, null, 2), { name: 'screenings/sessions.json' });
      archive.append(JSON.stringify(data.chatSessions, null, 2), { name: 'chat/sessions.json' });
      archive.append(JSON.stringify(data.sharedReports, null, 2), { name: 'shared-reports/reports.json' });
      archive.append(JSON.stringify(data.achievements, null, 2), { name: 'achievements/achievements.json' });
      archive.finalize();
    });
  }
}
