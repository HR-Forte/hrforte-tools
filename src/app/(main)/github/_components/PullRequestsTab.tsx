'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { QueryError } from '@/components/query-error';
import { Tabs, TabsList, TabsTab, TabsPanel, TabsPanels } from '@/components/animate-ui/components/base/tabs';
import { MANAGED_REPO_NAMES, REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import {
  useGithubPullRequest,
  useGithubRepoPulls,
  useMergePullRequest,
  useUpdatePullRequest,
} from '@/modules/github/github.query';
import { GithubGeneralPullRequest } from '@/modules/github/github.type';
import {
  ExternalLink,
  Pencil,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  GitMerge,
  GitBranch,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type PrState = 'open' | 'closed' | 'all';

const PullRequestsTab = () => {
  const [prState, setPrState] = useState<PrState>('open');
  const [selectedRepo, setSelectedRepo] = useState<string>(MANAGED_REPO_NAMES[0] ?? '');

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium text-foreground'>State:</span>
        <div className='flex gap-2'>
          {(['open', 'closed', 'all'] as const).map(state => (
            <Button
              key={state}
              variant={prState === state ? 'default' : 'outline'}
              size='sm'
              className='cursor-pointer'
              onClick={() => setPrState(state)}
            >
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {selectedRepo ? (
        <Tabs value={selectedRepo} onValueChange={setSelectedRepo}>
          <div className='overflow-x-auto pb-1'>
            <TabsList className='h-auto w-max max-w-full flex-wrap gap-1 p-1'>
              {MANAGED_REPO_NAMES.map(fullName => {
                const displayInfo = REPO_NAME_MAPPING[fullName];
                return (
                  <TabsTab key={fullName} value={fullName} className='cursor-pointer gap-2 px-3'>
                    <span
                      className='h-2 w-2 shrink-0 rounded-full'
                      style={{ backgroundColor: displayInfo?.color ?? 'var(--muted-foreground)' }}
                      aria-hidden
                    />
                    {displayInfo?.name ?? fullName}
                  </TabsTab>
                );
              })}
            </TabsList>
          </div>

          <TabsPanels className='mt-4'>
            {MANAGED_REPO_NAMES.map(fullName => {
              const [owner, repo] = fullName.split('/');
              const displayInfo = REPO_NAME_MAPPING[fullName];
              return (
                <TabsPanel key={fullName} value={fullName} className={selectedRepo !== fullName ? 'hidden' : ''}>
                  {selectedRepo === fullName && (
                    <RepoPullRequests
                      owner={owner}
                      repo={repo}
                      fullName={fullName}
                      displayName={displayInfo?.name ?? fullName}
                      color={displayInfo?.color}
                      state={prState}
                    />
                  )}
                </TabsPanel>
              );
            })}
          </TabsPanels>
        </Tabs>
      ) : (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 py-16 text-center'>
          <p className='text-sm font-medium text-muted-foreground'>Select a repository to view pull requests</p>
        </div>
      )}
    </div>
  );
};

function RepoPullRequests({
  owner,
  repo,
  fullName,
  displayName,
  color,
  state,
}: {
  owner: string;
  repo: string;
  fullName: string;
  displayName: string;
  color?: string;
  state: PrState;
}) {
  const { data: pulls, isPending, isFetching, isError, error, refetch } = useGithubRepoPulls(owner, repo, {
    state,
    perPage: 100,
  });

  return (
    <Card className='border-border/60 bg-card/60'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center justify-between gap-2 text-lg'>
          <div className='flex items-center gap-2'>
            <Badge style={color ? { backgroundColor: color } : undefined}>{displayName}</Badge>
            <a
              href={`https://github.com/${fullName}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-muted-foreground font-normal hover:text-foreground'
            >
              {fullName}
            </a>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='cursor-pointer'
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label='Refresh pull requests'
          >
            <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isPending && (
          <div className='flex items-center justify-center py-8'>
            <Spinner className='h-6 w-6' />
          </div>
        )}

        {!isPending && isError && <QueryError error={error} onRetry={refetch} />}

        {!isPending && !isError && (!pulls || pulls.length === 0) && (
          <p className='py-6 text-center text-sm text-muted-foreground'>No pull requests</p>
        )}

        {!isPending && pulls && pulls.length > 0 && (
          <div className='space-y-3'>
            {pulls.map(pr => (
              <PrRow key={pr.id} pr={pr} owner={owner} repo={repo} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PrRow({ pr, owner, repo }: { pr: GithubGeneralPullRequest; owner: string; repo: string }) {
  const [viewDetails, setViewDetails] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(pr.title);
  const [pendingAction, setPendingAction] = useState<'merge' | 'close' | null>(null);

  const { data: fullPr, isFetching: isDetailsLoading } = useGithubPullRequest(
    { owner, repo, number: pr.number },
    { enabled: viewDetails }
  );

  const mergePullRequest = useMergePullRequest();
  const updatePullRequest = useUpdatePullRequest();

  const mergeable = fullPr?.mergeable;
  const mergeableState = fullPr?.mergeable_state;
  const hasConflict = mergeableState === 'dirty' || mergeable === false;
  const isMergeDisabled = hasConflict || mergeable === null || pr.state !== 'open';

  const additions = fullPr?.additions ?? 0;
  const deletions = fullPr?.deletions ?? 0;
  const changedFiles = fullPr?.changed_files ?? 0;
  const displayTitle = fullPr?.title ?? pr.title;

  const hasFullData = Boolean(fullPr);

  const handleSaveTitle = async () => {
    if (editTitleValue.trim() && editTitleValue !== displayTitle) {
      try {
        await updatePullRequest.mutateAsync({
          owner,
          repo,
          number: pr.number,
          title: editTitleValue.trim(),
        });
        setEditingTitle(false);
      } catch {
        // error toast handled by the mutation hook
      }
    } else {
      setEditingTitle(false);
      setEditTitleValue(displayTitle);
    }
  };

  const isExpanded = viewDetails && fullPr;

  return (
    <div className='group rounded-xl border border-border/50 bg-card/40 transition-all hover:border-border hover:bg-card/60'>
      <div className='p-4'>
        {/* Summary row - always visible */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0 flex-1 space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary' className='font-mono'>
                #{pr.number}
              </Badge>

              {editingTitle ? (
                <div className='flex items-center gap-2'>
                  <Input
                    value={editTitleValue}
                    onChange={e => setEditTitleValue(e.target.value)}
                    className='max-w-md'
                    autoFocus
                    aria-label='Pull request title'
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') {
                        setEditingTitle(false);
                        setEditTitleValue(displayTitle);
                      }
                    }}
                  />
                  <Button
                    size='sm'
                    onClick={handleSaveTitle}
                    disabled={updatePullRequest.isPending}
                    aria-label='Save title'
                  >
                    {updatePullRequest.isPending ? <Spinner className='h-3 w-3' /> : <Check className='h-3 w-3' />}
                  </Button>
                  <Button size='sm' variant='ghost' onClick={() => setEditingTitle(false)} aria-label='Cancel editing title'>
                    <X className='h-3 w-3' />
                  </Button>
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-foreground'>{displayTitle}</span>

                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6'
                    aria-label='Edit title'
                    onClick={() => {
                      setEditTitleValue(displayTitle);
                      setEditingTitle(true);
                    }}
                  >
                    <Pencil className='h-3 w-3' />
                  </Button>
                </div>
              )}

              {pr.state === 'open' && (
                <Badge variant='outline' className='border-green-500/50 text-green-600 dark:text-green-400'>
                  Open
                </Badge>
              )}
            </div>

            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
              <span className='flex items-center gap-1.5'>
                <GitBranch className='h-3.5 w-3.5' />
                {pr.base?.ref ?? '?'} ← {pr.head?.ref ?? '?'}
              </span>

              {pr.user && (
                <span className='flex items-center gap-1.5'>
                  <User className='h-3.5 w-3.5' />
                  {pr.user.login}
                </span>
              )}
              {pr.created_at && (
                <span className='flex items-center gap-1.5'>
                  <Calendar className='h-3.5 w-3.5' />
                  {format(new Date(pr.created_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          <div className='flex shrink-0 items-center gap-2'>
            <Button
              size='sm'
              variant={isExpanded ? 'secondary' : 'outline'}
              onClick={() => setViewDetails(!viewDetails)}
              disabled={isDetailsLoading}
            >
              {isDetailsLoading ? (
                <>
                  <Spinner className='mr-2 h-3.5 w-3.5' />
                  Loading...
                </>
              ) : isExpanded ? (
                <>
                  <ChevronUp className='mr-1.5 h-4 w-4' />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className='mr-1.5 h-4 w-4' />
                  View details
                </>
              )}
            </Button>
            <Button size='icon' variant='ghost' className='h-8 w-8' asChild>
              <a
                href={pr.html_url}
                target='_blank'
                rel='noopener noreferrer'
                title='Open on GitHub'
                aria-label='Open on GitHub'
              >
                <ExternalLink className='h-4 w-4' />
              </a>
            </Button>
          </div>
        </div>

        {/* Expanded details - only when user has viewed & data loaded */}
        {viewDetails && (
          <div className='mt-4 border-t border-border/50 pt-4'>
            {isDetailsLoading && (
              <div className='flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground'>
                <Spinner className='h-4 w-4' />
                <span>Fetching merge status and full PR data...</span>
              </div>
            )}

            {fullPr && !isDetailsLoading && (
              <div className='space-y-4'>
                {/* Changes stats - only from full PR */}
                <div className='flex flex-wrap items-center gap-4 rounded-lg bg-muted/30 px-3 py-2'>
                  <span className='flex items-center gap-1.5 text-sm'>
                    <span className='text-green-600 dark:text-green-500'>+{additions}</span>
                    <span className='text-muted-foreground'>additions</span>
                  </span>
                  <span className='flex items-center gap-1.5 text-sm'>
                    <span className='text-red-600 dark:text-red-500'>-{deletions}</span>
                    <span className='text-muted-foreground'>deletions</span>
                  </span>
                  <span className='flex items-center gap-1.5 text-sm'>
                    <FileText className='h-4 w-4 text-muted-foreground' />
                    <span>{changedFiles} files changed</span>
                  </span>

                  <div className='flex flex-wrap items-center gap-2'>
                    {mergeableState && (
                      <Badge
                        variant={hasConflict ? 'destructive' : 'outline'}
                        className={!hasConflict ? 'border-green-500/50 text-green-600 dark:text-green-400' : ''}
                      >
                        {hasConflict ? (
                          <>
                            <AlertCircle className='mr-1 h-3 w-3' />
                            Conflicts
                          </>
                        ) : (
                          <>
                            <GitMerge className='mr-1 h-3 w-3' />
                            {mergeableState}
                          </>
                        )}
                      </Badge>
                    )}
                    {mergeable === null && (
                      <span className='text-xs text-muted-foreground'>Checking mergeability...</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className='flex flex-wrap gap-2'>
                  <Button
                    size='sm'
                    disabled={isMergeDisabled || mergePullRequest.isPending}
                    onClick={() => setPendingAction('merge')}
                  >
                    {mergePullRequest.isPending ? (
                      <>
                        <Spinner className='mr-2 h-3.5 w-3.5' />
                        Merging...
                      </>
                    ) : (
                      <>
                        <GitMerge className='mr-2 h-3.5 w-3.5' />
                        Merge
                      </>
                    )}
                  </Button>
                  {pr.state === 'open' && (
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={updatePullRequest.isPending}
                      onClick={() => setPendingAction('close')}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={open => !open && setPendingAction(null)}
        title={pendingAction === 'merge' ? `Merge PR #${pr.number}?` : `Close PR #${pr.number}?`}
        description={
          pendingAction === 'merge'
            ? `Merge ${pr.head?.ref ?? '?'} into ${pr.base?.ref ?? '?'} in ${owner}/${repo}.`
            : `Close "${displayTitle}" in ${owner}/${repo} without merging.`
        }
        confirmLabel={pendingAction === 'merge' ? 'Merge' : 'Close PR'}
        variant={pendingAction === 'merge' ? 'default' : 'destructive'}
        onConfirm={() =>
          pendingAction === 'merge'
            ? mergePullRequest.mutateAsync({ owner, repo, number: pr.number, merge_method: 'merge' })
            : updatePullRequest.mutateAsync({ owner, repo, number: pr.number, state: 'closed' })
        }
      />
    </div>
  );
}

export default PullRequestsTab;
