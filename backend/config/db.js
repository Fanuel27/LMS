const { PrismaClient } = require('@prisma/client');

// Singleton pattern — reuse the same Prisma client in dev to avoid
// exhausting database connection pool from hot-module reloads
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
