import { userClient } from './user.client';
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { UpdateUserInput, GetAllUsersParams, CreateUserInput } from './user.type';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { queryClient } from '@/lib/query/queryClient';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { AppError } from '@/lib/error/appError';
import { CustomRole } from '@/modules/role/role.model';

export const userQueries = createQueryKeys('user', {
  all: (params?: GetAllUsersParams) => ({
    queryKey: [params],
    queryFn: async () => (await userClient.getAllUsers(params)).data,
  }),
  detail: (id: string) => ({
    queryKey: [{ id }],
    queryFn: async () => (await userClient.getUserById(id)).data,
  }),
});

type UsersListData = { data?: import('./user.model').UserWithRoles[] } & Record<string, unknown>;

function updateUserRolesInCache(
  updater: (users: import('./user.model').UserWithRoles[]) => import('./user.model').UserWithRoles[],
) {
  queryClient.setQueriesData(
    { predicate: (query) => query.queryKey[0] === 'user' && query.queryKey[1] === 'all' },
    (old: UsersListData | undefined) => {
      if (!old?.data) return old;
      return { ...old, data: updater(old.data) };
    },
  );
}

export const useGetAllUsers = (params?: GetAllUsersParams, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: true,
    ...userQueries.all(params),
    ...(options || {}),
  });
};

export const useGetUserById = (id: string, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: true,
    ...userQueries.detail(id),
    ...(options || {}),
  });
};

export const useCreateUser = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (data: CreateUserInput) => {
      const response = await userClient.createUser(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.all._def });
      toast.success('User created successfully');
    },
    onError: (error: AxiosError<AppError>) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(errorMessage);
    },
    ...(options || {}),
  });
};

export const useUpdateUser = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await userClient.updateUser(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.detail._def });
      queryClient.invalidateQueries({ queryKey: userQueries.all._def });
    },
    onError: (error: AxiosError<AppError>) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(errorMessage);
    },
    ...(options || {}),
  });
};

export const useArchiveUser = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (id: string) => {
      const response = await userClient.archiveUser(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.all._def });
      toast.success('User archived successfully');
    },
    onError: (error: AxiosError<AppError>) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(errorMessage);
    },
    ...(options || {}),
  });
};

export const useUnarchiveUser = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (id: string) => {
      const response = await userClient.unarchiveUser(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueries.all._def });
      toast.success('User unarchived successfully');
    },
    onError: (error: AxiosError<AppError>) => {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(errorMessage);
    },
    ...(options || {}),
  });
};

export type AssignRoleVariables = {
  userId: string;
  roleId: string;
  role?: CustomRole;
};

export const useAssignRole = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: false,
    mutationFn: async ({ userId, roleId }: AssignRoleVariables) => {
      const response = await userClient.assignRole(userId, roleId);
      return response.data;
    },
    onMutate: async ({ userId, role }: AssignRoleVariables) => {
      if (!role) return;
      const previousData = queryClient.getQueriesData<UsersListData>({
        predicate: (query) => query.queryKey[0] === 'user' && query.queryKey[1] === 'all',
      });
      updateUserRolesInCache(users =>
        users.map(u => (u.id === userId ? { ...u, roles: [...(u.roles || []), role] } : u)),
      );
      return { previousData };
    },
    onSuccess: (_, { role }) => {
      if (!role) {
        queryClient.invalidateQueries({ queryKey: userQueries.all._def });
      }
      toast.success('Role assigned successfully');
    },
    onError: (error: AxiosError<AppError>, { role }, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          if (data) queryClient.setQueryData(queryKey, data);
        });
      }
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(errorMessage);
    },
    ...(options || {}),
  });
};

export type UnassignRoleVariables = {
  userId: string;
  roleId: string;
};

export const useUnassignRole = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: false,
    mutationFn: async ({ userId, roleId }: UnassignRoleVariables) => {
      const response = await userClient.unassignRole(userId, roleId);
      return response.data;
    },
    onMutate: async ({ userId, roleId }: UnassignRoleVariables) => {
      const previousData = queryClient.getQueriesData<UsersListData>({
        predicate: (query) => query.queryKey[0] === 'user' && query.queryKey[1] === 'all',
      });
      updateUserRolesInCache(users =>
        users.map(u =>
          u.id === userId ? { ...u, roles: (u.roles || []).filter(r => r.id !== roleId) } : u,
        ),
      );
      return { previousData };
    },
    onSuccess: () => {
      toast.success('Role unassigned successfully');
    },
    onError: (error: AxiosError<AppError>, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          if (data) queryClient.setQueryData(queryKey, data);
        });
      }
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(errorMessage);
    },
    ...(options || {}),
  });
};
