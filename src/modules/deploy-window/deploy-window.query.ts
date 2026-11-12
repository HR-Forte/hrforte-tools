import { createQueryKeys } from '@lukemorales/query-key-factory';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { EndpointName } from '@/lib/api/types';
import deployWindowClient from './deploy-window.client';
import { DeployWindowParams } from './deploy-window.type';

export const deployWindowQueries = createQueryKeys('deploy-window', {
  analysis: (params: DeployWindowParams, endpoint: EndpointName) => ({
    queryKey: [{ params, endpoint }],
    queryFn: async () => await deployWindowClient.getAnalysis(params, endpoint),
  }),
  readiness: (params: DeployWindowParams, endpoint: EndpointName) => ({
    queryKey: [{ params, endpoint }],
    queryFn: async () => await deployWindowClient.getReadiness(params, endpoint),
  }),
});

export const useDeployWindowAnalysis = (params: DeployWindowParams, endpoint: EndpointName) => {
  return useCustomQuery({
    topBarLoading: true,
    ...deployWindowQueries.analysis(params, endpoint),
    staleTime: 10 * 60 * 1000, // 28 days of history barely moves within a session
    retry: 1,
  });
};

// Every readiness check is a deliberate decision: no refetch on focus or reconnect, only the Re-check button.
export const useDeployWindowReadiness = (params: DeployWindowParams, endpoint: EndpointName) => {
  return useCustomQuery({
    topBarLoading: true,
    ...deployWindowQueries.readiness(params, endpoint),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};
