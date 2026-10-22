'use client';

import { Fragment, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppRelease, AppReleaseStatus } from '@/modules/change-log/change-log.model';
import {
  useDeleteAppRelease,
  useGetAllAppReleases,
  useGetRecommendedAppVersion,
  useUpdateAppRelease,
} from '@/modules/change-log/change-log.query';
import { format, formatDistanceToNow } from 'date-fns';
import Markdown from '@/components/safe-markdown';
import CreateAppReleaseModal from './CreateAppReleaseModal';
import AppReleaseModal from './AppReleaseModal';
import {
  RefreshCcwIcon,
  Calendar,
  Package,
  FileText,
  ChevronRight,
  Layers,
  Search,
  Rocket,
  Trash2,
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn, getEndpointOptions } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { EndpointName } from '@/lib/api/types';
import { Tabs, TabsList, TabsTab } from '@/components/animate-ui/components/base/tabs';
import CreateAppReleaseByDateRangeModal from './CreateAppReleaseByDateRangeModal';
import { QueryError } from '@/components/query-error';

const PAGE_SIZE = 10;

const endpoints = getEndpointOptions('DEV', 'MIA', 'EVA', 'MAP_STAGING', 'MAP_PRODUCTION');

// First, last, and current±1 pages; null marks a gap.
const getPageItems = (page: number, pageCount: number) => {
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter(p => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? [null, p] : [p]));
};

type ConfirmAction = { type: 'publish' | 'delete'; release: AppRelease };

type AppVersionsProps = {
  endpoint: EndpointName;
  setEndpoint: (endpoint: EndpointName) => void;
};

