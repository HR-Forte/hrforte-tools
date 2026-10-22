import { BaseClient } from '@/modules/_base/base.client';
import { CustomRole } from './role.model';
import { ApiResponse } from '@/lib/api/types';

export class RoleClient extends BaseClient {
  private readonly basePath = '/roles';

  constructor() {
    super();
  }

  async getAllRoles() {
    return await this.get<ApiResponse<CustomRole[]>>(this.basePath);
  }
}

export const roleClient = new RoleClient();
