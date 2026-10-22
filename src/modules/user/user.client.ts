import { BaseClient } from '@/modules/_base/base.client';
import { UpdateUserInput, GetAllUsersParams, GetAllUsersResponse, CreateUserInput } from './user.type';
import { SafeUser, User, UserWithRoles } from './user.model';
import { ApiResponse } from '@/lib/api/types';

export class UserClient extends BaseClient {
  private readonly basePath = '/user';

  constructor() {
    super();
  }

  async getUserById(id: string) {
    return await this.get<ApiResponse<SafeUser>>(`${this.basePath}/${id}`);
  }

  async getAllUsers(params?: GetAllUsersParams) {
    return await this.get<ApiResponse<GetAllUsersResponse>>('/users', {
      queryParams: params,
    });
  }

  async createUser(data: CreateUserInput) {
    return await this.post<ApiResponse<SafeUser>>('/users', data);
  }

  async updateUser(id: string, data: UpdateUserInput) {
    const response = await this.put<ApiResponse<SafeUser>>(`${this.basePath}/${id}`, data);
    return response;
  }

  async assignRole(userId: string, roleId: string) {
    return await this.post<ApiResponse<{ id: string }>>(`${this.basePath}/${userId}/roles`, { roleId });
  }

  async unassignRole(userId: string, roleId: string) {
    return await this.delete<ApiResponse<{ success: boolean }>>(`${this.basePath}/${userId}/roles/${roleId}`);
  }

  async archiveUser(id: string) {
    return await this.patch<ApiResponse<SafeUser>>(`${this.basePath}/${id}/archive`);
  }

  async unarchiveUser(id: string) {
    return await this.patch<ApiResponse<SafeUser>>(`${this.basePath}/${id}/unarchive`);
  }
}

export const userClient = new UserClient();
