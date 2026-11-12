import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeployWindowAnalysis } from '@/modules/deploy-window/deploy-window.type';
import { DAY_SHORT } from '../_lib/time';

const BusiestDates = ({ dates }: { dates: DeployWindowAnalysis['busiestDates'] }) => {
  const max = Math.max(1, ...dates.map(d => d.writes));
  return (
    <Card className='shadow-none'>
      <CardHeader>
        <CardTitle className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
          Busiest dates
        </CardTitle>
        <CardDescription>
          Most writes in one day. The heatmap hides spikes like month-end payroll, so avoid dates like these.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {dates.map(({ date, writes, requests }) => {
          const day = new Date(`${date}T00:00:00Z`);
          return (
            <div key={date}>
              <div className='flex items-center gap-3 text-sm'>
                <span className='w-24 shrink-0 text-muted-foreground'>
                  <b className='text-foreground'>{DAY_SHORT[day.getUTCDay()]}</b> {date}
                </span>
                <div className='h-3 flex-1'>
                  <div
                    className='h-full min-w-0.5 rounded-r bg-blue-500'
                    style={{ width: `${(writes / max) * 100}%` }}
                  />
                </div>
                <span className='w-16 text-right font-mono text-xs tabular-nums'>{writes.toLocaleString()}</span>
              </div>
              <div className='pl-27 text-xs text-muted-foreground'>{requests.toLocaleString()} requests that day</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default BusiestDates;
