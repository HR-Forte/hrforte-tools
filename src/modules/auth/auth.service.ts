import prisma from '@/lib/prisma/prismaClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterInput, JwtPayload, LoginResponse, LoginInput, SignUpResponse, TokenType } from './auth.type';
import { toSafeUser } from '../user/user.util';
import { BCRYPT_SALT_ROUNDS, JWT_EXPIRES_IN, JWT_SECRET, REFRESH_TOKEN_EXPIRES_IN } from '@/config/server';
import ErrorService from '@/lib/error/errorService';
import { UserWithRoles } from '../user/user.model';
import { CustomRole } from '../role/role.model';

// Valid bcrypt hash of a random string; used to equalize login timing for unknown emails
const DUMMY_HASH = '$2b$10$Aqg9mkwnhkT.882HWl0gDOQtEs1HXdQVQYl0SJfrOPGZ3u8hdlcUm';

class AuthService {
  private generateToken(payload: JwtPayload, expiresIn: string, typ: TokenType): string {
    return jwt.sign({ ...payload, typ }, JWT_SECRET, { expiresIn, algorithm: 'HS256' });
  }

  private verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    } catch {
      throw ErrorService.createError({ type: 'TOKEN_INVALID' });
    }
  }

  private async getActiveRoles(userId: string) {
    const assignments = await prisma.roleAssignment.findMany({
      where: { userId, isDeleted: false, role: { is: { isDeleted: false } } },
      select: { role: { select: { id: true, name: true } } },
    });
    return assignments.map(a => a.role);
  }

  private issueTokens(payload: JwtPayload) {
    return {
      accessToken: this.generateToken(payload, JWT_EXPIRES_IN, 'access'),
      refreshToken: this.generateToken(payload, REFRESH_TOKEN_EXPIRES_IN, 'refresh'),
    };
  }

  async login(data: LoginInput): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email, isDeleted: false },
    });

    // Same error for unknown email and wrong password (no user enumeration);
    // compare against a dummy hash so both paths take similar time.
    const isPasswordValid = await bcrypt.compare(data.password, user?.password ?? DUMMY_HASH);
    if (!user || !isPasswordValid) {
      throw ErrorService.createError({ type: 'INVALID_CREDENTIALS' });
    }

    const roles = await this.getActiveRoles(user.id);

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      roles,
    };

    return { user, roles, ...this.issueTokens(payload) };
  }

  async register(data: RegisterInput): Promise<SignUpResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email, isDeleted: false },
    });

    if (existingUser) {
      throw ErrorService.createError({ type: 'USER_ALREADY_EXISTS' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    // Check if password and confirm password match
    if (data.password !== data.confirmPassword) {
      throw ErrorService.createError({ type: 'PASSWORD_MISMATCH' });
    }

    // Create user
    const user = await prisma.user.create({
      data: { email: data.email, password: hashedPassword, name: data.name },
    });

    return { user: toSafeUser(user) };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.verifyToken(refreshToken);
    if (payload.typ !== 'refresh') {
      throw ErrorService.createError({ type: 'INVALID_REFRESH_TOKEN' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isDeleted: false },
    });

    if (!user) {
      throw ErrorService.createError({ type: 'INVALID_REFRESH_TOKEN' });
    }

    return this.issueTokens({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      roles: await this.getActiveRoles(user.id),
    });
  }

  async verifyAccessToken(accessToken: string): Promise<JwtPayload> {
    return this.verifyToken(accessToken);
  }

  /**
   * Build UserWithRoles from JWT payload without DB calls. Use for auth on most endpoints.
   */
  getUserFromTokenLight(token: string): UserWithRoles | null {
    try {
      const payload = this.verifyToken(token);
      // Refresh tokens must not be usable as access tokens (legacy tokens without typ are access tokens)
      if (payload.typ === 'refresh') return null;
      const roles: CustomRole[] = (payload.roles || []).map(r => ({
        id: r.id,
        name: r.name,
        description: '',
      }));
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name ?? null,
        roles,
      } as UserWithRoles;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
