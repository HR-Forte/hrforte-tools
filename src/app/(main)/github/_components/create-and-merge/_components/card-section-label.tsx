'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardSectionLabelProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function CardSectionLabel({ children, className, action }: CardSectionLabelProps) {
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
        {children}
      </div>
      {action}
    </div>
  );
}
