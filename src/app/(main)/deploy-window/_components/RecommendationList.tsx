'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RankedWindow } from '@/modules/deploy-window/deploy-window.type';
import { slotRangeLabel, Tz } from '../_lib/time';

type Props = {
  windows: RankedWindow[];
  durationHours: number;
  tz: Tz;
  selected: number;
  onSelect: (index: number) => void;
};

const RecommendationList = ({ windows, durationHours, tz, selected, onSelect }: Props) => {
  const other: Tz = tz === 'vn' ? 'utc' : 'vn';
  return (
    <Card className='shadow-none'>
      <CardHeader>
        <CardTitle className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Suggested windows · {durationHours}h
        </CardTitle>
        <CardDescription>
          Fewest writes, with cron and RDS hours already excluded. Click one to outline it below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {windows.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No window of {durationHours}h avoids every blocked time.</p>
        ) : (
          <ul className='space-y-1.5'>
            {windows.map((window, index) => {
              const slot = window.weekday * 24 + window.startHour;
              return (
                <li key={slot}>
                  <button
                    type='button'
                    aria-pressed={index === selected}
                    onClick={() => onSelect(index)}
                    className={cn(
                      'flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border p-2.5 text-left hover:bg-muted',
                      index === selected && 'border-foreground ring-1 ring-foreground'
                    )}
                  >
                    <span>
                      <span className='mr-2 font-mono text-xs text-muted-foreground'>#{index + 1}</span>
                      <span className='font-semibold'>{slotRangeLabel(slot, window.durationHours, tz)}</span>
                      <span className='block text-xs text-muted-foreground'>
                        {slotRangeLabel(slot, window.durationHours, other)} {other === 'vn' ? 'VN' : 'UTC'}
                      </span>
                    </span>
                    <span className='flex gap-3 text-xs text-muted-foreground'>
                      <Stat n={window.writes} label='writes' />
                      <Stat n={window.requests} label='req' />
                      <Stat n={window.users} label='users' />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const Stat = ({ n, label }: { n: number; label: string }) => (
  <span>
    <b className='font-mono font-medium tabular-nums text-foreground'>{n.toLocaleString()}</b> {label}
  </span>
);

export default RecommendationList;
