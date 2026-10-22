import githubClient from '@/modules/github/github.client';
import type { GithubPullRequest } from '@/modules/github/github.type';
import type { ApiResponse } from '@/lib/api/types';

export function unwrapPr(result: ApiResponse<GithubPullRequest> | GithubPullRequest): GithubPullRequest {
  return result && typeof result === 'object' && 'data' in result ? result.data : result;
}

export function getErrorMessage(err: unknown): string {
  const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
  if (axiosErr?.response?.data?.message) return axiosErr.response.data.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function fetchPullRequestWithRetry(
  owner: string,
  repo: string,
  number: number
): Promise<GithubPullRequest> {
  let attempt = 0;
  let res = unwrapPr(
    (await githubClient.getPullRequest({ owner, repo, number })) as ApiResponse<GithubPullRequest> | GithubPullRequest
  );
  while ((res.mergeable === null || res.mergeable_state === null) && attempt < 5) {
    attempt++;
    await sleep(1500);
    res = unwrapPr(
      (await githubClient.getPullRequest({ owner, repo, number })) as ApiResponse<GithubPullRequest> | GithubPullRequest
    );
  }
  return res;
}
