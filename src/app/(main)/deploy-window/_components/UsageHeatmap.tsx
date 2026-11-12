'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { HEATMAP_BINS, HEATMAP_STEP_CLASS, HeatmapMetric } from '@/modules/deploy-window/deploy-window.const';
import { DeployWindowAnalysis } from '@/modules/deploy-window/deploy-window.type';
import {
  blockedFor,
  binFor,
  DAY_SHORT,
  minuteLabelRange,
  ROW_ORDER,
  slotRangeLabel,
  toUtcSlot,
  Tz,
  tzLabel,
} from '../_lib/time';

type Props = { heatmap: DeployWindowAnalysis['heatmap']; days: number; tz: Tz; highlighted: Set<number> };

const METRICS: HeatmapMetric[] = ['writes', 'requests', 'users'];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const pad = (n: number) => String(n).padStart(2, '0');

const UsageHeatmap = ({ heatmap, days, tz, highlighted }: Props) => {
  const [metric, setMetric] = useState<HeatmapMetric>('writes');
  const other: Tz = tz === 'vn' ? 'utc' : 'vn';
  const bins = HEATMAP_BINS[metric];
  const valueAt = (utcSlot: number) => heatmap[Math.floor(utcSlot / 24)][utcSlot % 24];

  const rows = useMemo(
    () => ROW_ORDER.map(weekday => ({ weekday, slots: HOURS.map(hour => toUtcSlot(weekday, hour, tz)) })),
    [tz]
  );

  return (
    <Card className='shadow-none'>
      <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-3'>
        <div className='space-y-1.5'>
          <CardTitle className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
            Usage by hour of the week
          </CardTitle>
          <CardDescription>
            Each cell is the busiest hour of that slot over the last {days} days, not an average.
          </CardDescription>
        </div>
        <div role='group' aria-label='Metric' className='inline-flex rounded-lg border bg-muted p-0.5'>
          {METRICS.map(m => (
            <button
              key={m}
              type='button'
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium text-muted-foreground',
                metric === m && 'bg-background text-foreground shadow-sm'
              )}
            >
              {HEATMAP_BINS[m].name}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='overflow-x-auto pb-1'>
          <div className='grid min-w-165 gap-0.5' style={{ gridTemplateColumns: '2.5rem repeat(24, minmax(0, 1fr))' }}>
            <div className='text-[10px] text-muted-foreground'>{tz === 'vn' ? 'VN' : 'UTC'}</div>
            {HOURS.map(hour => (
              <div key={hour} className='text-center font-mono text-[10px] text-muted-foreground'>
                {hour % 3 === 0 ? pad(hour) : ''}
              </div>
            ))}
            {rows.map(({ weekday, slots }) => (
              <HeatRow key={weekday} label={DAY_SHORT[weekday]}>
                {slots.map((utcSlot, hour) => {
                  const usage = valueAt(utcSlot);
                  const blocked = blockedFor(utcSlot);
                  return (
                    <Tooltip key={hour}>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          aria-label={`${DAY_SHORT[weekday]} ${pad(hour)}:00 ${tzLabel(tz)}: ${usage.writes} writes, ${usage.requests} requests, ${usage.users} users`}
                          className={cn(
                            'relative h-7 rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                            HEATMAP_STEP_CLASS[binFor(metric, usage[metric])],
                            highlighted.has(utcSlot) &&
                              'z-10 ring-2 ring-foreground ring-offset-1 ring-offset-background'
                          )}
                        >
                          {blocked.length > 0 && (
                            <span
                              aria-hidden
                              className='absolute inset-0 rounded-[3px] bg-[repeating-linear-gradient(135deg,rgba(0,0,0,0.45)_0_1.5px,transparent_1.5px_6px)] dark:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.5)_0_1.5px,transparent_1.5px_6px)]'
                            />
                          )}
                          {usage.writes === 0 && (
                            <span
                              aria-hidden
                              className='absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500'
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className='bg-popover text-popover-foreground border shadow-md'>
                        <div className='space-y-1 py-0.5'>
                          <div className='font-semibold'>
                            {slotRangeLabel(utcSlot, 1, tz)} {tz === 'vn' ? 'VN' : 'UTC'}
                          </div>
                          <div className='text-muted-foreground'>
                            = {slotRangeLabel(utcSlot, 1, other)} {other === 'vn' ? 'VN' : 'UTC'}
                          </div>
                          <dl className='grid grid-cols-[auto_auto] gap-x-4 font-mono tabular-nums'>
                            <dt>Writes</dt>
                            <dd className='text-right'>{usage.writes.toLocaleString()}</dd>
                            <dt>Requests</dt>
                            <dd className='text-right'>{usage.requests.toLocaleString()}</dd>
                            <dt>Users</dt>
                            <dd className='text-right'>{usage.users}</dd>
                          </dl>
                          {blocked.length > 0 && (
                            <div className='border-t pt-1 text-muted-foreground'>
                              Overlaps: {blocked.map(w => `${w.label} ${minuteLabelRange(w, tz)}`).join(', ')}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </HeatRow>
            ))}
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground'>
          <div>
            <div className='flex gap-0.5'>
              {bins.labels.map((_, step) => (
                <span key={step} className={cn('h-3 w-8.5 rounded-xs', HEATMAP_STEP_CLASS[step])} />
              ))}
            </div>
            <div className='flex gap-0.5'>
              {bins.labels.map(label => (
                <span key={label} className='w-8.5 text-center font-mono text-[10px]'>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <span className='inline-flex items-center gap-1.5'>
            <span className='h-1 w-1 rounded-full bg-green-500' /> No writes
          </span>
          <span className='inline-flex items-center gap-1.5'>
            <span className='h-3.5 w-3.5 rounded-xs bg-slate-200 bg-[repeating-linear-gradient(135deg,rgba(0,0,0,0.45)_0_1.5px,transparent_1.5px_5px)] dark:bg-slate-800 dark:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.5)_0_1.5px,transparent_1.5px_5px)]' />
            Overlaps cron / RDS backup / maintenance
          </span>
          <span className='inline-flex items-center gap-1.5'>
            <span className='h-3.5 w-3.5 rounded-xs ring-2 ring-foreground' /> Selected window
          </span>
        </div>

        <details className='text-sm'>
          <summary className='cursor-pointer text-muted-foreground'>Show as table</summary>
          <div className='mt-2 overflow-x-auto'>
            <Table className='text-xs'>
              <TableHeader>
                <TableRow>
                  <TableHead>{tzLabel(tz)}</TableHead>
                  {HOURS.map(hour => (
                    <TableHead key={hour} className='text-right font-mono'>
                      {pad(hour)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ weekday, slots }) => (
                  <TableRow key={weekday}>
                    <TableHead>{DAY_SHORT[weekday]}</TableHead>
                    {slots.map((utcSlot, hour) => (
                      <TableCell key={hour} className='text-right font-mono tabular-nums'>
                        {valueAt(utcSlot)[metric].toLocaleString()}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

/** A heatmap row: day label plus its 24 cells, laid out by the parent grid. */
const HeatRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <div className='flex items-center text-xs font-semibold text-muted-foreground'>{label}</div>
    {children}
  </>
);

export default UsageHeatmap;
