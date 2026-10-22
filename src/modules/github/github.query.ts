import { createQueryKeys } from '@lukemorales/query-key-factory';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { queryClient } from '@/lib/query/queryClient';
import { toast } from 'sonner';
import githubClient from './github.client';
import {
  BulkSecretItem,
  BulkVariableItem,
  CreatePullRequestPayload,
  MergePullRequestPayload,
  UpdatePullRequestPayload,
} from './github.type';

export const githubQueries = createQueryKeys('github', {
  repos: (params?: { page?: number; perPage?: number; org?: string }) => ({
    queryKey: ['repos', params],
    queryFn: async () => (await githubClient.getRepos(params)).data,
  }),
  repo: (owner: string, repo: string) => ({
    queryKey: ['repo', owner, repo],
    queryFn: async () => (await githubClient.getRepo(owner, repo)).data,
  }),
  repoPulls: (
    owner: string,
    repo: string,
    params?: { state?: 'open' | 'closed' | 'all'; perPage?: number; page?: number }
  ) => ({
    queryKey: ['repoPulls', owner, repo, params],
    queryFn: async () => (await githubClient.listRepoPulls(owner, repo, params)).data,
  }),
  pullRequest: (params: { owner: string; repo: string; number: number }) => ({
    queryKey: [{ params }],
    queryFn: async () => (await githubClient.getPullRequest(params)).data,
  }),
  pullRequestFiles: (params: { owner: string; repo: string; number: number }) => ({
    queryKey: [{ params }],
    queryFn: async () => (await githubClient.getPullRequestFiles(params)).data,
  }),
  repoSecrets: (owner: string, repo: string) => ({
    queryKey: ['repoSecrets', owner, repo],
    queryFn: async () => (await githubClient.listRepoSecrets(owner, repo)).data,
  }),
  repoVariables: (owner: string, repo: string) => ({
    queryKey: ['repoVariables', owner, repo],
    queryFn: async () => (await githubClient.listRepoVariables(owner, repo)).data,
  }),
});

export const useGithubRepos = (params?: { page?: number; perPage?: number; org?: string }, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: true,
    ...githubQueries.repos(params),
    ...(options || {}),
  });
};

export const useGithubRepo = (owner: string, repo: string, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: false,
    ...githubQueries.repo(owner, repo),
    enabled: Boolean(owner && repo),
    ...(options || {}),
  });
};

export const useGithubRepoPulls = (
  owner: string,
  repo: string,
  params?: { state?: 'open' | 'closed' | 'all'; perPage?: number; page?: number },
  options?: unknown
) => {
  return useCustomQuery({
    topBarLoading: false,
    ...githubQueries.repoPulls(owner, repo, params),
    enabled: Boolean(owner && repo),
    ...(options || {}),
  });
};

export const useUpdatePullRequest = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: UpdatePullRequestPayload) => await githubClient.updatePullRequest(payload),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to update pull request');
      } else {
        toast.success('Pull request updated successfully');
      }
      queryClient.invalidateQueries({ queryKey: githubQueries.repoPulls._def });
      queryClient.invalidateQueries({ queryKey: githubQueries.pullRequest._def });
    },
    ...(options || {}),
  });
};

export const useGithubPullRequest = (params: { owner: string; repo: string; number: number }, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: false,
    ...githubQueries.pullRequest(params),
    ...(options || {}),
  });
};

export const useGithubPullRequestFiles = (
  params: { owner: string; repo: string; number: number },
  options?: unknown
) => {
  return useCustomQuery({
    topBarLoading: false,
    ...githubQueries.pullRequestFiles(params),
    ...(options || {}),
  });
};

function getErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message ?? err.message ?? 'Failed to create pull request';
}

export const useCreatePullRequest = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: CreatePullRequestPayload) => await githubClient.createPullRequest(payload),
    onSettled: (_, error) => {
      if (error) {
        toast.error(getErrorMessage(error));
      } else {
        toast.success('Pull request created successfully');
      }
      queryClient.invalidateQueries({ queryKey: githubQueries.repoPulls._def });
    },
    ...(options || {}),
  });
};

export const useMergePullRequest = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: MergePullRequestPayload) => await githubClient.mergePullRequest(payload),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to merge pull request');
      } else {
        toast.success('Pull request merged successfully');
      }
      queryClient.invalidateQueries({ queryKey: githubQueries.repoPulls._def });
      queryClient.invalidateQueries({ queryKey: githubQueries.pullRequest._def });
    },
    ...(options || {}),
  });
};

export const useMergeBranches = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: {
      owner: string;
      repo: string;
      base: string;
      head: string;
      commitMessage?: string;
    }) => await githubClient.mergeBranches(payload),
    onSettled: (_, error) => {
      if (error) {
        toast.error('Failed to merge branches');
      } else {
        toast.success('Branches merged successfully');
      }
    },
    ...(options || {}),
  });
};

