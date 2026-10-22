import { createQueryKeys } from '@lukemorales/query-key-factory';
import healthClient from './health.client';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { EndpointName } from '@/lib/api/types';

export const healthQueries = createQueryKeys('health', {
  all: null,
  version: (endpoint: EndpointName) => ({
    queryKey: [{ endpoint }],
    queryFn: async () => await healthClient.getVersion(endpoint),
  }),
  esmartTimeVersion: (endpoint: EndpointName) => ({
    queryKey: [{ endpoint }],
    queryFn: async () => await healthClient.getESmartTimeVersion(endpoint),
  }),
  netCoreVersion: (endpoint: EndpointName) => ({
    queryKey: [{ endpoint }],
    queryFn: async () => await healthClient.getNETCoreVersion(endpoint),
  }),
});

export const useHealthVersion = (endpoint: EndpointName) => {
  return useCustomQuery({
    topBarLoading: true,
    ...healthQueries.version(endpoint),
    retry: 1, // report a down service quickly instead of ~7s of backoff
  });
};

export const useESmartTimeVersion = (endpoint: EndpointName) => {
  return useCustomQuery({
    topBarLoading: true,
    ...healthQueries.esmartTimeVersion(endpoint),
    retry: 1, // report a down service quickly instead of ~7s of backoff
  });
};

export const useNETCoreVersion = (endpoint: EndpointName) => {
  return useCustomQuery({
    topBarLoading: true,
    ...healthQueries.netCoreVersion(endpoint),
    retry: 1, // report a down service quickly instead of ~7s of backoff
  });
};
