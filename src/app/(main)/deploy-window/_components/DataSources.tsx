import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SourceStatus } from '@/modules/deploy-window/deploy-window.type';
import { BLOCKED_WINDOWS } from '@/modules/deploy-window/deploy-window.const';
import { DAY_SHORT, minuteLabel, toLocalSlot, Tz, tzLabel } from '../_lib/time';

const STATUS_TEXT: Record<SourceStatus['status'], string> = {
  ok: 'Readable',
  missing: 'Table missing',
  error: 'Read failed',
};

const DataSources = ({ sources, tz }: { sources: SourceStatus[]; tz: Tz }) => (
  <Card className='shadow-none'>
    <CardHeader>
      <CardTitle className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
        Data sources
      </CardTitle>
    </CardHeader>
    <CardContent className='space-y-4 text-sm'>
      <ul className='space-y-1.5'>
        {sources.map(source => (
          <li key={source.name} className='flex items-center justify-between gap-3'>
            <span className='font-mono text-xs'>{source.name}</span>
            <span className='inline-flex items-center gap-1.5'>
              <span className={cn('h-2 w-2 rounded-full', source.status === 'ok' ? 'bg-green-500' : 'bg-red-500')} />
              {STATUS_TEXT[source.status]}
            </span>
          </li>
        ))}
      </ul>
      <div>
        <h3 className='mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          Always avoided ({tzLabel(tz)})
        </h3>
        <ul className='space-y-1'>
          {BLOCKED_WINDOWS.map(w => (
            <li key={`${w.label}-${w.startMinute}`} className='flex justify-between gap-3 text-xs'>
              <span>{w.label}</span>
              <span className='font-mono tabular-nums'>
                {w.weekday === undefined
                  ? 'Daily'
                  : DAY_SHORT[toLocalSlot(w.weekday * 24 + Math.floor(w.startMinute / 60), tz).weekday]}{' '}
                {minuteLabel(w.startMinute, tz)}–{minuteLabel(w.endMinute, tz)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

export default DataSources;