// --- Actions Secrets & Variables ---

export const useRepoSecrets = (owner: string, repo: string, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: false,
    ...githubQueries.repoSecrets(owner, repo),
    enabled: Boolean(owner && repo),
    ...(options || {}),
  });
};

export const useRepoVariables = (owner: string, repo: string, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: false,
    ...githubQueries.repoVariables(owner, repo),
    enabled: Boolean(owner && repo),
    ...(options || {}),
  });
};

const invalidateSecrets = (owner: string, repo: string) => {
  queryClient.invalidateQueries({ queryKey: githubQueries.repoSecrets(owner, repo).queryKey });
};

const invalidateVariables = (owner: string, repo: string) => {
  queryClient.invalidateQueries({ queryKey: githubQueries.repoVariables(owner, repo).queryKey });
};

export const useCreateOrUpdateRepoSecret = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: { owner: string; repo: string; name: string; value: string }) =>
      await githubClient.createOrUpdateRepoSecret(payload.owner, payload.repo, payload.name, payload.value),
    onSettled: (_, error, payload) => {
      if (error) {
        toast.error('Failed to create or update secret');
      } else {
        toast.success('Secret saved successfully');
      }

      invalidateSecrets(payload.owner, payload.repo);
    },
    ...(options || {}),
  });
};

export const useDeleteRepoSecret = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: { owner: string; repo: string; name: string }) =>
      await githubClient.deleteRepoSecret(payload.owner, payload.repo, payload.name),
    onSettled: (_, error, payload) => {
      if (error) {
        toast.error('Failed to delete secret');
      } else {
        toast.success('Secret deleted successfully');
      }
      invalidateSecrets(payload.owner, payload.repo);
    },
    ...(options || {}),
  });
};

export const useCreateRepoVariable = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: { owner: string; repo: string; name: string; value: string }) =>
      await githubClient.createRepoVariable(payload.owner, payload.repo, payload.name, payload.value),
    onSettled: (_, error, payload) => {
      if (error) {
        toast.error('Failed to create variable');
      } else {
        toast.success('Variable created successfully');
      }
      invalidateVariables(payload.owner, payload.repo);
    },
    ...(options || {}),
  });
};

export const useUpdateRepoVariable = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: { owner: string; repo: string; name: string; value: string; newName?: string }) =>
      await githubClient.updateRepoVariable(payload.owner, payload.repo, payload.name, payload.value, payload.newName),
    onSettled: (_, error, payload) => {
      if (error) {
        toast.error('Failed to update variable');
      } else {
        toast.success('Variable updated successfully');
      }
      invalidateVariables(payload.owner, payload.repo);
    },
    ...(options || {}),
  });
};

export const useDeleteRepoVariable = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (payload: { owner: string; repo: string; name: string }) =>
      await githubClient.deleteRepoVariable(payload.owner, payload.repo, payload.name),
    onSettled: (_, error, payload) => {
      if (error) {
        toast.error('Failed to delete variable');
      } else {
        toast.success('Variable deleted successfully');
      }
      invalidateVariables(payload.owner, payload.repo);
    },
    ...(options || {}),
  });
};

export const useBulkCreateOrUpdateSecrets = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (items: BulkSecretItem[]) => await githubClient.bulkCreateOrUpdateSecrets(items),
    onSettled: (_, error, items) => {
      if (error) {
        toast.error('Bulk secrets operation failed');
      } else {
        toast.success('Bulk secrets operation completed');
      }
      items.forEach(item => invalidateSecrets(item.owner, item.repo));
    },
    ...(options || {}),
  });
};

export const useBulkDeleteSecrets = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (items: { owner: string; repo: string; name: string }[]) =>
      await githubClient.bulkDeleteSecrets(items),
    onSettled: (_, error, items) => {
      if (error) {
        toast.error('Bulk delete secrets failed');
      } else {
        toast.success('Bulk delete secrets completed');
      }
      items.forEach(item => invalidateSecrets(item.owner, item.repo));
    },
    ...(options || {}),
  });
};

export const useBulkCreateOrUpdateVariables = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (items: BulkVariableItem[]) => await githubClient.bulkCreateOrUpdateVariables(items),
    onSettled: (_, error, items) => {
      if (error) {
        toast.error('Bulk variables operation failed');
      } else {
        toast.success('Bulk variables operation completed');
      }
      items.forEach(item => invalidateVariables(item.owner, item.repo));
    },
    ...(options || {}),
  });
};

export const useBulkDeleteVariables = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (items: { owner: string; repo: string; name: string }[]) =>
      await githubClient.bulkDeleteVariables(items),
    onSettled: (_, error, items) => {
      if (error) {
        toast.error('Bulk delete variables failed');
      } else {
        toast.success('Bulk delete variables completed');
      }
      items.forEach(item => invalidateVariables(item.owner, item.repo));
    },
    ...(options || {}),
  });
};
