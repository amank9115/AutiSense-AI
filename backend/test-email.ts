import { PrismaClient } from '@prisma/client';
import { EmailService } from './src/email/email.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();
const emailService = new EmailService();

async function testEmail() {
  const email = 'sharmaaman0629@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Using RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'MISSING');

  const result = await emailService.sendVerificationEmail(
    user.email,
    user.name,
    user.emailVerificationToken || 'test-token',
    'http://localhost:3000'
  );

  console.log('RESULT:', JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

testEmail();
