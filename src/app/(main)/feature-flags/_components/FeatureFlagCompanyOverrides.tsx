'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EndpointName } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import {
  useDefaultFeatureFlags,
  useDeleteCompanyFeatureFlag,
  useGetFeatureFlagCompanyOverrides,
  useUpdateCompanyFeatureFlag,
} from '@/modules/feature-flag/feature-flag.query';
import {
  FeatureFlagCompanyOverridesType,
  FeatureFlagHeaderMap,
  FeatureFlagName,
  FeatureFlagNameEnum,
} from '@/modules/feature-flag/feature-flag.type';
import { CellContext, ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Building2, CheckCheck, CopyX, Info, RefreshCcw, Search, Trash2, X } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import CreateFeatureFlagModal from './CreateFeatureFlagModal';
import { QueryError } from '@/components/query-error';
import { getPageWindow } from '@/lib/utils/getPageWindow';

type FeatureFlagCompanyOverridesProps = {
  endpoint: EndpointName;
};

const FeatureFlagCompanyOverrides = ({ endpoint }: FeatureFlagCompanyOverridesProps) => {
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  // Every override edit changes live feature flags for a company, so confirm first
  const [pendingChange, setPendingChange] = useState<{
    title: string;
    description: ReactNode;
    confirmLabel: string;
    destructive?: boolean;
    run: () => Promise<unknown>;
  } | null>(null);

  const {
    data: featureFlagCompanyOverridesData,
    isPending: isPendingFeatureFlagCompanyOverrides,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetFeatureFlagCompanyOverrides(
    {
      page,
      take: 20,
      q: query,
      sort: 'id',
      order: 'ASC',
    },
    endpoint
  );

  // Get Default Feature Flags
  const { data: defaultFeatureFlags, isPending: isPendingDefaultFeatureFlags } = useDefaultFeatureFlags(endpoint);

  const { mutateAsync: updateCompanyFeatureFlag, isPending: isPendingUpdateCompanyFeatureFlag } =
    useUpdateCompanyFeatureFlag(endpoint);

  const { mutateAsync: deleteCompanyFeatureFlag, isPending: isPendingDeleteCompanyFeatureFlag } =
    useDeleteCompanyFeatureFlag(endpoint);

  const isPending =
    isPendingDefaultFeatureFlags || isPendingUpdateCompanyFeatureFlag || isPendingDeleteCompanyFeatureFlag;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(inputValue);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => setPage(1), [endpoint]);

  const featureFlagCompanyOverrides = featureFlagCompanyOverridesData?.data;
  const envLabel = endpoint.replace('_', ' ');

  const updateCompanyFeatureFlagValue = async (
    companyId: number,
    featureFlag: FeatureFlagName | 'ALL',
    value: boolean
  ) => {
    const flags =
      featureFlag === 'ALL'
        ? Object.fromEntries(Object.values(FeatureFlagNameEnum).map(featureFlag => [featureFlag, value]))
        : { [featureFlag]: value };

    return updateCompanyFeatureFlag({ companyId, body: { flags } });
  };

  const columns: ColumnDef<FeatureFlagCompanyOverridesType>[] = [
    {
      id: 'company',
      header: 'Company',
      accessorKey: 'company.name',
      cell: ({ row }) => (
        <div className='w-[220px]'>
          <p className='text-sm font-medium truncate' title={row.original?.company?.name}>
            {row.original?.company?.name || '-'}
          </p>
          <p className='text-xs text-muted-foreground'>ID {row.original?.companyId}</p>
        </div>
      ),
    },
    ...(Object.values(FeatureFlagNameEnum).map(featureFlag => ({
      id: featureFlag,
      header: (
        <div className='py-1 whitespace-nowrap'>
          <p className='font-semibold text-foreground'>{FeatureFlagHeaderMap[featureFlag]}</p>
          <p className='text-xs font-normal text-muted-foreground'>
            Default:{' '}
            <span
              className={cn(
                'font-medium',
                defaultFeatureFlags?.[featureFlag] ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              )}
            >
              {defaultFeatureFlags ? (defaultFeatureFlags[featureFlag] ? 'ON' : 'OFF') : '…'}
            </span>
          </p>
        </div>
      ),
      accessorKey: `flags.${featureFlag}`,
      cell: ({ row }: CellContext<FeatureFlagCompanyOverridesType, boolean>) => {
        const featureFlagValue = row.original?.flags?.[featureFlag];
        const isOverridden = typeof featureFlagValue === 'boolean';

        return (
          <div
            className={cn('flex items-center gap-1', !isOverridden && 'opacity-60')}
            title={isOverridden ? undefined : 'Not overridden: uses the default value'}
          >
            <Switch
              id={`${featureFlag}-${row.original?.companyId}`}
              aria-label={`${FeatureFlagHeaderMap[featureFlag]} for ${row.original?.company?.name || 'company'}`}
              checked={featureFlagValue ?? false}
              disabled={isPending}
              onClick={event => {
                event.preventDefault();
                setPendingChange({
                  title: `Turn ${featureFlagValue ? 'OFF' : 'ON'} ${FeatureFlagHeaderMap[featureFlag]}?`,
                  description: (
                    <>
                      This changes <b>{FeatureFlagHeaderMap[featureFlag]}</b> for{' '}
                      <b>{row.original?.company?.name || '-'}</b> on <b>{envLabel}</b> immediately.
                    </>
                  ),
                  confirmLabel: featureFlagValue ? 'Turn OFF' : 'Turn ON',
                  destructive: !!featureFlagValue,
                  run: () => updateCompanyFeatureFlagValue(row.original?.company?.id, featureFlag, !featureFlagValue),
                });
              }}
            />
            {isOverridden && (
              <Tooltip>
                <TooltipTrigger aria-label='Overrides default value' className='p-1'>
                  <span className='block size-2 rounded-full bg-amber-500' />
                </TooltipTrigger>
                <TooltipContent>Overrides the default value</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    })) as unknown as ColumnDef<FeatureFlagCompanyOverridesType>[]),
    {
      id: 'actions',
      header: () => <span className='sr-only'>Actions</span>,
      cell: ({ row }) => {
        return (
          <div className='flex items-center justify-end gap-1'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='Turn ON all feature flags'
                  onClick={event => {
                    event.preventDefault();
                    setPendingChange({
                      title: 'Turn ON all feature flags?',
                      description: (
                        <>
                          Every feature flag will be turned ON for <b>{row.original?.company?.name || '-'}</b> on{' '}
                          <b>{envLabel}</b>.
                        </>
                      ),
                      confirmLabel: 'Turn ON all',
                      run: () => updateCompanyFeatureFlagValue(row.original?.company?.id, 'ALL', true),
                    });
                  }}
                  disabled={isPending}
                >
                  <CheckCheck className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Turn ON all Feature Flags</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='Turn OFF all feature flags'
                  onClick={event => {
                    event.preventDefault();
                    setPendingChange({
                      title: 'Turn OFF all feature flags?',
                      description: (
                        <>
                          Every feature flag will be turned OFF for <b>{row.original?.company?.name || '-'}</b> on{' '}
                          <b>{envLabel}</b>.
                        </>
                      ),
                      confirmLabel: 'Turn OFF all',
                      destructive: true,
                      run: () => updateCompanyFeatureFlagValue(row.original?.company?.id, 'ALL', false),
                    });
                  }}
                  disabled={isPending}
                >
                  <CopyX className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Turn OFF all Feature Flags</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-destructive hover:text-destructive hover:bg-destructive/10'
                  aria-label='Remove feature flag overrides'
                  disabled={isPending}
                  onClick={() =>
                    setPendingChange({
                      title: 'Remove Feature Flag overrides',
                      description: (
                        <>
                          Are you sure you want to remove Feature Flag overrides for{' '}
                          <b>{row.original?.company?.name || '-'}</b> company? It will fall back to the defaults.
                        </>
                      ),
                      confirmLabel: 'Remove',
                      destructive: true,
                      run: () => deleteCompanyFeatureFlag(row.original?.company?.id),
                    })
                  }
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Remove Feature Flag overrides for {row.original?.company?.name || '-'} company
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: featureFlagCompanyOverrides || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const pageCount = featureFlagCompanyOverridesData?.pageCount || 0;
  const itemCount = featureFlagCompanyOverridesData?.itemCount;
  // Company column stays visible on horizontal scroll; actions stay pinned to the right
  const stickyClass = (columnId: string) =>
    cn(
      columnId === 'company' && 'sticky left-0 z-[1] bg-background group-hover:bg-muted shadow-[1px_0_0_var(--border)]',
      columnId === 'actions' &&
        'sticky right-0 z-[1] bg-background group-hover:bg-muted shadow-[-1px_0_0_var(--border)]'
    );

  return (
    <div className='flex flex-col gap-4'>
      <Alert>
        <Info className='h-4 w-4' />
        <AlertDescription>
          <span>
            <strong>Priority:</strong> Company Override → Default Setting → Feature Enabled.{' '}
            <span className='inline-flex items-center gap-1'>
              <span className='inline-block size-2 rounded-full bg-amber-500' aria-hidden /> marks an overridden value;
            </span>{' '}
            faded switches inherit the default.
          </span>
        </AlertDescription>
      </Alert>

      <div className='w-full flex flex-wrap items-center justify-between gap-2'>
        <div className='relative w-full sm:w-[400px]'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' aria-hidden />
          <Input
            placeholder='Search company name, ID, etc.'
            aria-label='Search companies'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className='pl-9 pr-9'
          />
          {inputValue && (
            <button
              type='button'
              aria-label='Clear search'
              onClick={() => setInputValue('')}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            aria-label='Refresh company overrides'
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
          <CreateFeatureFlagModal endpoint={endpoint} />
        </div>
      </div>

      <div className='rounded-lg border overflow-auto max-h-[calc(100vh-510px)] [&_[data-slot=table-container]]:overflow-visible'>
        <Table>
          <TableHeader className='sticky top-0 bg-background z-10 shadow-[0_1px_0_var(--border)]'>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className={cn('h-auto', stickyClass(header.column.id))}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPendingFeatureFlagCompanyOverrides ? (
              Array.from({ length: 6 }, (_, index) => (
                <TableRow key={index} className='hover:bg-transparent'>
                  <TableCell colSpan={columns.length}>
                    <div className='h-9 rounded-md bg-muted/60 animate-pulse' />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={columns.length} className='p-4'>
                  <QueryError error={error} onRetry={refetch} title="Couldn't load company overrides" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className='group hover:bg-muted'>
                  {row.getVisibleCells().map(cell => (
                    <TableCell className={cn('align-middle', stickyClass(cell.column.id))} key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className='hover:bg-transparent'>
                <TableCell colSpan={columns.length} className='h-40'>
                  <div className='flex flex-col items-center justify-center gap-2 text-center'>
                    <Building2 className='h-8 w-8 text-muted-foreground/60' aria-hidden />
                    <p className='font-medium'>
                      {query ? `No companies match "${query}"` : 'No company overrides yet'}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {query
                        ? 'Try a different name or ID.'
                        : 'Use "Create Company Feature Flag" to override defaults for a company.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm text-muted-foreground whitespace-nowrap'>
          {typeof itemCount === 'number' &&
            `${itemCount} ${itemCount === 1 ? 'company' : 'companies'}${pageCount > 1 ? ` · Page ${page} of ${pageCount}` : ''}`}
        </p>

        {pageCount > 1 && (
          <Pagination className='mx-0 w-auto'>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => !isPendingFeatureFlagCompanyOverrides && setPage(page - 1)}
                  className={
                    page <= 1 || isPendingFeatureFlagCompanyOverrides
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer hover:bg-accent'
                  }
                />
              </PaginationItem>

              {getPageWindow(page, pageCount).map(pageNumber => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => !isPendingFeatureFlagCompanyOverrides && setPage(pageNumber)}
                    isActive={page === pageNumber}
                    className={
                      isPendingFeatureFlagCompanyOverrides
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer hover:bg-accent'
                    }
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => !isPendingFeatureFlagCompanyOverrides && setPage(page + 1)}
                  className={
                    page >= (pageCount || 1) || isPendingFeatureFlagCompanyOverrides
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer hover:bg-accent'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingChange}
        onOpenChange={open => !open && setPendingChange(null)}
        title={pendingChange?.title}
        description={pendingChange?.description}
        confirmLabel={pendingChange?.confirmLabel}
        variant={pendingChange?.destructive ? 'destructive' : 'default'}
        onConfirm={() => pendingChange?.run()}
      />
    </div>
  );
};

export default FeatureFlagCompanyOverrides;
