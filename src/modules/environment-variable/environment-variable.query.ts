import { createQueryKeys } from '@lukemorales/query-key-factory';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { queryClient } from '@/lib/query/queryClient';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { AppError } from '@/lib/error/appError';
import { environmentVariableClient } from './environment-variable.client';
import {
  Environment,
  EnvironmentVariable,
  CreateEnvironmentInput,
  UpdateEnvironmentInput,
  BulkVariablesPayload,
} from './environment-variable.type';

export const environmentVariableQueries = createQueryKeys('environmentVariable', {
  environments: () => ({
    queryKey: ['environments'],
    queryFn: async () => (await environmentVariableClient.getEnvironments()).data,
  }),
  environmentDetail: (id: string) => ({
    queryKey: ['environment', id],
    queryFn: async () => (await environmentVariableClient.getEnvironment(id)).data,
  }),
  variables: (environmentId: string) => ({
    queryKey: ['variables', environmentId],
    queryFn: async () => (await environmentVariableClient.getVariables(environmentId)).data,
  }),
});

export const useEnvironments = (options?: unknown) => {
  return useCustomQuery({
    topBarLoading: true,
    ...environmentVariableQueries.environments(),
    ...(options || {}),
  });
};

export const useEnvironment = (id: string | null, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: false,
    ...environmentVariableQueries.environmentDetail(id ?? ''),
    enabled: Boolean(id),
    ...(options || {}),
  });
};

export const useVariables = (environmentId: string | null, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: false,
    ...environmentVariableQueries.variables(environmentId ?? ''),
    enabled: Boolean(environmentId),
    ...(options || {}),
  });
};

function getErrorMessage(error: unknown): string {
  const err = error as AxiosError<AppError>;
  return err.response?.data?.message ?? err.message ?? 'Operation failed';
}

function invalidateEnvironments() {
  queryClient.invalidateQueries({ queryKey: environmentVariableQueries.environments().queryKey });
}

function invalidateEnvironment(id: string) {
  queryClient.invalidateQueries({ queryKey: environmentVariableQueries.environmentDetail(id).queryKey });
}

function invalidateVariables(environmentId: string) {
  const variablesQueryKey = environmentVariableQueries.variables(environmentId).queryKey;
  queryClient.invalidateQueries({ queryKey: variablesQueryKey });
  queryClient.refetchQueries({ queryKey: variablesQueryKey });
}

function invalidateAllEnvironmentVariableQueries() {
  invalidateEnvironments();
}

export const useCreateEnvironment = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (data: CreateEnvironmentInput) =>
      (await environmentVariableClient.createEnvironment(data)).data.data,
    onSuccess: () => {
      invalidateEnvironments();
      toast.success('Environment created');
    },
    onError: error => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useUpdateEnvironment = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async ({ id, data }: { id: string; data: UpdateEnvironmentInput }) =>
      (await environmentVariableClient.updateEnvironment(id, data)).data.data,
    onSuccess: (_, { id }) => {
      invalidateEnvironments();
      invalidateEnvironment(id);
      toast.success('Environment updated');
    },
    onError: error => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useDeleteEnvironment = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (id: string) => {
      await environmentVariableClient.deleteEnvironment(id);
    },
    onSuccess: () => {
      invalidateEnvironments();
      toast.success('Environment deleted');
    },
    onError: error => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useCreateVariable = (environmentId: string, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async ({ key, value }: { key: string; value: string }) =>
      (await environmentVariableClient.createVariable(environmentId, key, value)).data.data,
    onSuccess: () => {
      invalidateVariables(environmentId);
      invalidateAllEnvironmentVariableQueries();
      toast.success('Variable created');
    },
    onError: error => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useUpdateVariable = (environmentId: string, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async ({ key, value }: { key: string; value: string }) =>
      (await environmentVariableClient.updateVariable(environmentId, key, value)).data.data,
    onSuccess: () => {
      invalidateVariables(environmentId);
      invalidateAllEnvironmentVariableQueries();
      toast.success('Variable updated');
    },
    onError: error => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useDeleteVariable = (environmentId: string, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (key: string) => {
      await environmentVariableClient.deleteVariable(environmentId, key);
    },
    onSuccess: () => {
      invalidateVariables(environmentId);
      invalidateAllEnvironmentVariableQueries();
      toast.success('Variable deleted');
    },
    onError: error => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useBulkVariables = (environmentId: string, options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: BulkVariablesPayload) =>
      (await environmentVariableClient.bulkVariables(environmentId, payload)).data.data,
    onSuccess: () => {
      invalidateVariables(environmentId);
      invalidateAllEnvironmentVariableQueries();
      toast.success('Bulk operation completed');
    },
    onError: error => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};
