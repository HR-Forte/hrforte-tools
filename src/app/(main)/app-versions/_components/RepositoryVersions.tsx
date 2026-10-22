'use client';

import { Fragment, useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTab } from '@/components/animate-ui/components/base/tabs';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ComponentRelease } from '@/modules/change-log/change-log.model';
import { useDeleteComponentRelease, useGetAllComponentReleases } from '@/modules/change-log/change-log.query';
import { ColumnDef, getCoreRowModel } from '@tanstack/react-table';
import { TableRow, TableHead, TableBody, TableCell, TableHeader, Table } from '@/components/ui/table';
import { useReactTable } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Calendar, Package, FileText, Loader2, PackageOpen, RefreshCcwIcon, Search, Trash } from 'lucide-react';
import Markdown from '@/components/safe-markdown';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import ComponentReleaseModal from './ComponentReleaseModal';
import CreateComponentReleaseModal from './CreateComponentReleaseModal';
import { EndpointName } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { cn, getEndpointOptions } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { QueryError } from '@/components/query-error';
import { getPageWindow } from '@/lib/utils/getPageWindow';

const PAGE_SIZE = 10;

const endPoints = getEndpointOptions('DEV', 'MIA', 'EVA', 'MAP_STAGING', 'MAP_PRODUCTION');

type RepositoryVersionsProps = {
  endpoint: EndpointName;
  setEndpoint: (endpoint: EndpointName) => void;
};

