import { createQueryKeys } from '@lukemorales/query-key-factory';
import changeLogClient from './change-log.client';
import {
  CreateAppReleaseBody,
  CreateAppReleaseByDateRangeBody,
  CreateComponentReleaseBody,
  GetAllAppReleasesParams,
  GetAllComponentReleasesParams,
  GetAllComponentReleasesResponse,
  UpdateAppReleaseBody,
  UpdateComponentReleaseBody,
} from './change-log.type';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { queryClient } from '@/lib/query/queryClient';
import { toast } from 'sonner';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { EndpointName } from '@/lib/api/types';
import { DefaultError, InfiniteData, UseInfiniteQueryOptions, UseQueryOptions } from '@tanstack/react-query';
import { useCustomInfiniteQuery } from '@/lib/hooks/useCustomInfiniteQuery';

export const componentReleaseQueries = createQueryKeys('componentRelease', {
  all: null,
  list: (params?: GetAllComponentReleasesParams, endpoint?: EndpointName) => ({
    queryKey: [{ params, endpoint }],
    queryFn: async () => await changeLogClient.getAllComponentReleases(params, endpoint),
  }),
});

export const appReleaseQueries = createQueryKeys('appRelease', {
  all: null,
  list: (params?: GetAllAppReleasesParams, endpoint?: EndpointName) => ({
    queryKey: [{ params, endpoint }],
    queryFn: async () => await changeLogClient.getAllAppReleases(params, endpoint),
  }),
});

export const useGetAllComponentReleases = (
  params?: GetAllComponentReleasesParams,
  endpoint?: EndpointName,
  options?: UseQueryOptions
) => {
  return useCustomQuery({
    topBarLoading: true,
    ...componentReleaseQueries.list(params, endpoint),
    ...((options as unknown) || {}),
  });
};

type ComponentReleaseInfiniteParams = Omit<GetAllComponentReleasesParams, 'page'>;
type ComponentReleaseListQueryKey = ReturnType<(typeof componentReleaseQueries)['list']>['queryKey'];

export const useGetInfiniteAllComponentReleases = (
  params?: ComponentReleaseInfiniteParams,
  endpoint?: EndpointName,
  options?: Partial<
    UseInfiniteQueryOptions<
      GetAllComponentReleasesResponse,
      DefaultError,
      InfiniteData<GetAllComponentReleasesResponse>,
      ComponentReleaseListQueryKey,
      number
    >
  >
) => {
  const listParams = params ? { ...params } : undefined;
  const queryOptions = componentReleaseQueries.list(listParams, endpoint);

  return useCustomInfiniteQuery<
    GetAllComponentReleasesResponse,
    DefaultError,
    InfiniteData<GetAllComponentReleasesResponse>,
    ComponentReleaseListQueryKey,
    number
  >({
    topBarLoading: true,
    ...queryOptions,
    initialPageParam: 1,
    getNextPageParam: lastPage => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    queryFn: async ({ pageParam = 1 }) =>
      await changeLogClient.getAllComponentReleases({ ...(params ?? {}), page: pageParam }, endpoint),
    ...((options as unknown) || {}),
  });
};

export const useGetAllAppReleases = (params?: GetAllAppReleasesParams, endpoint?: EndpointName, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: true,
    ...appReleaseQueries.list(params, endpoint),
    ...(options || {}),
  });
};

export const useGetRecommendedAppVersion = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: true,
    queryKey: ['appVersions', endpoint],
    queryFn: async () => await changeLogClient.getRecommendedAppVersion(endpoint),
    ...(options || {}),
  });
};

export const useCreateAppRelease = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (body?: CreateAppReleaseBody) => await changeLogClient.createAppRelease(body, endpoint),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to create app release');
      } else {
        toast.success('App release created successfully');
      }

      queryClient.invalidateQueries({ queryKey: appReleaseQueries.list._def });
      queryClient.invalidateQueries({ queryKey: ['appVersions', endpoint] });
    },
    ...(options || {}),
  });
};

export const useCreateAppReleaseByDateRange = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (body?: CreateAppReleaseByDateRangeBody) =>
      await changeLogClient.createAppReleaseByDateRange(body, endpoint),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to create app release by date range');
      } else {
        toast.success('App release by date range created successfully');
      }
      queryClient.invalidateQueries({ queryKey: appReleaseQueries.list._def });
      queryClient.invalidateQueries({ queryKey: ['appVersions', endpoint] });
    },
    ...(options || {}),
  });
};

export const useReviewCreateAppReleaseByDateRange = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (body?: CreateAppReleaseByDateRangeBody) =>
      await changeLogClient.reviewCreateAppReleaseByDateRange(body, endpoint),
    ...(options || {}),
  });
};

export const useUpdateAppRelease = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (args: { id: number; body?: UpdateAppReleaseBody; generateContent?: boolean }) =>
      await changeLogClient.updateAppRelease(args.id, args.body, args.generateContent, endpoint),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to update app release');
      } else {
        toast.success('App release updated successfully');
      }

      queryClient.invalidateQueries({ queryKey: appReleaseQueries.list._def });
      queryClient.invalidateQueries({ queryKey: ['appVersions', endpoint] });
    },
    ...(options || {}),
  });
};

export const useDeleteAppRelease = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (id: number) => await changeLogClient.deleteAppRelease(id, endpoint),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to delete app release');
      } else {
        toast.success('App release deleted successfully');
      }

      queryClient.invalidateQueries({ queryKey: appReleaseQueries.list._def });
      queryClient.invalidateQueries({ queryKey: ['appVersions', endpoint] });
    },
    ...(options || {}),
  });
};

export const useCreateComponentRelease = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (body?: CreateComponentReleaseBody) =>
      await changeLogClient.createComponentRelease(body, endpoint),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to create component release');
      } else {
        toast.success('Component release created successfully');
      }

      queryClient.invalidateQueries({ queryKey: componentReleaseQueries.list._def });
    },
    ...(options || {}),
  });
};

export const useUpdateComponentRelease = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (args: { id: number; body?: UpdateComponentReleaseBody }) =>
      await changeLogClient.updateComponentRelease(args.id, args.body, endpoint),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to update component release');
      } else {
        toast.success('Component release updated successfully');
      }

      queryClient.invalidateQueries({ queryKey: componentReleaseQueries.list._def });
    },
    ...(options || {}),
  });
};

export const useDeleteComponentRelease = (endpoint?: EndpointName, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (id: number) => await changeLogClient.deleteComponentRelease(id, endpoint),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to delete component release');
      } else {
        toast.success('Component release deleted successfully');
      }

      queryClient.invalidateQueries({ queryKey: componentReleaseQueries.list._def });
    },
    ...(options || {}),
  });
};
