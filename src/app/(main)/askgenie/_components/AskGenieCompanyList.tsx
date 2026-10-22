'use client';

import { Tabs, TabsList, TabsTab } from '@/components/animate-ui/components/base/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EndpointName } from '@/lib/api/types';
import { cn, getEndpointOptions } from '@/lib/utils';
import {
  useSyncAllAskGenie,
  useSyncAskGenie,
  useUnsyncAllAskGenie,
  useUnsyncAskGenie,
} from '@/modules/askgenie/askgenie.query';
import { CompanyWithESmartTimeAndAskGenie } from '@/modules/company/company.model';
import { useGetAllCompanyWithESmartTimeAndAskGenie } from '@/modules/company/company.query';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, FolderSync, Link2Off, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { QueryError } from '@/components/query-error';
import { getPageWindow } from '@/lib/utils/getPageWindow';

const tabs = getEndpointOptions('MIA', 'EVA', 'DEV', 'MAP_STAGING', 'MAP_PRODUCTION');

const companyStatusValues = {
  active: true,
  inactive: false,
  none: undefined,
};

const askGenieStatusValues = {
  synced: true,
  unsynced: false,
  none: undefined,
};

// Up to `size` consecutive page numbers around `page`, clamped so the window never shrinks near the ends.
const AskGenieCompanyList = () => {
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: false }]);
  const [endpoint, setEndpoint] = useState<EndpointName>('MIA');
  const [companyStatus, setCompanyStatus] = useState<keyof typeof companyStatusValues>('active');
  const [askGenieStatus, setAskGenieStatus] = useState<keyof typeof askGenieStatusValues>('none');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(inputValue);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => setPage(1), [endpoint]);

  const {
    data: companyWithAskGenieData,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllCompanyWithESmartTimeAndAskGenie(
    {
      page,
      take: 20,
      q: query,
      sort: sorting[0]?.id as keyof CompanyWithESmartTimeAndAskGenie,
      order: sorting[0]?.desc ? 'DESC' : 'ASC',
      isActive: companyStatusValues[companyStatus],
      isSyncedHrfRag: askGenieStatusValues[askGenieStatus],
    },
    endpoint
  );

  const companies = companyWithAskGenieData?.data;

  const { mutate: syncAskGenie, isPending: isSyncing } = useSyncAskGenie();
  const { mutate: unsyncAskGenie, isPending: isUnsyncing } = useUnsyncAskGenie();
  const { mutate: syncAllAskGenie, isPending: isSyncingAll } = useSyncAllAskGenie();
  const { mutate: unsyncAllAskGenie, isPending: isUnsyncingAll } = useUnsyncAllAskGenie();

  const isLoading = isPending || isSyncing || isUnsyncing || isSyncingAll || isUnsyncingAll;

  const columns: ColumnDef<CompanyWithESmartTimeAndAskGenie>[] = [
    {
      id: 'id',
      header: 'ID',
      accessorKey: 'id',
      enableSorting: true,
    },
    {
      id: 'name',
      header: 'Company',
      accessorKey: 'name',
      enableSorting: true,
      cell: ({ row }) => {
        return <div className='text-sm font-medium w-[300px] truncate'>{row.original.name}</div>;
      },
    },
    {
      id: 'code',
      header: 'Code',
      accessorKey: 'code',
      enableSorting: true,
      cell: ({ row }) => {
        return <div className='text-sm font-medium truncate'>{row.original.code}</div>;
      },
    },
    {
      id: 'number_of_employees',
      header: 'Number of Employees',
      accessorKey: 'employeeCount',
      enableSorting: true,
      cell: ({ row }) => {
        return <div className='text-sm font-medium w-[100px] truncate'>{row.original.employeeCount || 0}</div>;
      },
    },
    {
      id: 'number_of_admins',
      header: 'Number of Admins',
      accessorKey: 'companyUserRoleCount',
      enableSorting: true,
      cell: ({ row }) => {
        return <div className='text-sm font-medium w-[100px] truncate'>{row.original.companyUserRoleCount || 0}</div>;
      },
    },
    {
      id: 'Active',
      header: 'Active',
      accessorKey: 'active',
      enableSorting: true,
      cell: ({ row }) => {
        return (
          <Badge className={row.original.active ? 'bg-[#2f7ad1]' : 'bg-destructive'}>
            {row.original.active ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'companyMappings',
      enableSorting: true,
      cell: ({ row }) => {
        return (
          <Badge
            className={row.original.hrfRagCompanyMapping?.isActive ? 'bg-[#3b693a]' : 'bg-muted text-muted-foreground'}
          >
            {row.original.hrfRagCompanyMapping?.isActive ? 'Synced' : 'Not Synced'}
          </Badge>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }) => {
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                disabled={isLoading}
                className='text-sm w-[100px]'
                variant={row.original.hrfRagCompanyMapping?.isActive ? 'destructive' : 'default'}
              >
                {row.original.hrfRagCompanyMapping?.isActive ? <Link2Off /> : <FolderSync />}
                {row.original.hrfRagCompanyMapping?.isActive ? 'Unsync' : 'Sync'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  {row.original.hrfRagCompanyMapping?.isActive ? (
                    <span>
                      Company <span className='font-bold'>{row.original.name}</span> is already{' '}
                      <span className='text-destructive font-bold'>SYNCED</span> with AskGenie. Do you want to unsync
                      now?
                    </span>
                  ) : (
                    <span>
                      Company <span className='font-bold'>{row.original.name}</span> is{' '}
                      <span className='text-destructive font-bold'>NOT SYNCED</span> with AskGenie. Do you want to sync
                      now?
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    disabled={isLoading}
                    variant={row.original.hrfRagCompanyMapping?.isActive ? 'destructive' : 'default'}
                    onClick={() => {
                      if (row.original.hrfRagCompanyMapping?.isActive) {
                        unsyncAskGenie({ companyId: row.original.id, endpoint });
                      } else {
                        syncAskGenie({ companyId: row.original.id, endpoint });
                      }
                    }}
                  >
                    {row.original.hrfRagCompanyMapping?.isActive ? 'Unsync' : 'Sync'}
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant='outline'>Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      },
    },
  ];

  const table = useReactTable({
    data: companies || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true, //turn off client-side pagination
  });

  return (
    <div className='w-full h-full'>
      <Card className='shadow-none w-full h-full'>
        <CardHeader className='flex flex-col gap-5'>
          <CardTitle className='text-2xl font-bold'>AskGenie</CardTitle>
          <div className='flex flex-wrap items-center gap-2'>
            <Tabs value={endpoint} onValueChange={value => setEndpoint(value)}>
              <TabsList>
                {tabs.map(tab => (
                  <TabsTab key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTab>
                ))}
              </TabsList>
            </Tabs>

            {(endpoint === 'EVA' || endpoint === 'MAP_PRODUCTION') && (
              <Badge variant='destructive' className='whitespace-normal'>
                Production: changes here affect live customers. Don&apos;t do the stupid things.
              </Badge>
            )}
          </div>
          <div className='w-full flex flex-wrap items-center justify-between gap-2'>
            <div className='flex flex-wrap items-center gap-3'>
              <Input
                placeholder='Search company name, ID, etc.'
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className='w-full sm:w-[400px]'
              />

              <Separator orientation='vertical' className='hidden sm:block data-[orientation=vertical]:h-7' />

              <div className='flex flex-wrap items-center gap-3'>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant='default' disabled={isLoading}>
                      <FolderSync />
                      Sync All
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                      Are you sure you want to sync all companies? This action cannot be undone.
                    </DialogDescription>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant='outline'>Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button onClick={() => syncAllAskGenie(endpoint)} disabled={isLoading}>
                          Sync All
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant='destructive' disabled={isLoading}>
                      <Link2Off />
                      Unsync All
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                      Are you sure you want to unsync all companies? This action cannot be undone.
                    </DialogDescription>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant='outline'>Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button variant='destructive' onClick={() => unsyncAllAskGenie(endpoint)} disabled={isLoading}>
                          Unsync All
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Separator orientation='vertical' className='hidden sm:block data-[orientation=vertical]:h-7' />

                <div className='flex items-center gap-2'>
                  <Label className='text-sm font-medium'>AskGenie Status</Label>
                  <Select
                    value={askGenieStatus}
                    onValueChange={value => {
                      setAskGenieStatus(value as keyof typeof askGenieStatusValues);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='AskGenie Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='synced'>Synced</SelectItem>
                      <SelectItem value='unsynced'>Unsynced</SelectItem>
                      <SelectItem value='none'>None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator orientation='vertical' className='hidden sm:block data-[orientation=vertical]:h-7' />

                <div className='flex items-center gap-2'>
                  <Label className='text-sm font-medium'>Company Status</Label>
                  <Select
                    value={companyStatus}
                    onValueChange={value => {
                      setCompanyStatus(value as keyof typeof companyStatusValues);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Company Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                      <SelectItem value='none'>None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button
              variant='outline'
              aria-label='Refresh companies'
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
            >
              <RefreshCcw className={cn(isFetching && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className='flex flex-col max-h-[calc(100vh-100px)] overflow-hidden'>
          <div className='overflow-auto'>
            <Table>
              <TableHeader className='sticky top-0 z-10 bg-background'>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const sorted = header.column.getIsSorted();
                      const content = (
                        <>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' && <ChevronUp size={14} aria-hidden />}
                          {sorted === 'desc' && <ChevronDown size={14} aria-hidden />}
                        </>
                      );
                      return (
                        <TableHead
                          key={header.id}
                          aria-sort={
                            !header.column.getCanSort()
                              ? undefined
                              : sorted === 'asc'
                                ? 'ascending'
                                : sorted === 'desc'
                                  ? 'descending'
                                  : 'none'
                          }
                        >
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <button
                              type='button'
                              className='flex items-center gap-2 select-none cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {content}
                            </button>
                          ) : (
                            <div className='flex items-center gap-2'>{content}</div>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-24 text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <Spinner />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow className='hover:bg-transparent'>
                    <TableCell colSpan={columns.length} className='p-4'>
                      <QueryError error={error} onRetry={refetch} title="Couldn't load companies" />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className='hover:bg-muted/50'>
                      {row.getVisibleCells().map(cell => (
                        <TableCell className='align-top' key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className='h-24 text-center'>
                      No companies found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {!isPending && (
          <CardFooter>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => !isPending && setPage(page - 1)}
                    className={
                      page <= 1 || isPending ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'
                    }
                  />
                </PaginationItem>

                {getPageWindow(page, companyWithAskGenieData?.pageCount || 0).map(pageNumber => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => !isPending && setPage(pageNumber)}
                      isActive={page === pageNumber}
                      className={isPending ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => !isPending && setPage(page + 1)}
                    className={
                      page >= (companyWithAskGenieData?.pageCount || 1) || isPending
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer hover:bg-accent'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AskGenieCompanyList;
