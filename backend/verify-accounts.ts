import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Aman@123@localhost:5432/autisense'
    }
  }
});

async function verifyAccounts() {
  const emails = ['amank80459@gmail.com', 'sharmaaman0629@gmail.com'];
  
  for (const email of emails) {
    try {
      await prisma.user.update({
        where: { email },
        data: { emailVerified: true }
      });
      console.log(`User ${email} verified successfully`);
    } catch (e) {
      console.log(`Failed to verify ${email} (might not exist)`);
    }
  }
  
  await prisma.$disconnect();
}

verifyAccounts();
