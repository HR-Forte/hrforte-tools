'use client';

import { CheckCircle2, OctagonX, RefreshCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { QueryError } from '@/components/query-error';
import { cn } from '@/lib/utils';
import { useDeployWindowReadiness } from '@/modules/deploy-window/deploy-window.query';
import { EndpointName } from '@/lib/api/types';
import { Verdict } from '@/modules/deploy-window/deploy-window.type';

const VERDICT: Record<Verdict, { label: string; text: string; Icon: typeof CheckCircle2; className: string }> = {
  GO: {
    label: 'GO',
    text: 'No heavy job, stuck transaction or lock. Safe to deploy.',
    Icon: CheckCircle2,
    className: 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400',
  },
  CAUTION: {
    label: 'CAUTION',
    text: 'Nothing blocks the deploy, but review the points below.',
    Icon: TriangleAlert,
    className: 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  NO_GO: {
    label: 'NO-GO',
    text: 'Work would be cut off or migrations blocked. Do not deploy now.',
    Icon: OctagonX,
    className: 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
  },
};

type Props = { endpoint: EndpointName; durationHours: number };

const ReadinessCard = ({ endpoint, durationHours }: Props) => {
  const { data, error, isFetching, isLoading, refetch, dataUpdatedAt } = useDeployWindowReadiness(
    { durationHours },
    endpoint
  );

  return (
    <Card className='shadow-none'>
      <CardHeader className='flex flex-row items-center justify-between gap-2'>
        <CardTitle className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Can I deploy right now?
        </CardTitle>
        <Button size='sm' variant='outline' onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Spinner className='h-4 w-4' /> : <RefreshCcw className='h-4 w-4' />}
          Re-check
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isLoading ? (
          <div className='flex justify-center py-8'>
            <Spinner />
          </div>
        ) : error || !data ? (
          <QueryError error={error} onRetry={refetch} title="Couldn't run the readiness check" />
        ) : (
          <>
            <VerdictBanner verdict={data.verdict} />
            {data.reasons.length > 0 && (
              <ul className='space-y-1.5 text-sm'>
                {data.reasons.map(reason => (
                  <li key={reason} className='font-mono text-xs'>
                    {reason}
                  </li>
                ))}
              </ul>
            )}
            <dl className='grid grid-cols-3 gap-2 text-sm'>
              {data.metrics.db === 'unavailable' ? (
                <div className='col-span-2 rounded-md bg-muted p-2'>
                  <dt className='text-xs text-muted-foreground'>Database sessions</dt>
                  <dd className='font-medium'>Unavailable (needs pg_read_all_stats)</dd>
                </div>
              ) : (
                <>
                  <Metric
                    label='Longest transaction'
                    value={`${data.metrics.db.longestTransactionSeconds}s`}
                    hint='/ 300s'
                  />
                  <Metric label='Waiting on a lock' value={data.metrics.db.lockWaiters} />
                </>
              )}
              <Metric
                label='Writes, last 60 min'
                value={data.metrics.recentWrites}
                hint={`/ max ${data.metrics.historicalMaxWrites}`}
              />
            </dl>
            <details className='text-sm'>
              <summary className='cursor-pointer text-muted-foreground'>
                Heavy queues ({data.metrics.queues.length})
              </summary>
              <table className='mt-2 w-full text-xs'>
                <thead>
                  <tr className='text-left text-muted-foreground'>
                    <th className='py-1 font-medium'>Queue</th>
                    <th className='py-1 text-right font-medium'>Active</th>
                    <th className='py-1 text-right font-medium'>Due in window</th>
                  </tr>
                </thead>
                <tbody>
                  {data.metrics.queues.map(queue => (
                    <tr key={queue.name} className='border-t'>
                      <td className='py-1 font-mono'>{queue.name}</td>
                      <td className='py-1 text-right tabular-nums'>{queue.active}</td>
                      <td className='py-1 text-right tabular-nums'>{queue.delayedDueSoon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
            <p className='text-xs text-muted-foreground'>Checked at {new Date(dataUpdatedAt).toLocaleTimeString()}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const VerdictBanner = ({ verdict }: { verdict: Verdict }) => {
  const { label, text, Icon, className } = VERDICT[verdict];
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border p-3', className)}>
      <Icon className='h-8 w-8 shrink-0' aria-hidden />
      <div>
        <div className='text-xl font-bold tracking-wide'>{label}</div>
        <div className='text-sm text-foreground/80'>{text}</div>
      </div>
    </div>
  );
};

const Metric = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className='rounded-md bg-muted p-2'>
    <dt className='text-xs text-muted-foreground'>{label}</dt>
    <dd className='font-mono text-base font-medium tabular-nums'>
      {value}
      {hint && <span className='ml-1 text-xs font-normal text-muted-foreground'>{hint}</span>}
    </dd>
  </div>
);

export default ReadinessCard;
