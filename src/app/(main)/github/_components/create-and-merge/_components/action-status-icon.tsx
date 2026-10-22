'use client';

import { Check, X, Loader2 } from 'lucide-react';
import type { ActionStatus } from '../_types';

export function ActionStatusIcon({ status }: { status: ActionStatus }) {
  switch (status) {
    case 'success':
      return <Check className='h-3.5 w-3.5 text-green-600' />;
    case 'failed':
    case 'skipped':
      return <X className='h-3.5 w-3.5 text-destructive' />;
    case 'in_progress':
      return <Loader2 className='h-3.5 w-3.5 animate-spin text-primary' />;
    default:
      return <div className='h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30' />;
  }
}
