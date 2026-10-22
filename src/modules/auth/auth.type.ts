import { SafeUser, User, UserWithRoles } from '../user/user.model';

export interface LoginResponse {
  user: User;
  roles: { id: string; name: string }[];
  accessToken: string;
  refreshToken: string;
}

export interface SignUpResponse {
  user: SafeUser;
}

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name?: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
  roles?: { id: string; name: string }[];
  typ?: TokenType;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface ProfileResponse {
  user: UserWithRoles;
}
