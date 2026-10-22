'use client';

import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface BranchInputPairProps {
  base: string;
  head: string;
  onBaseChange: (value: string) => void;
  onHeadChange: (value: string) => void;
  basePlaceholder?: string;
  headPlaceholder?: string;
}

export function BranchInputPair({
  base,
  head,
  onBaseChange,
  onHeadChange,
  basePlaceholder = 'deployment/mia',
  headPlaceholder = 'develop',
}: BranchInputPairProps) {
  const baseId = useId();
  const headId = useId();
  return (
    <div className='rounded-xl border border-border/50 bg-muted/20 p-4'>
      <div className='grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end'>
        <div className='space-y-2'>
          <label htmlFor={baseId} className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
            Base branch
          </label>
          <Input
            id={baseId}
            value={base}
            onChange={e => onBaseChange(e.target.value)}
            className='h-10 border-border/80 bg-background/80 font-mono text-sm'
            placeholder={basePlaceholder}
          />
        </div>

        <div className='hidden sm:flex h-10 items-center justify-center'>
          <div className='flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm'>
            <ArrowLeft className='h-3.5 w-3.5 text-primary' aria-hidden />
          </div>
        </div>

        <div className='space-y-2'>
          <label htmlFor={headId} className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
            Head branch
          </label>
          <Input
            id={headId}
            value={head}
            onChange={e => onHeadChange(e.target.value)}
            className='h-10 border-border/80 bg-background/80 font-mono text-sm'
            placeholder={headPlaceholder}
          />
        </div>
      </div>

      <p className='mt-3 flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden'>
        <ArrowRight className='h-3 w-3 shrink-0 text-primary' aria-hidden />
        <span>
          Merging <span className='font-mono font-medium text-foreground'>{head || headPlaceholder}</span> into{' '}
          <span className='font-mono font-medium text-foreground'>{base || basePlaceholder}</span>
        </span>
      </p>
    </div>
  );
}
