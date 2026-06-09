import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.report.deleteMany();
  await prisma.analysisData.deleteMany();
  await prisma.screeningResult.deleteMany();
  await prisma.screeningSession.deleteMany();
  await prisma.child.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log('👥 Creating test users...');

  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@example.com',
      name: 'John Doe',
      phone: '+1 555-0123',
      passwordHash: hashedPassword,
      role: 'parent',
      emailVerified: true,
    },
  });

  const doctorUser = await prisma.user.create({
    data: {
      email: 'doctor@example.com',
      name: 'Dr. Sarah Smith',
      phone: '+1 555-0456',
      passwordHash: hashedPassword,
      role: 'doctor',
      emailVerified: true,
    },
  });

  // Create test children
  console.log('👶 Creating test children...');

  const child1 = await prisma.child.create({
    data: {
      parentId: parentUser.id,
      name: 'Emma Doe',
      dateOfBirth: new Date('2019-05-15'),
      gender: 'female',
      medicalNotes: 'No medical conditions',
    },
  });

  const child2 = await prisma.child.create({
    data: {
      parentId: parentUser.id,
      name: 'Liam Doe',
      dateOfBirth: new Date('2020-08-22'),
      gender: 'male',
      medicalNotes: 'Mild allergies',
    },
  });

  // Create test screening sessions
  console.log('📹 Creating test screening sessions...');

  const session1 = await prisma.screeningSession.create({
    data: {
      userId: parentUser.id,
      childId: child1.id,
      status: 'completed',
      duration: 300,
      frameCount: 450,
      riskScore: 35.5,
      riskLevel: 'low',
      summary: 'Child shows normal developmental behaviors',
      startedAt: new Date('2026-05-28T10:00:00Z'),
      completedAt: new Date('2026-05-28T10:05:00Z'),
      metadata: {
        cameraQuality: 'hd',
        lightingCondition: 'good',
        backgroundNoise: 'minimal',
      },
    },
  });

  const session2 = await prisma.screeningSession.create({
    data: {
      userId: parentUser.id,
      childId: child2.id,
      status: 'completed',
      duration: 280,
      frameCount: 420,
      riskScore: 62.3,
      riskLevel: 'high',
      summary: 'Some behavioral markers detected, recommend clinical evaluation',
      startedAt: new Date('2026-05-29T14:30:00Z'),
      completedAt: new Date('2026-05-29T14:35:00Z'),
      metadata: {
        cameraQuality: 'hd',
        lightingCondition: 'adequate',
        backgroundNoise: 'moderate',
      },
    },
  });

  // Create screening results
  console.log('📊 Creating screening results...');

  await prisma.screeningResult.create({
    data: {
      sessionId: session1.id,
      riskScore: 35.5,
      riskLevel: 'low',
      confidence: 0.87,
      behaviors: {
        eyeContact: { score: 0.92, frames: 345 },
        attentionSpan: { score: 0.85, frames: 382 },
        socialEngagement: { score: 0.88, frames: 412 },
        motorSkills: { score: 0.80, frames: 350 },
      },
      emotionalPatterns: {
        happiness: 0.75,
        calmness: 0.82,
        engagement: 0.79,
      },
      summary: 'Low risk indicators. Child demonstrates age-appropriate behaviors.',
      recommendations: [
        'Continue regular developmental monitoring',
        'Engage in interactive play activities',
        'Schedule annual screening',
      ],
    },
  });

  await prisma.screeningResult.create({
    data: {
      sessionId: session2.id,
      riskScore: 62.3,
      riskLevel: 'high',
      confidence: 0.79,
      behaviors: {
        eyeContact: { score: 0.45, frames: 178 },
        attentionSpan: { score: 0.52, frames: 219 },
        socialEngagement: { score: 0.48, frames: 202 },
        motorSkills: { score: 0.68, frames: 286 },
      },
      emotionalPatterns: {
        happiness: 0.38,
        calmness: 0.52,
        engagement: 0.41,
      },
      summary: 'Elevated risk markers detected.',
      recommendations: [
        'Schedule professional clinical evaluation',
        'Consider speech-language pathology assessment',
        'Increase structured educational activities',
        'Follow-up screening in 2-3 months',
      ],
    },
  });

  // Create analysis data
  console.log('📈 Creating analysis data...');

  await prisma.analysisData.create({
    data: {
      sessionId: session1.id,
      frameCount: 450,
      averageConfidence: 0.87,
      behaviors: {
        detected: [
          { type: 'eye_contact', frame: 50, confidence: 0.92 },
          { type: 'smile', frame: 120, confidence: 0.88 },
          { type: 'head_movement', frame: 180, confidence: 0.85 },
          { type: 'hand_gesture', frame: 240, confidence: 0.79 },
        ],
      },
      emotions: {
        timeline: [
          { timestamp: 0, emotion: 'neutral', confidence: 0.8 },
          { timestamp: 60, emotion: 'happy', confidence: 0.85 },
          { timestamp: 120, emotion: 'happy', confidence: 0.87 },
          { timestamp: 180, emotion: 'neutral', confidence: 0.82 },
          { timestamp: 240, emotion: 'happy', confidence: 0.83 },
        ],
      },
    },
  });

  // Create a chat session
  console.log('💬 Creating test chat session...');

  const chatSession = await prisma.chatSession.create({
    data: {
      userId: parentUser.id,
      title: 'Initial consultation about Emma',
    },
  });

  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: 'user',
      content: 'What does the screening results mean for my child?',
    },
  });

  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: 'assistant',
      content:
        'The screening results show low-risk indicators, which is positive. Your child demonstrates age-appropriate developmental behaviors. We recommend continuing regular developmental monitoring and engaging in interactive play activities.',
    },
  });

  console.log('✅ Database seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Parent Account:');
  console.log('  Email: parent@example.com');
  console.log('  Password: TestPassword123!');
  console.log('\nDoctor Account:');
  console.log('  Email: doctor@example.com');
  console.log('  Password: TestPassword123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
