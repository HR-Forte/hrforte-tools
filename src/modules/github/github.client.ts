import { BaseClient } from '@/modules/_base/base.client';
import {
  CreatePullRequestPayload,
  GithubActionsSecretsResponse,
  GithubActionsVariablesResponse,
  GithubGeneralPullRequest,
  GithubPullRequest,
  GithubPullRequestFile,
  GithubReposResponse,
  GithubRepoDetail,
  MergePullRequestPayload,
  UpdatePullRequestPayload,
  BulkSecretItem,
  BulkVariableItem,
} from './github.type';
import { ApiResponse } from '@/lib/api/types';

export class GithubClient extends BaseClient {
  private readonly basePath = 'github';

  constructor() {
    super();
  }

  getRepo = async (owner: string, repo: string) => {
    return await this.get<ApiResponse<GithubRepoDetail>>(`/${this.basePath}/repos/${owner}/${repo}`, {
      endpoint: 'HRFORTE',
    });
  };

  listRepoPulls = async (
    owner: string,
    repo: string,
    params?: { state?: 'open' | 'closed' | 'all'; perPage?: number; page?: number }
  ) => {
    return await this.get<ApiResponse<GithubGeneralPullRequest[]>>(
      `/${this.basePath}/repos/${owner}/${repo}/pulls`,
      {
        queryParams: params,
        endpoint: 'HRFORTE',
      }
    );
  };

  updatePullRequest = async (payload: UpdatePullRequestPayload) => {
    const body: Record<string, unknown> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.body !== undefined) body.body = payload.body;
    if (payload.state !== undefined) body.state = payload.state;
    return await this.patch<ApiResponse<GithubPullRequest>>(
      `/${this.basePath}/pull-requests/${payload.number}`,
      body,
      { queryParams: { owner: payload.owner, repo: payload.repo }, endpoint: 'HRFORTE' }
    );
  };

  getRepos = async (params?: { page?: number; perPage?: number; org?: string }) => {
    return await this.get<ApiResponse<GithubReposResponse>>(`/${this.basePath}/repos`, {
      queryParams: params,
      endpoint: 'HRFORTE',
    });
  };

  createPullRequest = async (payload: CreatePullRequestPayload) => {
    return await this.post<GithubPullRequest>(`/${this.basePath}/pull-requests`, payload, {
      endpoint: 'HRFORTE',
    });
  };

  getPullRequest = async (params: { owner: string; repo: string; number: number }) => {
    return await this.get<ApiResponse<GithubPullRequest>>(`/${this.basePath}/pull-requests/${params.number}`, {
      queryParams: {
        owner: params.owner,
        repo: params.repo,
      },
      endpoint: 'HRFORTE',
    });
  };

  getPullRequestFiles = async (params: { owner: string; repo: string; number: number }) => {
    return await this.get<ApiResponse<GithubPullRequestFile[]>>(
      `/${this.basePath}/pull-requests/${params.number}/files`,
      {
        queryParams: {
          owner: params.owner,
          repo: params.repo,
        },
        endpoint: 'HRFORTE',
      }
    );
  };

  mergePullRequest = async (payload: MergePullRequestPayload) => {
    return await this.post(`/${this.basePath}/pull-requests/${payload.number}/merge`, payload, {
      endpoint: 'HRFORTE',
    });
  };

  mergeBranches = async (payload: {
    owner: string;
    repo: string;
    base: string;
    head: string;
    commitMessage?: string;
  }) => {
    return await this.post<ApiResponse<{ sha: string; merged: boolean; message: string }>>(
      `/${this.basePath}/repos/${payload.owner}/${payload.repo}/merges`,
      {
        base: payload.base,
        head: payload.head,
        commit_message: payload.commitMessage,
      },
      { endpoint: 'HRFORTE' }
    );
  };

  // --- Actions Secrets ---

  listRepoSecrets = async (owner: string, repo: string) => {
    return await this.get<ApiResponse<GithubActionsSecretsResponse>>(
      `/${this.basePath}/repos/${owner}/${repo}/actions/secrets`,
      { endpoint: 'HRFORTE' }
    );
  };

  createOrUpdateRepoSecret = async (owner: string, repo: string, name: string, value: string) => {
    return await this.put<ApiResponse<{ name: string }>>(
      `/${this.basePath}/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(name)}`,
      { value },
      { endpoint: 'HRFORTE' }
    );
  };

  deleteRepoSecret = async (owner: string, repo: string, name: string) => {
    return await this.delete<ApiResponse<null>>(
      `/${this.basePath}/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(name)}`,
      { endpoint: 'HRFORTE' }
    );
  };

  bulkCreateOrUpdateSecrets = async (items: BulkSecretItem[]) => {
    return await this.post<
      ApiResponse<{ results: { owner: string; repo: string; name: string; success: boolean; error?: string }[]; total: number; succeeded: number }>
    >(`/${this.basePath}/actions/secrets/bulk`, { items }, { endpoint: 'HRFORTE' });
  };

  bulkDeleteSecrets = async (items: { owner: string; repo: string; name: string }[]) => {
    return await this.getApiClient().request<
      ApiResponse<{ results: { owner: string; repo: string; name: string; success: boolean; error?: string }[]; total: number; succeeded: number }>,
      { items: { owner: string; repo: string; name: string }[] }
    >({
      method: 'DELETE',
      url: `/${this.basePath}/actions/secrets/bulk`,
      data: { items },
      endpoint: 'HRFORTE',
    });
  };

  // --- Actions Variables ---

  listRepoVariables = async (owner: string, repo: string) => {
    return await this.get<ApiResponse<GithubActionsVariablesResponse>>(
      `/${this.basePath}/repos/${owner}/${repo}/actions/variables`,
      { endpoint: 'HRFORTE' }
    );
  };

  createRepoVariable = async (owner: string, repo: string, name: string, value: string) => {
    return await this.post<ApiResponse<{ name: string; value: string }>>(
      `/${this.basePath}/repos/${owner}/${repo}/actions/variables`,
      { name, value },
      { endpoint: 'HRFORTE' }
    );
  };

  updateRepoVariable = async (
    owner: string,
    repo: string,
    name: string,
    value: string,
    newName?: string
  ) => {
    return await this.patch<ApiResponse<{ name: string }>>(
      `/${this.basePath}/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(name)}`,
      newName !== undefined ? { value, newName } : { value },
      { endpoint: 'HRFORTE' }
    );
  };

  deleteRepoVariable = async (owner: string, repo: string, name: string) => {
    return await this.delete<ApiResponse<null>>(
      `/${this.basePath}/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(name)}`,
      { endpoint: 'HRFORTE' }
    );
  };

  bulkCreateOrUpdateVariables = async (items: BulkVariableItem[]) => {
    return await this.post<
      ApiResponse<{ results: { owner: string; repo: string; name: string; success: boolean; error?: string }[]; total: number; succeeded: number }>
    >(`/${this.basePath}/actions/variables/bulk`, { items }, { endpoint: 'HRFORTE' });
  };

  bulkDeleteVariables = async (items: { owner: string; repo: string; name: string }[]) => {
    return await this.getApiClient().request<
      ApiResponse<{ results: { owner: string; repo: string; name: string; success: boolean; error?: string }[]; total: number; succeeded: number }>,
      { items: { owner: string; repo: string; name: string }[] }
    >({
      method: 'DELETE',
      url: `/${this.basePath}/actions/variables/bulk`,
      data: { items },
      endpoint: 'HRFORTE',
    });
  };
}

export default new GithubClient();
