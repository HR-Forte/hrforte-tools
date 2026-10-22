'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WorkflowStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  accent?: 'green' | 'blue' | 'purple';
}

const accentStyles = {
  green: 'from-green-500/10 to-transparent text-green-600 dark:text-green-400',
  blue: 'from-primary/10 to-transparent text-primary',
  purple: 'from-purple-500/10 to-transparent text-purple-600 dark:text-purple-400',
};

export function WorkflowStatCard({ label, value, hint, icon, accent = 'blue' }: WorkflowStatCardProps) {
  return (
    <div className='relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm transition-colors duration-200 hover:border-border hover:bg-card/80'>
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', accentStyles[accent])} />
      <div className='relative flex items-center gap-3'>
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-sm'>
          {icon}
        </div>
        <div className='min-w-0'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>{label}</p>
          <p className='text-xl font-semibold tabular-nums text-foreground'>{value}</p>
          {hint ? <p className='truncate text-xs text-muted-foreground'>{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
