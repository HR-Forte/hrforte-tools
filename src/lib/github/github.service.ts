import { GITHUB_API_URL, GITHUB_ORG, GITHUB_TOKEN } from '@/config/server';
import ErrorService from '@/lib/error/errorService';

type GithubRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

const DEFAULT_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

function getGithubToken() {
  if (!GITHUB_TOKEN) {
    throw ErrorService.createError({
      type: 'TOKEN_MISSING',
      message: 'GitHub token is required',
    });
  }

  return GITHUB_TOKEN;
}

function buildUrl(path: string, query?: GithubRequestOptions['query']) {
  const url = new URL(path, GITHUB_API_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url;
}

// Paths interpolate owner/repo/org/name from user input. Reject anything that could change which
// GitHub endpoint is hit (dot segments, query/fragment injection, backslashes, empty segments).
function assertSafePath(path: string) {
  const segments = path.split('/').slice(1);
  const unsafe =
    /[?#\\\s]/.test(path) ||
    segments.some(segment => {
      let decoded: string;
      try {
        decoded = decodeURIComponent(segment);
      } catch {
        return true;
      }
      return !segment || decoded === '.' || decoded === '..' || decoded.includes('/');
    });

  if (unsafe) {
    throw ErrorService.createError({ type: 'INVALID_FORMAT', message: 'Invalid GitHub owner, repository or name' });
  }
}

async function githubRequest<T>(path: string, options: GithubRequestOptions = {}): Promise<T> {
  assertSafePath(path);
  const token = getGithubToken();
  const url = buildUrl(path, options.query);

  const response = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers: {
      ...DEFAULT_HEADERS,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `GitHub request failed (${response.status})`;
    let errorBody: unknown = null;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    // Handle GitHub 404 Not Found
    if (response.status === 404) {
      const body = typeof errorBody === 'object' && errorBody ? (errorBody as Record<string, unknown>) : {};
      const message =
        typeof body.message === 'string' ? body.message : 'Resource not found. The PR may have been merged or deleted.';

      throw ErrorService.createError({
        type: 'NOT_FOUND',
        message,
        options: {
          details: {
            status: 404,
            documentation_url: typeof body.documentation_url === 'string' ? body.documentation_url : undefined,
          },
        },
      });
    }

    // Handle GitHub 422 Validation Failed - extract actual validation errors
    if (response.status === 422) {
      const body = typeof errorBody === 'object' && errorBody ? (errorBody as Record<string, unknown>) : {};
      const message = typeof body.message === 'string' ? body.message : 'Validation Failed';
      const errors = Array.isArray(body.errors) ? body.errors : [];
      const errorParts = errors
        .map((e: Record<string, unknown>) => {
          const field = e.field ?? 'unknown';
          const msg = e.message ?? e.code ?? 'invalid';
          return `${field}: ${msg}`;
        })
        .filter(Boolean);
      const detailedMessage = errorParts.length > 0 ? errorParts.join('; ') : message;

      throw ErrorService.createError({
        type: 'GITHUB_VALIDATION_ERROR',
        message: detailedMessage,
        options: {
          details: {
            status: 422,
            githubErrors: errors,
            documentation_url: typeof body.documentation_url === 'string' ? body.documentation_url : undefined,
          },
        },
      });
    }

    if (typeof errorBody === 'object' && errorBody && 'message' in errorBody) {
      errorMessage = String((errorBody as { message?: string }).message || errorMessage);
    }

    throw ErrorService.createError({
      type: 'UNKNOWN_ERROR',
      message: errorMessage,
      options: {
        details: {
          status: response.status,
          body: errorBody,
        },
      },
    });
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

export async function listOrgRepos(params?: { org?: string; page?: number; perPage?: number }) {
  const org = params?.org || GITHUB_ORG;
  return await githubRequest(`/orgs/${org}/repos`, {
    query: {
      per_page: params?.perPage || 50,
      page: params?.page || 1,
      sort: 'updated',
      direction: 'desc',
    },
  });
}

export async function createPullRequest(payload: {
  owner: string;
  repo: string;
  title: string;
  head: string;
  base: string;
  body?: string;
  draft?: boolean;
}) {
  return await githubRequest(`/repos/${payload.owner}/${payload.repo}/pulls`, {
    method: 'POST',
    body: {
      title: payload.title,
      head: payload.head,
      base: payload.base,
      body: payload.body,
      draft: payload.draft,
    },
  });
}

export async function getPullRequest(params: { owner: string; repo: string; number: number }) {
  return await githubRequest(`/repos/${params.owner}/${params.repo}/pulls/${params.number}`);
}

export async function mergePullRequest(payload: {
  owner: string;
  repo: string;
  number: number;
  merge_method?: 'merge' | 'squash' | 'rebase';
  commit_title?: string;
  commit_message?: string;
}) {
  return await githubRequest(`/repos/${payload.owner}/${payload.repo}/pulls/${payload.number}/merge`, {
    method: 'PUT',
    body: {
      merge_method: payload.merge_method,
      commit_title: payload.commit_title,
      commit_message: payload.commit_message,
    },
  });
}

export async function mergeBranches(payload: {
  owner: string;
  repo: string;
  base: string;
  head: string;
  commit_message?: string;
}) {
  return await githubRequest(`/repos/${payload.owner}/${payload.repo}/merges`, {
    method: 'POST',
    body: {
      base: payload.base,
      head: payload.head,
      commit_message: payload.commit_message,
    },
  });
}

export async function listPullRequestFiles(params: { owner: string; repo: string; number: number }) {
  return await githubRequest(`/repos/${params.owner}/${params.repo}/pulls/${params.number}/files`, {
    query: {
      per_page: 100,
      page: 1,
    },
  });
}

export async function getRepo(params: { owner: string; repo: string }) {
  return await githubRequest(`/repos/${params.owner}/${params.repo}`);
}

export async function listRepoPulls(params: {
  owner: string;
  repo: string;
  state?: 'open' | 'closed' | 'all';
  perPage?: number;
  page?: number;
}) {
  return await githubRequest(
    `/repos/${params.owner}/${params.repo}/pulls`,
    {
      query: {
        state: params.state || 'open',
        per_page: params.perPage || 30,
        page: params.page || 1,
      },
    }
  );
}

export async function updatePullRequest(payload: {
  owner: string;
  repo: string;
  number: number;
  title?: string;
  body?: string | null;
  state?: 'open' | 'closed';
}) {
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.body !== undefined) body.body = payload.body;
  if (payload.state !== undefined) body.state = payload.state;

  if (Object.keys(body).length === 0) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'At least one of title, body, or state is required',
    });
  }

  return await githubRequest(`/repos/${payload.owner}/${payload.repo}/pulls/${payload.number}`, {
    method: 'PATCH',
    body,
  });
}