// Up to `size` consecutive page numbers around `page`, clamped so the window never shrinks near the ends.
const RepositoryVersions = ({ endpoint, setEndpoint }: RepositoryVersionsProps) => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<ComponentRelease | null>(null);

  const {
    data: componentReleasesData,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllComponentReleases(
    {
      q: query,
      sorts: ['createdOn.DESC'],
      take: PAGE_SIZE,
      page,
    },
    endpoint
  );
  const { mutateAsync: deleteComponentRelease, isPending: isDeleting } = useDeleteComponentRelease(endpoint);

  const componentReleases = componentReleasesData?.data;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => setPage(1), [endpoint]);

  const openRelease = (release: ComponentRelease) => {
    setSelectedRelease(release);
    setIsDialogOpen(true);
  };

  const columns: ColumnDef<ComponentRelease>[] = [
    {
      id: 'repoName',
      header: () => (
        <div className='flex items-center gap-2 font-semibold text-foreground'>
          <Package className='w-4 h-4' />
          Repository Name
        </div>
      ),
      cell: ({ row }) => {
        return (
          <Badge style={{ backgroundColor: REPO_NAME_MAPPING?.[row.original.repoName]?.color }}>
            {REPO_NAME_MAPPING?.[row.original.repoName]?.name || row.original.repoName}
          </Badge>
        );
      },
    },
    {
      id: 'repoVersion',
      header: () => <div className='font-semibold text-foreground'>Version</div>,
      cell: ({ row }) => {
        return (
          <Badge
            variant={row.original.repoVersion.match(/^\d+\.\d+\.0+$/) ? 'default' : 'outline'}
            className='font-mono'
          >
            v{row.original.repoVersion}
          </Badge>
        );
      },
    },
    {
      id: 'releaseDate',
      header: () => (
        <div className='flex items-center gap-2 font-semibold text-foreground'>
          <Calendar className='w-4 h-4' />
          Release Date
        </div>
      ),
      cell: ({ row }) => {
        return (
          <div className='flex items-center gap-2 text-sm'>
            <span>{format(row.original.releaseDate, 'MMM dd, yyyy')}</span>
            <span className='text-muted-foreground'>{format(row.original.releaseDate, 'hh:mm a • zzz')}</span>
          </div>
        );
      },
    },
    {
      id: 'content',
      header: () => (
        <div className='flex items-center gap-2 font-semibold text-foreground'>
          <FileText className='w-4 h-4' />
          Change Logs
        </div>
      ),
      cell: ({ row }) => {
        return (
          <div className='max-w-md'>
            <Markdown className='markdown-prose text-sm line-clamp-3'>{row.original.content}</Markdown>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className='font-semibold text-foreground'>Actions</div>,
      cell: ({ row }) => {
        return (
          <div onClick={e => e.stopPropagation()}>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='outline' aria-label='Delete component release'>
                  <Trash className='w-4 h-4 text-destructive' />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Component Release</DialogTitle>
                </DialogHeader>
                <DialogDescription>Are you sure you want to delete this component release?</DialogDescription>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant='outline' onClick={e => e.stopPropagation()}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      variant='destructive'
                      disabled={isDeleting}
                      onClick={e => {
                        e.stopPropagation();

                        if (row.original.id) {
                          deleteComponentRelease(row.original.id).catch(() => undefined);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: componentReleases || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Fragment>
      <Card className='border-2 w-full h-[calc(100vh-80px)] pt-0'>
        <CardHeader className='sticky top-0 bg-gradient-to-br from-background via-background to-primary/5 z-20 border-b-2 p-6 rounded-xl'>
          <div className='flex flex-col gap-3 justify-between'>
            <div className='flex justify-center flex-col gap-3'>
              <CardTitle className='text-2xl flex items-center gap-3'>
                <Package className='w-6 h-6 text-primary' />
                <span>Repository Versions</span>
                <Badge variant='secondary' className='text-sm px-3 py-1'>
                  {componentReleasesData?.itemCount || 0} Total
                </Badge>
              </CardTitle>
            </div>

            <div className='flex flex-wrap gap-2 justify-between'>
              <div className='flex flex-wrap gap-2 items-center'>
                <div className='relative w-full sm:w-auto sm:max-w-md'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                  <Input
                    placeholder='Search repository versions...'
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                    }}
                    className='pl-10 bg-background'
                  />
                </div>

                <Separator orientation='vertical' />

                <Tabs value={endpoint} onValueChange={value => setEndpoint(value)}>
                  <TabsList>
                    {endPoints.map(tab => (
                      <TabsTab key={tab.value} value={tab.value}>
                        {tab.label}
                      </TabsTab>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className='flex gap-2 items-center'>
                <CreateComponentReleaseModal endpoint={endpoint} />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => refetch()}
                  disabled={isFetching}
                  aria-label='Refresh repository versions'
                >
                  <RefreshCcwIcon className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className=''>
          {/* Scrollable container */}
          <div className='overflow-auto max-h-[calc(100vh-340px)] rounded-lg border-2 overflow-y-auto'>
            <Table className='border-collapse'>
              <TableHeader className='sticky top-0 bg-muted/50 backdrop-blur-sm z-10 border-b-2'>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className='py-4'>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-64'>
                      <div className='flex flex-col items-center justify-center gap-3 text-muted-foreground'>
                        <Loader2 className='w-8 h-8 animate-spin text-primary' />
                        <p className='text-sm'>Loading repository versions...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow className='hover:bg-transparent'>
                    <TableCell colSpan={columns.length} className='p-4'>
                      <QueryError error={error} onRetry={refetch} title="Couldn't load repository versions" />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className='cursor-pointer hover:bg-primary/5 transition-colors border-b group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                      role='button'
                      tabIndex={0}
                      onClick={() => openRelease(row.original)}
                      onKeyDown={e => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openRelease(row.original);
                        }
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell className='align-top py-4' key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-64'>
                      <div className='flex flex-col items-center justify-center gap-3 text-muted-foreground'>
                        <PackageOpen className='w-12 h-12 opacity-40' />
                        <p className='text-sm font-medium'>No repository versions found</p>
                        <p className='text-xs'>Create a new component release to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter className='border-t-2 bg-muted/20 px-6 py-4'>
          <div className='flex items-center justify-between w-full'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => !isPending && setPage(page - 1)}
                    className={
                      page <= 1 || isPending
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer hover:bg-primary/10 transition-colors'
                    }
                  />
                </PaginationItem>

                {getPageWindow(page, componentReleasesData?.pageCount || 0, 5).map(pageNumber => {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => !isPending && setPage(pageNumber)}
                        isActive={page === pageNumber}
                        className={
                          isPending
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer hover:bg-primary/10 transition-colors'
                        }
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => !isPending && setPage(page + 1)}
                    className={
                      page >= (componentReleasesData?.pageCount || 1) || isPending
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer hover:bg-primary/10 transition-colors'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardFooter>
      </Card>

      <ComponentReleaseModal
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedRelease={selectedRelease}
        endpoint={endpoint}
      />
    </Fragment>
  );
};

export default RepositoryVersions;
