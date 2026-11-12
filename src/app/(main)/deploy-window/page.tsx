'use client';

import { useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Tabs, TabsList, TabsTab } from '@/components/animate-ui/components/base/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QueryError } from '@/components/query-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { EndpointName } from '@/lib/api/types';
import { getEndpointOptions } from '@/lib/utils';
import { useDeployWindowAnalysis } from '@/modules/deploy-window/deploy-window.query';
import BusiestDates from './_components/BusiestDates';
import DataSources from './_components/DataSources';
import ReadinessCard from './_components/ReadinessCard';
import RecommendationList from './_components/RecommendationList';
import UsageHeatmap from './_components/UsageHeatmap';
import { Tz, windowSlots } from './_lib/time';

const endPoints = getEndpointOptions('MIA', 'EVA', 'DEV');
const DURATIONS = [1, 2, 3, 4, 6, 8];

const DeployWindowPage = () => {
  const [endpoint, setEndpoint] = useState<EndpointName>('MIA');
  const [durationHours, setDurationHours] = useState(2);
  const [tz, setTz] = useState<Tz>('vn');
  const [selected, setSelected] = useState(0);
  const isProduction = endpoint === 'EVA';

  const analysis = useDeployWindowAnalysis({ durationHours }, endpoint);
  const data = analysis.data;

  const highlighted = useMemo(() => {
    const window = data?.recommendations[selected];
    return new Set(window ? windowSlots(window.weekday, window.startHour, window.durationHours) : []);
  }, [data, selected]);

  return (
    <div className='p-4 w-full'>
      <Card className='shadow-none w-full'>
        <CardHeader className='flex flex-col gap-4 border-b'>
          <div className='flex flex-wrap items-start justify-between gap-4 w-full'>
            <div className='space-y-1'>
              <CardTitle className='text-2xl font-bold'>Deploy Window</CardTitle>
              <CardDescription>
                Pick the quietest hours to deploy, then check go / no-go right before you start.
              </CardDescription>
            </div>

            <div className='flex flex-wrap items-end gap-4'>
              <Field label='Environment'>
                <Tabs
                  value={endpoint}
                  onValueChange={value => {
                    setEndpoint(value);
                    setSelected(0);
                  }}
                >
                  <TabsList>
                    {endPoints.map(item => (
                      <TabsTab key={item.value} value={item.value}>
                        {item.label}
                      </TabsTab>
                    ))}
                  </TabsList>
                </Tabs>
              </Field>
              <Field label='Window length'>
                <Select
                  value={String(durationHours)}
                  onValueChange={value => {
                    setDurationHours(Number(value));
                    setSelected(0);
                  }}
                >
                  <SelectTrigger className='w-28'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map(hours => (
                      <SelectItem key={hours} value={String(hours)}>
                        {hours} hour{hours > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label='Timezone'>
                <Tabs value={tz} onValueChange={value => setTz(value)}>
                  <TabsList>
                    <TabsTab value='vn'>VN (UTC+7)</TabsTab>
                    <TabsTab value='utc'>UTC</TabsTab>
                  </TabsList>
                </Tabs>
              </Field>
            </div>
          </div>

          {isProduction && (
            <Alert variant='destructive' className='border-destructive/40 bg-destructive/5 py-2'>
              <TriangleAlert className='h-4 w-4' />
              <AlertDescription>
                <strong>Production environment.</strong> Readiness reflects live traffic right now.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className='space-y-4 pt-4'>
          <div className='grid gap-4 lg:grid-cols-[5fr_6fr]'>
            <ReadinessCard endpoint={endpoint} durationHours={durationHours} />
            {analysis.isLoading ? (
              <Loading />
            ) : analysis.error || !data ? (
              <QueryError error={analysis.error} onRetry={analysis.refetch} title="Couldn't load usage analysis" />
            ) : (
              <RecommendationList
                windows={data.recommendations}
                durationHours={durationHours}
                tz={tz}
                selected={selected}
                onSelect={setSelected}
              />
            )}
          </div>

          {data && (
            <>
              <UsageHeatmap heatmap={data.heatmap} days={data.days} tz={tz} highlighted={highlighted} />
              <div className='grid gap-4 lg:grid-cols-[3fr_2fr]'>
                <BusiestDates dates={data.busiestDates} />
                <DataSources sources={data.sources} tz={tz} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='flex flex-col gap-1.5'>
    <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>{label}</span>
    {children}
  </div>
);

const Loading = () => (
  <div className='flex items-center justify-center rounded-xl border py-12'>
    <Spinner />
  </div>
);

export default DeployWindowPage;
