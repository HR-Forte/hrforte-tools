import type { User, SafeUser } from './user.model';
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

export const isAdmin = (user?: { roles?: { name: string }[] } | null) => !!user?.roles?.some(r => r.name === 'Admin');
