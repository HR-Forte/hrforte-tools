import { roleClient } from './role.client';
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { CustomRole } from './role.model';

export const roleQueries = createQueryKeys('role', {
  all: {
    queryKey: null,
    queryFn: async () => (await roleClient.getAllRoles()).data,
  },
});

export const useGetAllRoles = (options?: unknown) => {
  return useCustomQuery({
    topBarLoading: false,
    ...roleQueries.all,
    ...(options || {}),
  });
};
