import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { MANAGED_REPO_NAMES } from '@/modules/change-log/change-log.const';
import githubClient from '@/modules/github/github.client';
import type { GithubPullRequest } from '@/modules/github/github.type';
import type { ApiResponse } from '@/lib/api/types';
import type { RepoActionLog, StoredQuickMergeRun, QuickMergeOverrides } from '../_types';
import { DEFAULT_ACTIONS, STORAGE_KEY_QUICK_MERGE_HISTORY, MAX_STORED_RUNS } from '../_types';
import { unwrapPr, getErrorMessage, fetchPullRequestWithRetry } from '../_lib/github-pr-helpers';

export function useQuickMerge() {
  const [quickSelectedRepos, setQuickSelectedRepos] = useState<Set<string>>(new Set([]));
  const [quickMergeHistory, setQuickMergeHistory] = useState<StoredQuickMergeRun[]>([]);
  const [quickBase, setQuickBase] = useState('');
  const [quickHead, setQuickHead] = useState('develop');
  const [quickTitle, setQuickTitle] = useState('Quick PR');
  const [quickBody, setQuickBody] = useState('');
  const [quickDraft, setQuickDraft] = useState(false);
  const [quickRunning, setQuickRunning] = useState(false);
  const [actionLogs, setActionLogs] = useState<RepoActionLog[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_QUICK_MERGE_HISTORY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredQuickMergeRun[];
        if (Array.isArray(parsed)) setQuickMergeHistory(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleQuickRepo = useCallback((fullName: string) => {
    setQuickSelectedRepos(prev => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });
  }, []);

  const selectAllQuickRepos = useCallback(() => setQuickSelectedRepos(new Set(MANAGED_REPO_NAMES)), []);
  const clearQuickRepos = useCallback(() => setQuickSelectedRepos(new Set()), []);

  const clearHistory = useCallback(() => {
    setQuickMergeHistory([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY_QUICK_MERGE_HISTORY);
    } catch {
      // ignore
    }
  }, []);

  const runQuickMerge = useCallback(
    async (overrides?: QuickMergeOverrides) => {
      const base = overrides?.base ?? quickBase;
      const head = overrides?.head ?? quickHead;
      const prTitle = overrides?.title ?? quickTitle;
      const body = overrides?.body ?? quickBody;
      const draft = overrides?.draft ?? quickDraft;
      const targetRepos = overrides?.repos ?? Array.from(quickSelectedRepos);

      if (!prTitle || !head || !base) {
        toast.error('Title, head, and base are required');
        return;
      }
      if (!targetRepos.length) {
        toast.error('Select at least one repository');
        return;
      }

      const initialLogs: RepoActionLog[] = targetRepos.map(repoFullName => ({
        repoFullName,
        status: 'pending' as const,
        actions: DEFAULT_ACTIONS.map(a => ({ ...a })),
      }));
      setQuickRunning(true);
      setActionLogs(initialLogs);

      let currentLogs = initialLogs.map(l => ({ ...l, actions: l.actions.map(a => ({ ...a })) }));
      const syncLog = (repoFullName: string, updater: (log: RepoActionLog) => RepoActionLog) => {
        currentLogs = currentLogs.map(log => (log.repoFullName === repoFullName ? updater(log) : log));
        setActionLogs([...currentLogs]);
      };
      const syncMarkAction = (
        repoFullName: string,
        actionLabel: string,
        status: RepoActionLog['status'],
        message?: string
      ) => {
        syncLog(repoFullName, log => ({
          ...log,
          actions: log.actions.map(a => (a.label === actionLabel ? { ...a, status, message } : a)),
        }));
      };

      let hasFailures = false;
      for (const fullName of targetRepos) {
        const [owner, repoName] = fullName.split('/');
        let failedAction = 'Create PR';
        syncLog(fullName, l => ({ ...l, status: 'in_progress' }));
        syncMarkAction(fullName, 'Create PR', 'in_progress');

        try {
          const result = (await githubClient.createPullRequest({
            owner,
            repo: repoName,
            title: prTitle,
            head,
            base,
            prBody: body,
            draft,
          })) as ApiResponse<GithubPullRequest> | GithubPullRequest;
          const pr = unwrapPr(result);

          syncLog(fullName, l => ({ ...l, prNumber: pr.number, prUrl: pr.html_url }));
          syncMarkAction(fullName, 'Create PR', 'success');
          failedAction = 'Check mergeability';
          syncMarkAction(fullName, 'Check mergeability', 'in_progress');

          const prStatus = await fetchPullRequestWithRetry(owner, repoName, pr.number);
          syncLog(fullName, l => ({
            ...l,
            conflict: prStatus.mergeable_state === 'dirty',
            changes: {
              additions: prStatus.additions,
              deletions: prStatus.deletions,
              changedFiles: prStatus.changed_files,
              total: prStatus.additions + prStatus.deletions,
            },
          }));
          syncMarkAction(
            fullName,
            'Check mergeability',
            prStatus.mergeable_state === 'dirty' ? 'failed' : 'success',
            prStatus.mergeable_state ?? undefined
          );

          if (prStatus.mergeable_state === 'dirty' || prStatus.mergeable === false) {
            hasFailures = true;
            syncMarkAction(fullName, 'Merge PR', 'skipped', 'Conflicts detected');
            syncLog(fullName, l => ({ ...l, status: 'failed', error: 'Conflicts detected' }));
            toast.error(`${fullName}: Conflicts detected`);
            continue;
          }

          // GitHub rejects merging draft PRs: leave them open for review instead of failing the run
          if (draft) {
            syncMarkAction(fullName, 'Merge PR', 'skipped', 'Draft PR — merge after review');
            syncLog(fullName, l => ({ ...l, status: 'success' }));
            continue;
          }

          failedAction = 'Merge PR';
          syncMarkAction(fullName, 'Merge PR', 'in_progress');
          await githubClient.mergePullRequest({
            owner,
            repo: repoName,
            number: pr.number,
            merge_method: 'merge',
          });
          syncMarkAction(fullName, 'Merge PR', 'success');
          syncLog(fullName, l => ({ ...l, status: 'success' }));
        } catch (err) {
          hasFailures = true;
          const msg = getErrorMessage(err);
          syncLog(fullName, l => ({ ...l, status: 'failed', error: msg }));
          syncMarkAction(fullName, failedAction, 'failed', msg);
          toast.error(`${fullName}: ${msg}`);
        }
      }
      setQuickRunning(false);
      if (!hasFailures) toast.success('Quick merge completed');

      const runEntry: StoredQuickMergeRun = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
        title: prTitle,
        base,
        head,
        actionLogs: [...currentLogs],
      };
      setQuickMergeHistory(prev => {
        const next = [runEntry, ...prev].slice(0, MAX_STORED_RUNS);
        try {
          sessionStorage.setItem(STORAGE_KEY_QUICK_MERGE_HISTORY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      setActionLogs([]);
    },
    [quickBase, quickHead, quickTitle, quickBody, quickDraft, quickSelectedRepos]
  );

  return {
    quickSelectedRepos,
    quickMergeHistory,
    quickBase,
    setQuickBase,
    quickHead,
    setQuickHead,
    quickTitle,
    setQuickTitle,
    quickBody,
    setQuickBody,
    quickDraft,
    setQuickDraft,
    quickRunning,
    actionLogs,
    toggleQuickRepo,
    selectAllQuickRepos,
    clearQuickRepos,
    clearHistory,
    runQuickMerge,
  };
}
