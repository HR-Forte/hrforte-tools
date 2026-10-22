'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ComponentRelease } from '@/modules/change-log/change-log.model';
import { format } from 'date-fns';
import { Calendar, Package, GitBranch, AppWindow, CheckCircle2, Clock } from 'lucide-react';
import Markdown from '@/components/safe-markdown';
import { AppReleaseStatus } from '@/modules/change-log/change-log.model';
import { cn } from '@/lib/utils';
import { REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';

const ViewComponentRelease = ({ selectedRelease }: { selectedRelease: ComponentRelease | null }) => {
  if (!selectedRelease) {
    return (
      <div className='flex items-center justify-center h-64 text-muted-foreground'>
        <div className='text-center'>
          <Package className='w-12 h-12 mx-auto mb-3 opacity-50' />
          <p>No release selected</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    [AppReleaseStatus.PUBLISHED]: {
      color: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
      icon: <CheckCircle2 className='w-3 h-3' />,
    },
    [AppReleaseStatus.DRAFT]: {
      color: 'bg-muted hover:bg-muted/80 text-muted-foreground border-border',
      icon: <Clock className='w-3 h-3' />,
    },
  };

  return (
    <div className='space-y-6'>
      {/* Header Section with Repository and Version */}
      <div className='bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex flex-col gap-2'>
            <p className='text-xs font-medium text-muted-foreground tracking-wider flex items-center gap-2'>
              <GitBranch className='w-3 h-3' />
              REPOSITORY ({selectedRelease.repoName})
            </p>

            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold tracking-tight mb-3'>
                {REPO_NAME_MAPPING?.[selectedRelease.repoName]?.name}
              </h2>

              <Badge variant='outline' className='text-sm px-3 py-1 font-mono'>
                v{selectedRelease.repoVersion}
              </Badge>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Calendar className='w-4 h-4' />
          <span>Released on</span>
          <span className='font-mono'>
            {format(new Date(selectedRelease?.createdOn || ''), 'MMMM dd, yyyy')} at{' '}
            {format(new Date(selectedRelease?.createdOn || ''), 'HH:mm')}
          </span>
        </div>
      </div>

      {/* Change Logs Section */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
          <div className='w-1 h-5 bg-primary rounded-full' />
          Change Logs
        </h3>
        <Card className='border-2 shadow-sm py-0'>
          <CardContent className='p-0'>
            <div className='markdown-prose max-w-none p-6 bg-muted/30 rounded-lg h-[320px] overflow-y-auto custom-scrollbar'>
              <Markdown>{selectedRelease.content}</Markdown>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Releases Section */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
          <div className='w-1 h-5 bg-primary rounded-full' />
          Associated App Releases
          <Badge variant='secondary' className='ml-auto text-xs'>
            {selectedRelease.appReleases?.length || 0}
          </Badge>
        </h3>
        <div className='flex flex-col gap-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1'>
          {!selectedRelease.appReleases?.length ? (
            <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
              <AppWindow className='w-10 h-10 mb-3 opacity-40' />
              <p className='text-sm'>No app releases associated</p>
              <p className='text-xs mt-1'>This component hasn&apos;t been included in any app release yet</p>
            </div>
          ) : (
            selectedRelease.appReleases.map(appRelease => {
              const currentStatus = statusConfig[appRelease.status] || statusConfig[AppReleaseStatus.DRAFT];
              return (
                <Card
                  key={appRelease.id}
                  className='group hover:shadow-md hover:border-primary/30 transition-all duration-200'
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        <div className='w-2 h-2 rounded-full bg-primary flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <span className='font-semibold text-foreground'>v{appRelease.appVersion}</span>
                            <Badge className={cn('gap-1.5 px-2 py-0.5 text-xs', currentStatus.color)}>
                              {currentStatus.icon}
                              {appRelease.status}
                            </Badge>
                          </div>
                          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                            <Calendar className='w-3 h-3' />
                            <span>
                              {appRelease?.releaseDate
                                ? format(new Date(appRelease?.releaseDate || ''), 'MMM dd, yyyy HH:mm')
                                : 'Not released yet'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewComponentRelease;
