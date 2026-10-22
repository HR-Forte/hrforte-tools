import eSmartTimeClient from './esmart-time.client';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { queryClient } from '@/lib/query/queryClient';
import { companyQueries } from '../company/company.query';
import { toast } from 'sonner';
import { EndpointName } from '@/lib/api/types';

export const useSyncESmartTime = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (args: { companyId: number }) => await eSmartTimeClient.syncESmartTime(args.companyId, endpoint),
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: companyQueries.list._def });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('E-Smart Time synced successfully');
      }
    },
    ...(options || {}),
  });
};

export const useUnsyncESmartTime = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (args: { companyId: number }) =>
      await eSmartTimeClient.unsyncESmartTime(args.companyId, endpoint),
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: companyQueries.list._def });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('E-Smart Time unsynced successfully');
      }
    },
    ...(options || {}),
  });
};
