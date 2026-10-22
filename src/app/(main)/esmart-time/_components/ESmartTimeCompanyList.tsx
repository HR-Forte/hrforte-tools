'use client';

import { Tabs, TabsList, TabsTab } from '@/components/animate-ui/components/base/tabs';
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
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EndpointName } from '@/lib/api/types';
import { cn, getEndpointOptions } from '@/lib/utils';
import { CompanyWithESmartTimeAndAskGenie } from '@/modules/company/company.model';
import { useGetAllCompanyWithESmartTimeAndAskGenie } from '@/modules/company/company.query';
import { useSyncESmartTime, useUnsyncESmartTime } from '@/modules/e-smart-time/esmart-time.query';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FolderSync, Link2Off, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QueryError } from '@/components/query-error';
import { getPageWindow } from '@/lib/utils/getPageWindow';

const endPoints = getEndpointOptions('MIA', 'EVA', 'DEV');

const companyStatusValues = {
  active: true,
  inactive: false,
  none: undefined,
};

const eSmartTimeStatusValues = {
  synced: true,
  unsynced: false,
  none: undefined,
};

// Up to `size` consecutive page numbers around `page`, clamped so the window never shrinks near the ends.
const ESmartTimeCompanyList = () => {
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [endpoint, setEndpoint] = useState<EndpointName>('MIA');
  const [companyStatus, setCompanyStatus] = useState<keyof typeof companyStatusValues>('active');
  const [eSmartTimeStatus, setESmartTimeStatus] = useState<keyof typeof eSmartTimeStatusValues>('none');

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
    data: companyWithESmartTimeData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllCompanyWithESmartTimeAndAskGenie(
    {
      page,
      take: 20,
      q: query,
      sort: 'name',
      order: 'ASC',
      isActive: companyStatusValues[companyStatus],
      isSyncedESmartTime: eSmartTimeStatusValues[eSmartTimeStatus],
    },
    endpoint
  );

  const { mutate: syncESmartTime, isPending: isSyncing } = useSyncESmartTime(endpoint);
  const { mutate: unsyncESmartTime, isPending: isUnsyncing } = useUnsyncESmartTime(endpoint);
  const isMutating = isSyncing || isUnsyncing;

  const companies = companyWithESmartTimeData?.data;

  const columns: ColumnDef<CompanyWithESmartTimeAndAskGenie>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
    },
    {
      header: 'Company',
      accessorKey: 'name',
      cell: ({ row }) => {
        return <div className='text-sm font-medium w-[300px] truncate'>{row.original.name}</div>;
      },
    },
    {
      header: 'Code',
      accessorKey: 'code',
      cell: ({ row }) => {
        return <div className='text-sm font-medium truncate'>{row.original.code}</div>;
      },
    },
    {
      header: 'Number of Employees',
      accessorKey: 'employeeCount',
      cell: ({ row }) => {
        return <div className='text-sm font-medium w-[100px] truncate'>{row.original.employeeCount || 0}</div>;
      },
    },
    {
      header: 'Number of Admins',
      accessorKey: 'companyUserRoleCount',
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
      header: 'Status',
      accessorKey: 'companyMappings',
      cell: ({ row }) => {
        return (
          <Badge className={row.original.companyMappings ? 'bg-[#3b693a]' : 'bg-muted text-muted-foreground'}>
            {row.original.companyMappings ? 'Synced' : 'Not Synced'}
          </Badge>
        );
      },
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }) => {
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button className='text-sm w-[100px]' variant={row.original.companyMappings ? 'destructive' : 'default'}>
                {row.original.companyMappings ? <Link2Off /> : <FolderSync />}
                {row.original.companyMappings ? 'Unsync' : 'Sync'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  {row.original.companyMappings ? (
                    <span>
                      Company <span className='font-bold'>{row.original.name}</span> is already{' '}
                      <span className='text-destructive font-bold'>SYNCED</span> with E-Smart Time. Do you want to
                      unsync now?
                    </span>
                  ) : (
                    <span>
                      Company <span className='font-bold'>{row.original.name}</span> is{' '}
                      <span className='text-destructive font-bold'>NOT SYNCED</span> with E-Smart Time. Do you want to
                      sync now?
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    disabled={isLoading || isMutating}
                    variant={row.original.companyMappings ? 'destructive' : 'default'}
                    onClick={() => {
                      if (row.original.companyMappings) {
                        unsyncESmartTime({ companyId: row.original.id });
                      } else {
                        syncESmartTime({ companyId: row.original.id });
                      }
                    }}
                  >
                    {row.original.companyMappings ? 'Unsync' : 'Sync'}
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
  });

  return (
    <Card className='shadow-none w-full h-full'>
      <CardHeader className='flex flex-col gap-5'>
        <CardTitle className='text-2xl font-bold'>E-Smart Time</CardTitle>
        <div className='flex flex-wrap items-center gap-2'>
          <Tabs value={endpoint} onValueChange={value => setEndpoint(value)}>
            <TabsList>
              {endPoints.map(endPoint => (
                <TabsTab key={endPoint.value} value={endPoint.value}>
                  {endPoint.label}
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
          <div className='flex flex-wrap items-center gap-4'>
            <Input
              placeholder='Search company name, ID, etc.'
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className='w-full sm:w-[400px]'
            />

            <Separator orientation='vertical' className='hidden sm:block data-[orientation=vertical]:h-7' />

            <div className='flex items-center gap-2'>
              <Label className='text-sm font-medium'>E-Smart Time Status</Label>
              <Select
                value={eSmartTimeStatus}
                onValueChange={value => {
                  setESmartTimeStatus(value as keyof typeof eSmartTimeStatusValues);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='E-Smart Time Status' />
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

          <div className='flex items-center'>
            <Button variant='outline' aria-label='Refresh companies' onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className={cn(isFetching && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='max-h-[calc(100vh-100px)] overflow-auto'>
        <Table>
          <TableHeader className='sticky top-0 bg-background z-10 shadow-sm'>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  <div className='flex items-center justify-center gap-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
                    Loading...
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
      </CardContent>

      <CardFooter>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => !isLoading && setPage(page - 1)}
                className={page <= 1 || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'}
              />
            </PaginationItem>

            {getPageWindow(page, companyWithESmartTimeData?.pageCount || 0).map(pageNumber => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={() => !isLoading && setPage(pageNumber)}
                  isActive={page === pageNumber}
                  className={isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => !isLoading && setPage(page + 1)}
                className={
                  page >= (companyWithESmartTimeData?.pageCount || 1) || isLoading
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer hover:bg-accent'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
};

export default ESmartTimeCompanyList;
