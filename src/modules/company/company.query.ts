import { createQueryKeys } from '@lukemorales/query-key-factory';
import { GetAllCompanyWithESmartTimeAndAskGenieParams } from './company.type';
import companyClient from './company.client';
import { EndpointName } from '@/lib/api/types';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';

export const companyQueries = createQueryKeys('company', {
  all: null,
  list: (params?: GetAllCompanyWithESmartTimeAndAskGenieParams, endpoint?: EndpointName) => ({
    queryKey: [{ params, endpoint }],
    queryFn: async () => await companyClient.getAllCompanyWithESmartTimeAndAskGenie(params, endpoint),
  }),
});

export const useGetAllCompanyWithESmartTimeAndAskGenie = (
  params?: GetAllCompanyWithESmartTimeAndAskGenieParams,
  endpoint?: EndpointName,
  options?: unknown
) => {
  return useCustomQuery({
    topBarLoading: true,
    ...companyQueries.list(params, endpoint),
    ...(options || {}),
  });
};
