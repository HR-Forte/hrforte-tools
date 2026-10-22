import { HRForteApiResponse } from '@/lib/api/types';
import { UserWithRoles } from './user.model';

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  createdBy?: string;
}

export interface UpdateUserInput {
  avatar?: string;
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string; // Required when changing password
}

export type GetAllUsersParams = {
  page?: number;
  take?: number;
  q?: string;
  archived?: boolean;
};

export type GetAllUsersResponse = HRForteApiResponse<UserWithRoles>;
