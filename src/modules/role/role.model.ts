import { Role as PrismaRole } from '@/lib/generated/prisma';

// Base Role type from Prisma
export type Role = PrismaRole;

export type CustomRole = Pick<Role, 'id' | 'name' | 'description'>;

export const ROLE = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  USER: 'User',
} as const;

// Roles that are never listed in the UI/API and cannot be assigned or removed from the app (migration only)
export const HIDDEN_ROLES: string[] = [ROLE.SUPER_ADMIN];
