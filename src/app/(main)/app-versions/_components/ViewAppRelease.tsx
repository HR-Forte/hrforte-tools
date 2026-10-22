'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AppRelease, AppReleaseStatus } from '@/modules/change-log/change-log.model';
import { format } from 'date-fns';
import { Calendar, Package, Tag, CheckCircle2, Clock } from 'lucide-react';
import Markdown from '@/components/safe-markdown';

const ViewAppRelease = ({ selectedRelease }: { selectedRelease: AppRelease | null }) => {
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

  const currentStatus = statusConfig[selectedRelease.status] || statusConfig[AppReleaseStatus.DRAFT];
  const componentReleases = selectedRelease?.componentReleases?.filter(Boolean) || [];

  return (
    <div className='space-y-6'>
      {/* Header Section with Version and Status */}
      <div className='bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2'>App Version</p>
            <h2 className='text-3xl font-bold tracking-tight'>v{selectedRelease.appVersion}</h2>
          </div>
          <Badge className={cn('gap-1.5 px-3 py-1', currentStatus.color)}>
            {currentStatus.icon}
            {selectedRelease.status}
          </Badge>
        </div>

        <div className='flex items-center gap-6 text-sm'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Calendar className='w-4 h-4' />
            <span>
              {selectedRelease.releaseDate ? format(selectedRelease.releaseDate, 'MMM dd, yyyy HH:mm') : 'N/A'}
            </span>
          </div>
          {selectedRelease.tags && (
            <div className='flex items-center gap-2'>
              <Tag className='w-4 h-4 text-muted-foreground' />
              <div className='flex flex-wrap gap-1.5'>
                {selectedRelease.tags.split(',').map((tag, idx) => (
                  <Badge key={idx} variant='outline' className='text-xs px-2 py-0.5'>
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Logs Section */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
          <div className='w-1 h-5 bg-primary rounded-full' />
          Change Logs
        </h3>
        <Card className='border-2 shadow-sm p-0'>
          <CardContent className='p-0'>
            <div className='p-6 markdown-prose max-w-none bg-muted/30 rounded-lg h-[320px] overflow-y-auto custom-scrollbar'>
              <Markdown>{selectedRelease.content}</Markdown>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Component Releases Section */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
          <div className='w-1 h-5 bg-primary rounded-full' />
          Component Releases
          <Badge variant='secondary' className='ml-auto text-xs'>
            {componentReleases.length || 0}
          </Badge>
        </h3>
        <div className='flex flex-col gap-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1'>
          {!componentReleases.length ? (
            <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
              <Package className='w-10 h-10 mb-3 opacity-40' />
              <p className='text-sm'>No component releases</p>
            </div>
          ) : (
            componentReleases?.map(componentRelease => (
              <Card
                key={componentRelease?.id}
                className='group hover:shadow-md hover:border-primary/30 transition-all duration-200'
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                      <div className='w-2 h-2 rounded-full bg-primary flex-shrink-0' />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='font-semibold text-foreground truncate'>{componentRelease?.repoName}</span>
                          <Badge variant='outline' className='text-xs px-2 py-0 shrink-0'>
                            v{componentRelease?.repoVersion}
                          </Badge>
                        </div>
                        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                          <Calendar className='w-3 h-3' />
                          <span>
                            {componentRelease?.releaseDate
                              ? format(componentRelease?.releaseDate, 'MMM dd, yyyy HH:mm')
                              : '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAppRelease;
