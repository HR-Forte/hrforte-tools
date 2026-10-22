'use client';

import { Button } from '@/components/ui/button';
import {
  healthQueries,
  useESmartTimeVersion,
  useHealthVersion,
  useNETCoreVersion,
} from '@/modules/health/health.query';
import { queryClient } from '@/lib/query/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';
import Link from 'next/link';
import { useUser } from '@/lib/contexts/UserContext';
import { canAccessLink, links } from '../_components/MainSidebar';

type HealthStatus = 'healthy' | 'unhealthy' | 'loading';

function getHealthStatus(query: Pick<UseQueryResult, 'isError' | 'isFetching' | 'isSuccess'>): HealthStatus {
  if (query.isFetching) return 'loading';
  if (query.isError) return 'unhealthy';
  // A disabled/idle query with no data proves nothing, so don't report it as healthy
  return query.isSuccess ? 'healthy' : 'loading';
}

function HealthIndicator({ status }: { status: HealthStatus }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        status === 'healthy' && 'size-2.5 rounded-full bg-green-500 shadow-[0_0_0_2px] shadow-green-500/30',
        status === 'unhealthy' && 'size-2.5 rounded-full bg-red-500 shadow-[0_0_0_2px] shadow-red-500/30',
        status === 'loading' && 'size-2.5'
      )}
      aria-label={status === 'healthy' ? 'Healthy' : status === 'unhealthy' ? 'Unhealthy' : 'Loading'}
      title={status === 'healthy' ? 'Healthy' : status === 'unhealthy' ? 'Unhealthy' : 'Loading'}
    >
      {status === 'loading' && <Loader2 className='size-2.5 animate-spin text-muted-foreground' aria-hidden />}
    </span>
  );
}

type SectionItem = { name: string; query: UseQueryResult<any>; versionKey: string };

const getVersion = (version?: string) => {
  const versionRegex = /(.*)(v\d+\.\d+\.\d+)(.+\.\d+)*/;
  const match = version?.match(versionRegex);

  if (!match) return version;

  return match?.[2] + (match?.[3] ?? '');
};

function ServiceItem({ item }: { item: SectionItem }) {
  const status = getHealthStatus(item.query);
  const version = item.versionKey ? item.query.data?.[item.versionKey] : item.query.data;
  const finalVersion = getVersion(version);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border bg-background/80 px-4 py-3 transition-colors',
        status === 'healthy' && 'border-border/50',
        status === 'unhealthy' && 'border-red-500/30 bg-red-500/5',
        status === 'loading' && 'border-border/50'
      )}
    >
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <HealthIndicator status={status} />
        <div className='min-w-0'>
          <p className='text-sm font-medium text-foreground'>{item.name}</p>
          <p className='text-xs text-muted-foreground'>
            {status === 'unhealthy' && 'Cannot connect'}
            {status === 'loading' && 'Checking...'}
          </p>
        </div>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
          status === 'healthy' && 'bg-muted text-foreground',
          status === 'unhealthy' && 'bg-red-500/10 text-red-600 dark:text-red-400',
          status === 'loading' && 'bg-muted/60 text-muted-foreground'
        )}
      >
        {finalVersion ? `${finalVersion}` : '—'}
      </span>
    </div>
  );
}

const DashboardPage = () => {
  const { user } = useUser();
  const quickLinks = links.filter(link => link.href !== '/dashboard' && canAccessLink(link, user?.roles));
  const evaQuery = useHealthVersion('EVA');
  const devQuery = useHealthVersion('DEV');
  const miaQuery = useHealthVersion('MIA');
  const mapStagingQuery = useHealthVersion('MAP_STAGING');
  const mapProductionQuery = useHealthVersion('MAP_PRODUCTION');
  const eSmartTimeDevQuery = useESmartTimeVersion('E_SMART_TIME_DEV');
  const eSmartTimeStagingQuery = useESmartTimeVersion('E_SMART_TIME_STAGING');
  const eSmartTimeProductionQuery = useESmartTimeVersion('E_SMART_TIME_PRODUCTION');
  const evaNetCoreQuery = useNETCoreVersion('EVA_NET_CORE');
  const miaNetCoreQuery = useNETCoreVersion('MIA_NET_CORE');
  const devNetCoreQuery = useNETCoreVersion('DEV_NET_CORE');

  const sections: { title: string; description: string; items: SectionItem[] }[] = [
    {
      title: 'Core Services',
      description: 'HRForte Services Backend',
      items: [
        { name: 'EVA', query: evaQuery, versionKey: '' },
        { name: 'MIA', query: miaQuery, versionKey: '' },
        { name: 'DEV', query: devQuery, versionKey: '' },
      ],
    },
    {
      title: 'MAP',
      description: 'MAP Services Backend',
      items: [
        { name: 'MAP Production', query: mapProductionQuery, versionKey: '' },
        { name: 'MAP Staging', query: mapStagingQuery, versionKey: '' },
      ],
    },
    {
      title: 'E-Smart Time',
      description: 'E-Smart Time Backend',
      items: [
        { name: 'E-Smart Time Dev', query: eSmartTimeDevQuery, versionKey: '' },
        { name: 'E-Smart Time Staging', query: eSmartTimeStagingQuery, versionKey: '' },
        { name: 'E-Smart Time Production', query: eSmartTimeProductionQuery, versionKey: '' },
      ],
    },
    {
      title: '.NET API',
      description: 'Core .NET Backend',
      items: [
        { name: 'EVA .NET Core', query: evaNetCoreQuery, versionKey: 'status' },
        { name: 'MIA .NET Core', query: miaNetCoreQuery, versionKey: 'status' },
        { name: 'DEV .NET Core', query: devNetCoreQuery, versionKey: 'status' },
      ],
    },
  ];

  const isFetchingAny = sections.some(section => section.items.some(item => item.query.isFetching));

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: healthQueries.version._def });
    queryClient.invalidateQueries({ queryKey: healthQueries.esmartTimeVersion._def });
    queryClient.invalidateQueries({ queryKey: healthQueries.netCoreVersion._def });
  };

  return (
    <div className='min-h-screen overflow-y-auto bg-background px-6 py-10'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10'>
        <div className='space-y-2'>
          <p className='text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground'>System Overview</p>
          <h1 className='text-3xl font-semibold text-foreground md:text-4xl'>Dashboard</h1>
          <p className='text-sm text-muted-foreground'>
            Live service versions across environments, grouped by product area.
          </p>
        </div>

        <div className='space-y-3'>
          <h2 className='text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground'>Quick Access</h2>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
            {quickLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className='flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted'
              >
                {link.icon}
                <span className='truncate'>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className='flex justify-end'>
          <Button onClick={refreshAll} disabled={isFetchingAny} className='w-full md:w-auto'>
            {isFetchingAny && <Loader2 className='animate-spin' aria-hidden />}
            Reload Versions
          </Button>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {sections.map(section => (
            <Card key={section.title} className='border-border/60 bg-card/50'>
              <CardHeader className='space-y-2'>
                <CardTitle className='text-lg font-semibold text-foreground'>{section.title}</CardTitle>
                <p className='text-sm text-muted-foreground'>{section.description}</p>
              </CardHeader>
              <CardContent className='space-y-3'>
                {section.items.map(item => (
                  <ServiceItem key={item.name} item={item} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
