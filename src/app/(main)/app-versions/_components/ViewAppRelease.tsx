'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AppRelease, AppReleaseStatus } from '@/modules/change-log/change-log.model';
import { REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { format } from 'date-fns';
import { Calendar, Package, Tag, CheckCircle2, Clock, FileText, Layers } from 'lucide-react';
import Markdown from '@/components/safe-markdown';

const SectionTitle = ({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Package;
  title: string;
  children?: React.ReactNode;
}) => (
  <h3 className='text-sm font-semibold text-foreground flex items-center gap-2'>
    <span className='flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary'>
      <Icon className='size-3.5' />
    </span>
    {title}
    {children}
  </h3>
);

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
  const tags = (selectedRelease.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  return (
    <div className='space-y-6'>
      {/* Header Section with Version and Status */}
      <div className='bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5 sm:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-3 mb-4'>
          <div>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5'>App Version</p>
            <h2 className='text-3xl font-bold tracking-tight'>v{selectedRelease.appVersion}</h2>
          </div>
          <Badge className={cn('gap-1.5 px-3 py-1', currentStatus.color)}>
            {currentStatus.icon}
            {selectedRelease.status}
          </Badge>
        </div>

        <div className='flex flex-wrap items-center gap-x-6 gap-y-3 text-sm'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Calendar className='w-4 h-4' />
            <span>
              {selectedRelease.releaseDate ? format(selectedRelease.releaseDate, 'MMM dd, yyyy HH:mm') : 'N/A'}
            </span>
          </div>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Layers className='w-4 h-4' />
            <span>
              {componentReleases.length} component{componentReleases.length === 1 ? '' : 's'}
            </span>
          </div>
          {!!tags.length && (
            <div className='flex items-center gap-2'>
              <Tag className='w-4 h-4 text-muted-foreground' />
              <div className='flex flex-wrap gap-1.5'>
                {tags.map((tag, idx) => (
                  <Badge key={idx} variant='outline' className='text-xs px-2 py-0.5 bg-background/60'>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Logs Section */}
      <div className='space-y-3'>
        <SectionTitle icon={FileText} title='Change Logs' />
        <div className='p-5 markdown-prose max-w-none border rounded-lg bg-muted/30 h-[320px] overflow-y-auto custom-scrollbar'>
          {selectedRelease.content ? (
            <Markdown>{selectedRelease.content}</Markdown>
          ) : (
            <div className='flex flex-col items-center justify-center h-full text-muted-foreground'>
              <FileText className='w-10 h-10 mb-3 opacity-40' />
              <p className='text-sm'>No change logs yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Component Releases Section */}
      <div className='space-y-3'>
        <SectionTitle icon={Layers} title='Component Releases'>
          <Badge variant='secondary' className='ml-auto text-xs'>
            {componentReleases.length || 0}
          </Badge>
        </SectionTitle>
        {!componentReleases.length ? (
          <div className='flex flex-col items-center justify-center py-10 border border-dashed rounded-lg text-muted-foreground'>
            <Package className='w-10 h-10 mb-3 opacity-40' />
            <p className='text-sm'>No component releases</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1'>
            {componentReleases?.map(componentRelease => {
              const repo = REPO_NAME_MAPPING?.[componentRelease?.repoName];

              return (
                <div
                  key={componentRelease?.id}
                  className='flex items-center gap-3 rounded-lg border bg-card p-3 hover:shadow-sm hover:border-primary/30 transition-all duration-200'
                >
                  <div
                    className='w-1 self-stretch rounded-full bg-primary shrink-0'
                    style={repo?.color ? { backgroundColor: repo.color } : undefined}
                  />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='font-semibold text-foreground truncate' title={componentRelease?.repoName}>
                        {repo?.name || componentRelease?.repoName}
                      </span>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAppRelease;
