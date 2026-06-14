import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Aman@123@localhost:5432/autisense'
    }
  }
});

async function removeUser() {
  const email = 'sharmaaman0629@gmail.com';
  
  try {
    // Delete the user (this will cascade delete related data if schema allows, 
    // but User in schema.prisma has relations to Child, ScreeningSession, etc. with Cascade)
    const deletedUser = await prisma.user.delete({
      where: { email }
    });
    console.log(`User ${email} has been removed from the database.`);
  } catch (e) {
    console.log(`Failed to remove ${email}:`, e.message);
  }
  
  await prisma.$disconnect();
}

removeUser();
