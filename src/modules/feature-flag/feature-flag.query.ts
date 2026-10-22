import { createQueryKeys } from '@lukemorales/query-key-factory';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import featureFlagClient from './feature-flag.client';
import { EndpointName } from '@/lib/api/types';
import {
  CreateCompanyFeatureFlagBody,
  GetFeatureFlagCompanyOverridesParams,
  UpdateCompanyFeatureFlagBody,
  UpdateDefaultFeatureFlagBody,
} from './feature-flag.type';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { toast } from 'sonner';
import { queryClient } from '@/lib/query/queryClient';

export const featureFlagQueries = createQueryKeys('feature-flag', {
  all: null,
  list: (params?: GetFeatureFlagCompanyOverridesParams, endpoint?: EndpointName) => ({
    queryKey: [{ params, endpoint }],
    queryFn: async () => await featureFlagClient.getFeatureFlagCompanyOverrides(params, endpoint),
  }),
  default: (endpoint?: EndpointName) => ({
    queryKey: [{ endpoint }],
    queryFn: async () => await featureFlagClient.getDefaultFeatureFlag(endpoint),
  }),
});

export const useGetFeatureFlagCompanyOverrides = (
  params?: GetFeatureFlagCompanyOverridesParams,
  endpoint?: EndpointName
) => {
  return useCustomQuery({
    ...featureFlagQueries.list(params, endpoint),
  });
};

export const useDefaultFeatureFlags = (endpoint: EndpointName) => {
  return useCustomQuery({
    ...featureFlagQueries.default(endpoint),
  });
};

export const useUpdateDefaultFeatureFlag = (endpoint?: EndpointName) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (body: UpdateCompanyFeatureFlagBody) =>
      await featureFlagClient.updateDefaultFeatureFlag(body, endpoint),
    onSettled: (data, error) => {
      if (error) {
        toast.error('Failed to update default feature flag');
      } else {
        toast.success('Default feature flag updated successfully');
      }

      queryClient.invalidateQueries({ queryKey: featureFlagQueries.default._def });
    },
  });
};

export const useCreateCompanyFeatureFlag = (endpoint?: EndpointName) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (args: { companyId: number; body: CreateCompanyFeatureFlagBody }) =>
      await featureFlagClient.createCompanyFeatureFlag(args.companyId, args.body, endpoint),
    onSettled: (data, error) => {
      if (error) {
        toast.error('Failed to create company feature flag');
      } else {
        toast.success('Company feature flag created successfully');
      }

      queryClient.invalidateQueries({ queryKey: featureFlagQueries.list._def });
    },
  });
};

export const useUpdateCompanyFeatureFlag = (endpoint?: EndpointName) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (args: { companyId: number; body: UpdateCompanyFeatureFlagBody }) =>
      await featureFlagClient.updateCompanyFeatureFlag(args.companyId, args.body, endpoint),
    onSettled: (data, error) => {
      if (error) {
        toast.error('Failed to update company feature flag');
      } else {
        toast.success('Company feature flag updated successfully');
      }

      queryClient.invalidateQueries({ queryKey: featureFlagQueries.list._def });
    },
  });
};

export const useDeleteCompanyFeatureFlag = (endpoint?: EndpointName) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (companyId: number) => await featureFlagClient.deleteCompanyFeatureFlag(companyId, endpoint),
    onSettled: (data, error) => {
      if (error) {
        toast.error('Failed to delete company feature flag');
      } else {
        toast.success('Company feature flag deleted successfully');
      }

      queryClient.invalidateQueries({ queryKey: featureFlagQueries.list._def });
    },
  });
};
