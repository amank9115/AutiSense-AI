import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Aman@123@localhost:5432/autisense'
    }
  }
});

async function resetPassword() {
  const email = 'amank80459@gmail.com';
  const newPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash: hashedPassword }
  });

  console.log(`Password reset successfully for ${email}`);
  await prisma.$disconnect();
}

resetPassword();
