'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type QueryErrorProps = {
  error?: unknown;
  onRetry?: () => unknown;
  title?: string;
  className?: string;
};

const getMessage = (error: unknown) => {
  const err = error as { response?: { data?: { message?: string } }; message?: string } | undefined;
  return err?.response?.data?.message || err?.message || 'Something went wrong while loading data.';
};

// Shown instead of an empty state when a query fails, so "failed" never looks like "no data".
export function QueryError({ error, onRetry, title = "Couldn't load data", className }: QueryErrorProps) {
  return (
    <div
      role='alert'
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center',
        className
      )}
    >
      <AlertTriangle className='h-6 w-6 text-destructive' aria-hidden />
      <div className='space-y-1'>
        <p className='font-medium'>{title}</p>
        <p className='text-sm text-muted-foreground'>{getMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant='outline' size='sm' onClick={() => onRetry()}>
          <RefreshCcw className='mr-2 h-4 w-4' />
          Try again
        </Button>
      )}
    </div>
  );
}
