'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WorkflowSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function WorkflowSection({ title, description, icon, children, className }: WorkflowSectionProps) {
  return (
    <section className={cn('space-y-5', className)}>
      <div className='flex items-start gap-3'>
        {icon ? (
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 shadow-sm'>
            {icon}
          </div>
        ) : null}
        <div className='min-w-0 space-y-1'>
          <h2 className='text-base font-semibold tracking-tight text-foreground'>{title}</h2>
          {description ? <p className='text-sm text-muted-foreground'>{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
