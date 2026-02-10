import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prismaDirect: PrismaClient };

/**
 * Direct Prisma Client for performance testing
 *
 * This client connects directly to PostgreSQL (bypassing Prisma Accelerate)
 * for benchmarking purposes.
 *
 * NOTE: This is only for testing/benchmarking. Do not use in production
 * without proper connection pooling (e.g., PgBouncer).
 */
export const prismaDirect =
  globalForPrisma.prismaDirect ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaDirect = prismaDirect;
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prismaDirect.$disconnect();
  });
}