// --- Actions Secrets ---

export type GithubActionsSecret = {
  name: string;
  created_at: string;
  updated_at: string;
};

export type GithubActionsSecretsResponse = {
  total_count: number;
  secrets: GithubActionsSecret[];
};

export type GithubActionsSecretPublicKey = {
  key_id: string;
  key: string;
};

export async function listRepoSecrets(owner: string, repo: string) {
  return await githubRequest<GithubActionsSecretsResponse>(
    `/repos/${owner}/${repo}/actions/secrets`,
    { query: { per_page: 100, page: 1 } }
  );
}

export async function getRepoSecretsPublicKey(owner: string, repo: string) {
  return await githubRequest<GithubActionsSecretPublicKey>(
    `/repos/${owner}/${repo}/actions/secrets/public-key`
  );
}

async function encryptSecret(publicKey: string, plainValue: string): Promise<string> {
  const sodiumModule = await import('libsodium-wrappers-sumo');
  const sodium = (sodiumModule as { default?: typeof sodiumModule }).default ?? sodiumModule;
  await sodium.ready;
  const binkey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const binsec = sodium.from_string(plainValue);
  const encBytes = sodium.crypto_box_seal(binsec, binkey);
  return sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
}

export async function createOrUpdateRepoSecret(
  owner: string,
  repo: string,
  name: string,
  plainValue: string,
  publicKey?: GithubActionsSecretPublicKey // pass when writing many secrets to one repo
) {
  const { key_id, key } = publicKey ?? (await getRepoSecretsPublicKey(owner, repo));
  const encrypted_value = await encryptSecret(key, plainValue);

  return await githubRequest(`/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: { encrypted_value, key_id },
  });
}

export async function deleteRepoSecret(owner: string, repo: string, name: string) {
  return await githubRequest(`/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}

// --- Actions Variables ---

export type GithubActionsVariable = {
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
};

export type GithubActionsVariablesResponse = {
  total_count: number;
  variables: GithubActionsVariable[];
};

export async function listRepoVariables(owner: string, repo: string) {
  return await githubRequest<GithubActionsVariablesResponse>(
    `/repos/${owner}/${repo}/actions/variables`,
    { query: { per_page: 30, page: 1 } }
  );
}

export async function createRepoVariable(owner: string, repo: string, name: string, value: string) {
  return await githubRequest(`/repos/${owner}/${repo}/actions/variables`, {
    method: 'POST',
    body: { name, value },
  });
}

export async function updateRepoVariable(
  owner: string,
  repo: string,
  name: string,
  value: string,
  newName?: string
) {
  const body: { value?: string; name?: string } = { value };
  if (newName !== undefined) body.name = newName;

  return await githubRequest(
    `/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(name)}`,
    {
      method: 'PATCH',
      body,
    }
  );
}

export async function deleteRepoVariable(owner: string, repo: string, name: string) {
  return await githubRequest(
    `/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(name)}`,
    {
      method: 'DELETE',
    }
  );
}
