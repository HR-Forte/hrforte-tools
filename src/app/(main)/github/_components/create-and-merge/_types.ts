import type { GithubPullRequest } from '@/modules/github/github.type';

export type ActionStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped';

export type RepoAction = {
  label: string;
  status: ActionStatus;
  message?: string;
};

export type RepoActionLog = {
  repoFullName: string;
  status: ActionStatus;
  actions: RepoAction[];
  prNumber?: number;
  prUrl?: string;
  conflict?: boolean;
  changes?: {
    additions: number;
    deletions: number;
    changedFiles: number;
    total: number;
  };
  error?: string;
};

export type StoredCreatedPr = {
  pr: GithubPullRequest;
  repoFullName: string;
  createdAt: string;
};

export type StoredQuickMergeRun = {
  id: string;
  timestamp: string;
  title: string;
  base: string;
  head: string;
  actionLogs: RepoActionLog[];
};

export type QuickMergeOverrides = {
  base?: string;
  head?: string;
  title?: string;
  body?: string;
  draft?: boolean;
  repos?: string[];
};

export const STORAGE_KEY_CREATED_PRS = 'github-create-merge-created-prs';
export const STORAGE_KEY_QUICK_MERGE_HISTORY = 'github-create-merge-quick-merge-history';
export const MAX_STORED_RUNS = 20;

export const DEFAULT_ACTIONS: RepoAction[] = [
  { label: 'Create PR', status: 'pending' },
  { label: 'Check mergeability', status: 'pending' },
  { label: 'Merge PR', status: 'pending' },
];
