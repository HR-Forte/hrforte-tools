import type { User, SafeUser } from './user.model';
import { HIDDEN_ROLES, ROLE } from '../role/role.model';
// Utility function to convert User to SafeUser (removes sensitive data)
export function toSafeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
}


// Utility function to convert array of Users to SafeUsers
export function toSafeUsers(users: User[]): SafeUser[] {
  return users.map(toSafeUser);
}

// Validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // Minimum 8 characters, at least one letter and one number
  return (
    password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password)
  );
}

export function validateName(name: string): boolean {
  return name.length >= 2 && name.length <= 100;
}

type WithRoleNames = { roles?: { name: string }[] } | null | undefined;

export const isSuperAdmin = (user?: WithRoleNames) => !!user?.roles?.some(r => r.name === ROLE.SUPER_ADMIN);

// Super Admin has every Admin permission
export const isAdmin = (user?: WithRoleNames) =>
  !!user?.roles?.some(r => r.name === ROLE.ADMIN || r.name === ROLE.SUPER_ADMIN);

// Strip hidden roles (e.g. Super Admin) before listing/displaying roles
export const withoutHiddenRoles = <T extends { name: string }>(roles?: T[] | null): T[] =>
  (roles ?? []).filter(r => !HIDDEN_ROLES.includes(r.name));
