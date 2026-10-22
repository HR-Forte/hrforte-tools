'use client';

import { memo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { ExternalLink, AlertCircle, FileText, GitMerge, Loader2 } from 'lucide-react';
import { useMergePullRequest } from '@/modules/github/github.query';
import type { RepoActionLog } from '../_types';
import { ActionStatusIcon } from './action-status-icon';

function getStatusVariant(status: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (status) {
    case 'success': return 'outline';
    case 'failed': return 'destructive';
    case 'in_progress': return 'default';
    default: return 'secondary';
  }
}

function getBorderClass(status: string): string {
  switch (status) {
    case 'success': return 'border-green-500/30 bg-green-500/5';
    case 'failed': return 'border-destructive/30 bg-destructive/5';
    case 'in_progress': return 'border-primary/30 bg-primary/5';
    default: return 'border-border/50';
  }
}

interface RepoActionLogEntryProps {
  log: RepoActionLog;
  runId: string;
}

export const RepoActionLogEntry = memo(function RepoActionLogEntry({ log, runId }: RepoActionLogEntryProps) {
  const displayName = REPO_NAME_MAPPING[log.repoFullName]?.name ?? log.repoFullName;
  const repoColor = REPO_NAME_MAPPING[log.repoFullName]?.color;
  const statusVariant = getStatusVariant(log.status);
  const borderClass = getBorderClass(log.status);
  const shadowClass = log.status === 'success'
    ? 'shadow-green-500/5'
    : log.status === 'failed'
      ? 'shadow-destructive/5'
      : '';

  const mergePullRequest = useMergePullRequest();
  const [owner, repo] = log.repoFullName.split('/');
  const canMerge = log.prNumber != null && log.status !== 'success';
  const [confirmMerge, setConfirmMerge] = useState(false);

  const handleMerge = () => {
    if (!owner || !repo || log.prNumber == null) return;
    return mergePullRequest.mutateAsync({ owner, repo, number: log.prNumber });
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm transition-all ${borderClass} ${shadowClass}`}>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3'>
          <Badge
            style={repoColor ? { backgroundColor: repoColor } : undefined}
            className='shrink-0 font-medium px-2.5 py-0.5'
          >
            {displayName}
          </Badge>
          {log.prNumber != null ? (
            <span className='text-sm text-muted-foreground'>
              {log.prUrl ? (
                <a
                  href={log.prUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1.5 font-medium text-primary hover:underline underline-offset-2'
                >
                  PR #{log.prNumber}
                  <ExternalLink className='h-3.5 w-3.5' />
                </a>
              ) : (
                <>PR #{log.prNumber}</>
              )}
            </span>
          ) : null}
          {log.conflict ? (
            <Badge variant='destructive' className='gap-1'>
              <AlertCircle className='h-3 w-3' />
              Conflict
            </Badge>
          ) : null}
          <Badge
            variant={statusVariant}
            className={`shrink-0 capitalize ${log.status === 'success' ? 'border-green-500/50 text-green-600 dark:text-green-400' : ''}`}
          >
            {log.status}
          </Badge>
        </div>
        {canMerge ? (
          <Button
            size='sm'
            variant='outline'
            className='h-8 cursor-pointer gap-1.5 border-green-500/40 text-green-600 transition-colors duration-200 hover:bg-green-500/10 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
            onClick={() => setConfirmMerge(true)}
            disabled={mergePullRequest.isPending}
          >
            {mergePullRequest.isPending ? (
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
            ) : (
              <GitMerge className='h-3.5 w-3.5' />
            )}
            Merge PR
          </Button>
        ) : null}
      </div>

      <div className='mt-4 space-y-3'>
        <div className='flex flex-wrap gap-4'>
          {log.actions.map(a => (
            <div
              key={`${runId}-${log.repoFullName}-${a.label}`}
              className='flex items-center gap-2.5 rounded-lg bg-background/50 px-3 py-2 text-sm'
            >
              <ActionStatusIcon status={a.status} />
              <span className='text-muted-foreground'>{a.label}</span>
              <span
                className={`font-medium capitalize ${
                  a.status === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : a.status === 'failed' || a.status === 'skipped'
                      ? 'text-destructive'
                      : 'text-foreground'
                }`}
              >
                {a.status}
                {a.message ? <span className='font-normal text-muted-foreground'> · {a.message}</span> : null}
              </span>
            </div>
          ))}
        </div>

        {log.changes ? (
          <div className='flex flex-wrap items-center gap-4 rounded-xl bg-muted/40 px-4 py-3'>
            <span className='flex items-center gap-2 text-sm'>
              <FileText className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium'>{log.changes.changedFiles} files</span>
            </span>
            <span className='flex items-center gap-1.5 text-sm'>
              <span className='font-semibold text-green-600 dark:text-green-400'>
                +{log.changes.additions}
              </span>
              <span className='text-muted-foreground'>/</span>
              <span className='font-semibold text-red-600 dark:text-red-400'>-{log.changes.deletions}</span>
            </span>
            <span className='text-sm text-muted-foreground'>{log.changes.total} total changes</span>
          </div>
        ) : null}

        {log.error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3'>
            <p className='flex items-center gap-2 text-sm font-medium text-destructive'>
              <AlertCircle className='h-4 w-4 shrink-0' />
              {log.error}
            </p>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmMerge}
        onOpenChange={setConfirmMerge}
        title={`Merge PR #${log.prNumber}?`}
        description={`Merge PR #${log.prNumber} in ${log.repoFullName}.`}
        confirmLabel='Merge'
        variant='default'
        onConfirm={handleMerge}
      />
    </div>
  );
});