const AppVersions = ({ endpoint, setEndpoint }: AppVersionsProps) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState(search);
  const {
    data: appReleasesData,
    refetch,
    isPending,
    isFetching,
    isError,
    error,
  } = useGetAllAppReleases({ sorts: ['releaseDate.DESC'], take: PAGE_SIZE, page, q: searchQuery }, endpoint);
  const { data: recommendedAppVersion } = useGetRecommendedAppVersion(endpoint);
  const { mutate: updateAppRelease, isPending: isPublishing, variables: publishVars } = useUpdateAppRelease(endpoint);
  const { mutate: deleteAppRelease, isPending: isDeleting, variables: deleteId } = useDeleteAppRelease(endpoint);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<AppRelease | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => setPage(1), [endpoint]);

  const handleReleaseClick = (release: AppRelease) => {
    setSelectedRelease(release);
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, release } = confirmAction;
    if (type === 'publish') {
      updateAppRelease({ id: release.id, body: { status: AppReleaseStatus.PUBLISHED } });
    } else {
      deleteAppRelease(release.id);
    }
  };

  const stats = [
    { label: 'Latest', value: recommendedAppVersion?.latest ? `v${recommendedAppVersion.latest}` : '—' },
    {
      label: 'Published',
      value: recommendedAppVersion?.publishedLatest ? `v${recommendedAppVersion.publishedLatest}` : '—',
    },
    { label: 'Total', value: appReleasesData?.itemCount ?? '—' },
  ];
  const pageCount = appReleasesData?.pageCount ?? 0;

  return (
    <Fragment>
      <div className='w-full h-[calc(100vh-80px)] flex flex-col'>
        {/* Header Section */}
        <div className='p-6 pb-4 bg-gradient-to-br from-primary/5 to-transparent border-b rounded-lg'>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap justify-between items-center gap-4'>
              <h1 className='text-3xl font-bold flex items-center gap-3'>
                <Package className='w-8 h-8 text-primary' />
                App Versions
              </h1>
              <div className='flex flex-wrap gap-2'>
                {stats.map(stat => (
                  <div key={stat.label} className='flex flex-col rounded-lg border bg-background px-4 py-2 min-w-28'>
                    <span className='text-xs uppercase tracking-wide text-muted-foreground'>{stat.label}</span>
                    <span className='font-mono font-semibold text-primary'>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Toolbar */}
            <div className='flex flex-wrap gap-2 justify-between'>
              <div className='flex flex-wrap items-center gap-2'>
                <div className='relative w-72'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Input
                    placeholder='Search app versions...'
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                    }}
                    className='pl-10 bg-background'
                  />
                </div>
                <Tabs value={endpoint} onValueChange={value => setEndpoint(value)}>
                  <TabsList>
                    {endpoints.map(tab => (
                      <TabsTab key={tab.value} value={tab.value}>
                        {tab.label}
                      </TabsTab>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <div className='flex gap-2'>
                <CreateAppReleaseByDateRangeModal endpoint={endpoint} />
                <CreateAppReleaseModal endpoint={endpoint} />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => refetch()}
                  disabled={isFetching}
                  aria-label='Refresh'
                >
                  <RefreshCcwIcon className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className='flex-1 overflow-y-auto my-4'>
          {isPending ? (
            <div className='grid gap-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='rounded-xl border p-6 space-y-3 animate-pulse'>
                  <div className='h-7 w-40 rounded bg-muted' />
                  <div className='h-4 w-64 rounded bg-muted' />
                  <div className='h-4 w-full rounded bg-muted' />
                </div>
              ))}
            </div>
          ) : isError ? (
            <QueryError error={error} onRetry={refetch} title="Couldn't load app versions" />
          ) : appReleasesData?.data?.length ? (
            <div className='grid gap-4'>
              {appReleasesData.data.map(release => {
                const isPublished = release.status === AppReleaseStatus.PUBLISHED;
                const publishing = isPublishing && publishVars?.id === release.id;
                const deleting = isDeleting && deleteId === release.id;
                const releaseDate = new Date(release.releaseDate);

                return (
                  <Card
                    key={release.id}
                    className={cn(
                      'hover:shadow-md transition-shadow cursor-pointer group border-l-4 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isPublished ? 'border-l-green-500' : 'border-l-amber-400',
                      deleting && 'opacity-50 pointer-events-none'
                    )}
                    role='button'
                    tabIndex={0}
                    onClick={() => handleReleaseClick(release)}
                    onKeyDown={e => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleReleaseClick(release);
                      }
                    }}
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-3 mb-2'>
                            <CardTitle className='text-2xl font-mono font-bold'>v{release.appVersion}</CardTitle>
                            <Badge
                              variant={isPublished ? 'default' : 'outline'}
                              className={cn(
                                isPublished
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'border-amber-400 text-amber-600 dark:text-amber-400'
                              )}
                            >
                              {release.status}
                            </Badge>
                          </div>
                          <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
                            <div className='flex items-center gap-1'>
                              <Calendar className='w-4 h-4' />
                              {format(releaseDate, 'MMM dd, yyyy • hh:mm a')}
                              <span className='text-xs'>({formatDistanceToNow(releaseDate, { addSuffix: true })})</span>
                            </div>
                            {!!release.componentReleases?.length && (
                              <div className='flex items-center gap-1'>
                                <Layers className='w-4 h-4' />
                                {release.componentReleases.length} component
                                {release.componentReleases.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className='flex items-center gap-1' onClick={e => e.stopPropagation()}>
                          {!isPublished && (
                            <Button
                              size='sm'
                              onClick={() => setConfirmAction({ type: 'publish', release })}
                              disabled={publishing}
                            >
                              {publishing ? <Spinner className='w-4 h-4' /> : <Rocket className='w-4 h-4' />}
                              Publish
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={`Delete v${release.appVersion}`}
                            className='text-destructive hover:text-destructive hover:bg-destructive/10'
                            onClick={() => setConfirmAction({ type: 'delete', release })}
                            disabled={deleting}
                          >
                            {deleting ? <Spinner className='w-4 h-4' /> : <Trash2 className='w-4 h-4' />}
                          </Button>
                          <ChevronRight className='w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors' />
                        </div>
                      </div>

                      {/* Tags */}
                      {release.tags && (
                        <div className='flex flex-wrap gap-2 mt-3'>
                          {release.tags.split(',').map(tag => (
                            <Badge key={tag} variant='secondary' className='text-xs'>
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>

                    {/* Change Logs Preview */}
                    {release.content && (
                      <CardContent className='pt-0'>
                        <div className='flex items-start gap-2 text-sm'>
                          <FileText className='w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0' />
                          <div className='flex-1 min-w-0'>
                            <div className='line-clamp-3 prose prose-sm dark:prose-invert max-w-none'>
                              <Markdown>{release.content}</Markdown>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-64 gap-4'>
              <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center'>
                <Package className='w-8 h-8 text-muted-foreground' />
              </div>
              <div className='text-center'>
                <h3 className='font-semibold text-lg mb-1'>No app versions found</h3>
                <p className='text-sm text-muted-foreground'>
                  {searchQuery ? 'Try adjusting your search query' : 'Create your first app release to get started'}
                </p>
              </div>
              {!searchQuery && <CreateAppReleaseModal endpoint={endpoint} />}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {pageCount > 1 && (
          <div className='p-4 border-t bg-muted/20'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => !isFetching && setPage(page - 1)}
                    className={
                      page <= 1 || isFetching ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'
                    }
                  />
                </PaginationItem>

                {getPageItems(page, pageCount).map((p, index) =>
                  p === null ? (
                    <PaginationItem key={`gap-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => !isFetching && setPage(p)}
                        isActive={page === p}
                        className={isFetching ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => !isFetching && setPage(page + 1)}
                    className={
                      page >= pageCount || isFetching
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer hover:bg-accent'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={open => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'publish' ? 'Publish' : 'Delete'} v{confirmAction?.release.appVersion}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'publish'
                ? 'This release will be marked as published and become visible to users.'
                : 'This release will be permanently deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmAction?.type === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              className='cursor-pointer'
            >
              {confirmAction?.type === 'publish' ? 'Publish' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isDialogOpen && (
        <AppReleaseModal
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          selectedRelease={selectedRelease}
          endpoint={endpoint}
        />
      )}
    </Fragment>
  );
};

export default AppVersions;
