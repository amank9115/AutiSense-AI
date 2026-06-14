import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkUser() {
  const user = await prisma.user.findUnique({ where: { email: 'amank8045@gmail.com' } });
  console.log('USER_CHECK:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}
checkUser();
