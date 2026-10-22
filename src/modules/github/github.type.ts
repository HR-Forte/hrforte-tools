export type GithubRepoOwner = {
  login: string;
  avatar_url?: string;
};

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  owner: GithubRepoOwner;
  topics?: string[];
};

export type GithubReposResponse = {
  data: GithubRepo[];
  page: number;
  perPage: number;
  hasNextPage: boolean;
  rules?: string | null;
};

export type GithubPullRequestRef = {
  ref: string;
  sha: string;
};

/** Pull request from list endpoint (GET /repos/{owner}/{repo}/pulls) - additions, deletions, changed_files, mergeable, mergeable_state only from getPullRequest */
export type GithubGeneralPullRequest = {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  state: string;
  html_url: string;
  user?: GithubRepoOwner;
  head?: GithubPullRequestRef;
  base?: GithubPullRequestRef;
  created_at?: string;
  updated_at?: string;
};

/** Full pull request from get single endpoint (GET /repos/{owner}/{repo}/pulls/{number}) */
export type GithubPullRequest = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  mergeable: boolean | null;
  mergeable_state: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
  user?: GithubRepoOwner;
  head: GithubPullRequestRef;
  base: GithubPullRequestRef;
  created_at: string;
};

export type GithubPullRequestFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

export type CreatePullRequestPayload = {
  owner: string;
  repo: string;
  title: string;
  head: string;
  base: string;
  prBody?: string;
  draft?: boolean;
};

export type MergePullRequestPayload = {
  owner: string;
  repo: string;
  number: number;
  merge_method?: 'merge' | 'squash' | 'rebase';
  commit_title?: string;
  commit_message?: string;
};

export type UpdatePullRequestPayload = {
  owner: string;
  repo: string;
  number: number;
  title?: string;
  body?: string | null;
  state?: 'open' | 'closed';
};

export type GithubRepoDetail = GithubRepo & {
  stargazers_count?: number;
  updated_at?: string;
};

// --- Actions Secrets & Variables ---

export type GithubActionsSecret = {
  name: string;
  created_at: string;
  updated_at: string;
};

export type GithubActionsSecretsResponse = {
  total_count: number;
  secrets: GithubActionsSecret[];
};

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

export type BulkSecretItem = { owner: string; repo: string; name: string; value: string };
export type BulkVariableItem = { owner: string; repo: string; name: string; value: string };
