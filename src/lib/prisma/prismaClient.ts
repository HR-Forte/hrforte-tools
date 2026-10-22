import { PrismaClient } from '../generated/prisma';

// Reuse one client per process; in dev, keep it on globalThis so hot reloads don't open new connection pools.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
