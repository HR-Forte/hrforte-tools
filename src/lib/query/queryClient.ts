import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

export const QUERY_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status?: number }).status;
          if (typeof status === 'number' && status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: false, // never auto-retry writes (merges, deletes, syncs aren't idempotent)
      onError: error => {
        console.error('Mutation error:', error);
      },
    },
  },
};

// Module-specific configurations
export const MODULE_QUERY_CONFIG = {
  auth: {
    staleTime: 15 * 60 * 1000, // 15 minutes for auth data
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  users: {
    staleTime: 10 * 60 * 1000, // 10 minutes for user data
    gcTime: 20 * 60 * 1000, // 20 minutes
  },
  products: {
    staleTime: 5 * 60 * 1000, // 5 minutes for product data
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  analytics: {
    staleTime: 2 * 60 * 1000, // 2 minutes for analytics
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
} as const;

export const queryClient = new QueryClient(QUERY_CONFIG);
