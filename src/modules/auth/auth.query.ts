import { createQueryKeys } from '@lukemorales/query-key-factory';
import { useQuery } from '@tanstack/react-query';
import authClient from './auth.client';
import { LoginInput } from './auth.type';
import { removeAccessToken, removeRefreshToken } from './auth.util';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { AppError } from '@/lib/error/appError';

export const authQueries = createQueryKeys('auth', {
  detail: {
    queryKey: null,
    queryFn: async () => {
      try {
        const response = await authClient.getProfile();
        return response.data.user;
      } catch (error) {
        removeAccessToken();
        removeRefreshToken();

        if (typeof window !== 'undefined') {
          window.location.replace('/sign-in');
        }

        throw error;
      }
    },
  },
});

export const useGetProfile = ({ options = {} }) => {
  return useQuery({
    ...authQueries.detail,
    ...options,
  });
};

export const useLogin = () => {
  return useCustomMutation({
    mutationFn: async (credentials: LoginInput) => await authClient.login(credentials),
    onError: (error: AxiosError<AppError>) => {
      const errorMessage = error.response?.data?.message || error.message;

      toast.error(errorMessage);
    },
  });
};
