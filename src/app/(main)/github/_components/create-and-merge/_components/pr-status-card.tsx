'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useGithubPullRequest, useMergePullRequest } from '@/modules/github/github.query';
import { REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import type { StoredCreatedPr } from '../_types';
import {
  ExternalLink,
  AlertCircle,
  GitMerge,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  GitPullRequest,
  ListChecks,
} from 'lucide-react';

interface PrStatusCardProps {
  createdPrs: StoredCreatedPr[];
  onClearAll: () => void;
}

interface PrRowProps {
  entry: StoredCreatedPr;
}

function getMergeableStatusInfo(state: string | undefined) {
  switch (state) {
    case 'clean':
      return { icon: CheckCircle2, label: 'Ready to merge', color: 'text-green-600 dark:text-green-500' };
    case 'dirty':
      return { icon: AlertCircle, label: 'Has conflicts', color: 'text-destructive' };
    case 'blocked':
      return { icon: XCircle, label: 'Blocked', color: 'text-orange-600 dark:text-orange-500' };
    case 'behind':
      return { icon: Clock, label: 'Behind base', color: 'text-yellow-600 dark:text-yellow-500' };
    case 'unstable':
      return { icon: AlertCircle, label: 'Unstable', color: 'text-yellow-600 dark:text-yellow-500' };
    default:
      return { icon: Clock, label: 'Checking...', color: 'text-muted-foreground' };
  }
}

function PrRow({ entry }: PrRowProps) {
  const [owner, repoName] = entry.repoFullName.split('/');
  const displayName = REPO_NAME_MAPPING[entry.repoFullName]?.name ?? entry.repoFullName;
  const repoColor = REPO_NAME_MAPPING[entry.repoFullName]?.color;

  const pullRequestQuery = useGithubPullRequest(
    { owner, repo: repoName, number: entry.pr.number },
    { refetchOnWindowFocus: false }
  );

  const mergePullRequest = useMergePullRequest();
  const [confirmMerge, setConfirmMerge] = useState(false);

  const prData = pullRequestQuery.data;
  const mergeableState = prData?.mergeable_state;
  const statusInfo = getMergeableStatusInfo(mergeableState);
  const StatusIcon = statusInfo.icon;

  const totalChanges = prData ? prData.additions + prData.deletions : 0;
  const isMerged = prData?.merged === true;
  const isClosed = prData?.state === 'closed' && !isMerged;
  const hasConflicts = mergeableState === 'dirty' || prData?.mergeable === false;
  const canShowMerge = !isMerged && !isClosed && !hasConflicts;

  const handleMerge = async () => {
    if (!prData) return;
    await mergePullRequest.mutateAsync({
      owner,
      repo: repoName,
      number: prData.number,
      merge_method: 'merge',
    });
  };

  return (
    <div className='group rounded-xl border border-border/50 bg-card/80 p-4 shadow-sm transition-all duration-200 hover:border-border hover:bg-accent/20'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-1 items-start gap-3'>
          <div className='mt-0.5 shrink-0'>
            {isMerged ? (
              <GitMerge className='h-5 w-5 text-purple-600 dark:text-purple-400' />
            ) : isClosed ? (
              <XCircle className='h-5 w-5 text-destructive' />
            ) : (
              <GitPullRequest className='h-5 w-5 text-green-600 dark:text-green-500' />
            )}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary' className='shrink-0 font-mono text-xs'>
                #{entry.pr.number}
              </Badge>
              <span className='truncate text-sm font-semibold text-foreground'>{entry.pr.title}</span>
            </div>
            <div className='mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
              <Badge
                style={repoColor ? { backgroundColor: repoColor } : undefined}
                className='h-5 px-2 text-[10px] font-medium'
              >
                {displayName}
              </Badge>
              <span className='font-mono'>
                {entry.pr.head.ref} → {entry.pr.base.ref}
              </span>
            </div>
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          {isMerged ? (
            <Badge className='border-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'>
              Merged
            </Badge>
          ) : isClosed ? (
            <Badge variant='destructive'>Closed</Badge>
          ) : (
            <Badge variant='outline' className='capitalize'>
              {prData?.state ?? entry.pr.state}
            </Badge>
          )}
        </div>
      </div>

      <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap items-center gap-3 text-xs'>
          {pullRequestQuery.isPending ? (
            <span className='flex items-center gap-1.5 text-muted-foreground'>
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
              Loading...
            </span>
          ) : (
            <>
              {!isMerged && !isClosed && (
                <span className={`flex items-center gap-1.5 ${statusInfo.color}`}>
                  <StatusIcon className='h-3.5 w-3.5' />
                  {statusInfo.label}
                </span>
              )}
              {prData && (
                <>
                  <span className='text-muted-foreground'>
                    <span className='font-medium text-foreground'>{prData.changed_files}</span> files
                  </span>
                  <span className='text-green-600 dark:text-green-500'>+{prData.additions}</span>
                  <span className='text-destructive'>-{prData.deletions}</span>
                  <span className='text-muted-foreground'>({totalChanges} changes)</span>
                </>
              )}
            </>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {canShowMerge && (
            <Button
              size='sm'
              onClick={() => setConfirmMerge(true)}
              disabled={mergePullRequest.isPending}
              className='h-8 cursor-pointer transition-colors duration-200'
            >
              {mergePullRequest.isPending ? (
                <>
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  Merging...
                </>
              ) : (
                <>
                  <GitMerge className='h-3.5 w-3.5' />
                  Merge
                </>
              )}
            </Button>
          )}
          <Button variant='outline' size='sm' asChild className='h-8 cursor-pointer transition-colors duration-200'>
            <a href={prData?.html_url ?? entry.pr.html_url} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='h-3.5 w-3.5' />
              View
            </a>
          </Button>
        </div>
      </div>

      {mergeableState === 'dirty' && (
        <div className='mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
          <AlertCircle className='h-3.5 w-3.5 shrink-0' />
          <span>This branch has conflicts that must be resolved before merging.</span>
        </div>
      )}

      <ConfirmDialog
        open={confirmMerge}
        onOpenChange={setConfirmMerge}
        title={`Merge PR #${entry.pr.number}?`}
        description={`Merge ${entry.pr.head.ref} into ${entry.pr.base.ref} in ${entry.repoFullName}.`}
        confirmLabel='Merge'
        variant='default'
        onConfirm={handleMerge}
      />
    </div>
  );
}

export function PrStatusCard({ createdPrs, onClearAll }: PrStatusCardProps) {
  return (
    <Card className='overflow-hidden border-border/60 bg-card/60 shadow-sm'>
      <CardHeader className='pb-4'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10'>
              <ListChecks className='h-5 w-5 text-primary' />
            </div>
            <div>
              <CardTitle className='text-lg tracking-tight'>Created Pull Requests</CardTitle>
              <CardDescription className='mt-0.5'>
                {createdPrs.length === 0
                  ? 'No pull requests created yet'
                  : `${createdPrs.length} pull request${createdPrs.length > 1 ? 's' : ''} in this session`}
              </CardDescription>
            </div>
          </div>
          {createdPrs.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-8 shrink-0 cursor-pointer text-muted-foreground transition-colors duration-200 hover:text-destructive'
              onClick={onClearAll}
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {createdPrs.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 py-16'>
            <div className='rounded-full bg-muted/50 p-4'>
              <FileText className='h-10 w-10 text-muted-foreground/50' />
            </div>
            <p className='mt-4 text-sm font-medium text-muted-foreground'>No pull request created yet</p>
            <p className='mt-1 text-xs text-muted-foreground'>Create a PR to track its merge status here</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {createdPrs.map(entry => {
              const id = `${entry.repoFullName}-${entry.pr.number}`;
              return <PrRow key={id} entry={entry} />;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
