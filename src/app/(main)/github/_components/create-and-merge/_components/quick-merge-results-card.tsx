'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitMerge, Loader2, History } from 'lucide-react';
import type { RepoActionLog, StoredQuickMergeRun } from '../_types';
import { RepoActionLogEntry } from './repo-action-log-entry';

interface QuickMergeResultsCardProps {
  actionLogs: RepoActionLog[];
  quickMergeHistory: StoredQuickMergeRun[];
  quickTitle: string;
  quickRunning: boolean;
  onClearHistory: () => void;
}

export function QuickMergeResultsCard({
  actionLogs,
  quickMergeHistory,
  quickTitle,
  quickRunning,
  onClearHistory,
}: QuickMergeResultsCardProps) {
  const description = actionLogs.length > 0
    ? `${actionLogs.filter(l => l.status === 'success').length} of ${actionLogs.length} completed (running)`
    : quickMergeHistory.length > 0
      ? `${quickMergeHistory.length} run(s) stored in session`
      : 'Run quick merge to see results';

  const runsToShow = useMemo(() => {
    const runs: { id: string; title: string; timestamp: string; actionLogs: RepoActionLog[] }[] = [];
    if (actionLogs.length > 0) {
      runs.push({
        id: 'current',
        title: quickTitle,
        timestamp: new Date().toISOString(),
        actionLogs,
      });
    }
    runs.push(...quickMergeHistory);
    return runs;
  }, [actionLogs, quickMergeHistory, quickTitle]);

  return (
    <Card className='overflow-hidden border-border/60 bg-card/60 shadow-sm'>
      <CardHeader className='pb-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10'>
              <History className='h-5 w-5 text-purple-600 dark:text-purple-400' />
            </div>
            <div>
              <CardTitle className='text-lg tracking-tight'>Quick Merge Results</CardTitle>
              <CardDescription className='mt-0.5'>{description}</CardDescription>
            </div>
          </div>
          {quickMergeHistory.length > 0 ? (
            <Button
              variant='ghost'
              size='sm'
              className='shrink-0 cursor-pointer text-muted-foreground transition-colors duration-200 hover:text-destructive'
              onClick={onClearHistory}
            >
              Clear history
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className='space-y-5'>
        {runsToShow.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/10 py-20'>
            <div className='rounded-full bg-muted/50 p-4'>
              <GitMerge className='h-10 w-10 text-muted-foreground/50' />
            </div>
            <p className='mt-5 text-sm font-semibold text-muted-foreground'>No results yet</p>
            <p className='mt-1 text-xs text-muted-foreground'>Click Run Quick Merge to create and merge PRs</p>
          </div>
        ) : (
          runsToShow.map(run => {
            const successCount = run.actionLogs.filter(l => l.status === 'success').length;
            const failedCount = run.actionLogs.filter(l => l.status === 'failed').length;

            return (
              <div key={run.id} className='space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4'>
                <div className='flex flex-wrap items-center gap-2 text-sm'>
                  <span className='font-semibold text-foreground'>{run.title || 'Quick merge run'}</span>
                  <span className='text-muted-foreground'>{new Date(run.timestamp).toLocaleString()}</span>
                  {run.id === 'current' && quickRunning ? (
                    <Badge variant='outline' className='gap-1 border-primary/40 text-primary'>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      Running
                    </Badge>
                  ) : null}
                  {!quickRunning || run.id !== 'current' ? (
                    <>
                      {successCount > 0 ? (
                        <Badge variant='outline' className='border-green-500/40 text-green-600 dark:text-green-400'>
                          {successCount} succeeded
                        </Badge>
                      ) : null}
                      {failedCount > 0 ? (
                        <Badge variant='destructive'>{failedCount} failed</Badge>
                      ) : null}
                    </>
                  ) : null}
                </div>
                <div className='space-y-3'>
                  {run.actionLogs.map(log => (
                    <RepoActionLogEntry key={`${run.id}-${log.repoFullName}`} log={log} runId={run.id} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
