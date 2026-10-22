import { BaseClient } from '@/modules/_base/base.client';
import { ApiResponse } from '@/lib/api/types';
import {
  LoginInput,
  LoginResponse,
  ProfileResponse,
  RefreshTokenInput,
  RefreshTokenResponse,
  RegisterInput,
  SignUpResponse,
} from './auth.type';

export class AuthClient extends BaseClient {
  private readonly basePath = 'auth';

  constructor() {
    super();
  }

  async login(credentials: LoginInput) {
    return this.post<ApiResponse<LoginResponse>, LoginInput>(`${this.basePath}/login`, credentials);
  }

  async register(data: RegisterInput) {
    return this.post<ApiResponse<SignUpResponse>, RegisterInput>(`${this.basePath}/register`, data);
  }

  async logout() {
    return this.post<void>(`${this.basePath}/logout`);
  }

  async refreshToken(data: RefreshTokenInput) {
    return this.post<ApiResponse<RefreshTokenResponse>, RefreshTokenInput>(`${this.basePath}/refresh`, data);
  }

  async getProfile() {
    return this.get<ApiResponse<ProfileResponse>>(`${this.basePath}/profile`);
  }
}

export default new AuthClient();
