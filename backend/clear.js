const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.practiceAttempt.deleteMany()
  .then(() => console.log('cleared'))
  .finally(() => prisma.$disconnect());
