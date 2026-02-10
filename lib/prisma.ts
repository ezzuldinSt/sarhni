import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Prisma Client singleton optimized for Vercel serverless functions
 *
 * Key optimizations for Vercel:
 * - Connection pooling via PgBouncer (handled by Vercel Postgres)
 * - Lazy connection initialization
 * - Automatic connection cleanup on cold starts
 *
 * @see {@link https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices}
 * @see {@link https://vercel.com/kb/guide/connection-pooling-with-functions}
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown: close Prisma connections on process exit
// This is important for development hot-reloading and proper cleanup
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
