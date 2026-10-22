import { User as PrismaUser } from '@/lib/generated/prisma';
import { CustomRole } from '../role/role.model';

// Base User type from Prisma
export type User = PrismaUser;

// Safe User type (without sensitive data like password)
export type SafeUser = Omit<User, 'password'>;

export type UserWithRoles = User & { roles?: CustomRole[] };
