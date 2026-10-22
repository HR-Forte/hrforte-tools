import { Role as PrismaRole } from '@/lib/generated/prisma';

// Base Role type from Prisma
export type Role = PrismaRole;

export type CustomRole = Pick<Role, 'id' | 'name' | 'description'>;
