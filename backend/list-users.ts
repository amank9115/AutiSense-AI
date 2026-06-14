import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Aman@123@localhost:5432/autisense'
    }
  }
});
async function listUsers() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true, emailVerified: true }
  });
  console.log('USERS_LIST:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
listUsers();
