import { EndpointName } from '@/lib/api/types';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { queryClient } from '@/lib/query/queryClient';
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { toast } from 'sonner';
import { companyQueries } from '../company/company.query';
import askGenieClient from './askgenie.client';

export const askGenieQueries = createQueryKeys('askGenie', {});

export const useSyncAskGenie = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (args: { companyId: number; endpoint: EndpointName }) =>
      await askGenieClient.syncAskGenie(args.companyId, args.endpoint),
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: companyQueries.list._def });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('AskGenie synced successfully');
      }
    },
    ...(options || {}),
  });
};

export const useUnsyncAskGenie = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (args: { companyId: number; endpoint: EndpointName }) =>
      await askGenieClient.unsyncAskGenie(args.companyId, args.endpoint),
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: companyQueries.list._def });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('AskGenie unsynced successfully');
      }
    },
    ...(options || {}),
  });
};

export const useSyncAllAskGenie = (options?: unknown) => {
  return useCustomMutation({
    mutationFn: async (endpoint: EndpointName) => await askGenieClient.syncAllAskGenie(endpoint),
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: companyQueries.list._def });

      if (error) {
        console.error(error);
        toast.error(error.message);
      } else {
        toast.success('AskGenie synced successfully');
      }
    },
    ...(options || {}),
  });
};

export const useUnsyncAllAskGenie = (options?: unknown) => {
  return useCustomMutation({
    mutationFn: async (endpoint: EndpointName) => await askGenieClient.unsyncAllAskGenie(endpoint),
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: companyQueries.list._def });

      if (error) {
        console.error(error);
        toast.error(error.message);
      } else {
        toast.success('AskGenie unsynced successfully');
      }
    },
    ...(options || {}),
  });
};
