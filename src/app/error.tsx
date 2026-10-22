'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Route-level error boundary: a crash in one page shouldn't blank the whole app.
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center' role='alert'>
      <AlertTriangle className='h-10 w-10 text-destructive' aria-hidden />
      <h1 className='text-xl font-semibold'>Something went wrong</h1>
      <p className='max-w-md text-sm text-muted-foreground'>
        An unexpected error occurred while rendering this page. You can try again or go back to the dashboard.
      </p>
      <div className='flex gap-2'>
        <Button onClick={reset}>Try again</Button>
        <Button variant='outline' asChild>
          <Link href='/dashboard'>Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
