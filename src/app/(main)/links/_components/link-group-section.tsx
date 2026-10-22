'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SafeLink, SafeLinkGroup } from '@/modules/link/link.type';
import { LinkCard } from './link-card';

interface LinkGroupSectionProps {
  group: SafeLinkGroup;
  isAdmin: boolean;
  onEditLink: (link: SafeLink) => void;
  onDeleteLink: (link: SafeLink) => void;
  onEditGroup: (group: SafeLinkGroup) => void;
  onDeleteGroup: (group: SafeLinkGroup) => void;
}

export function LinkGroupSection({ group, isAdmin, onEditLink, onDeleteLink, onEditGroup, onDeleteGroup }: LinkGroupSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className='rounded-xl border border-border/60 bg-card/40'>
      <div className='flex items-center justify-between rounded-t-xl pr-4 transition-colors hover:bg-accent/30'>
        <button
          type='button'
          aria-expanded={expanded}
          className='flex flex-1 items-center gap-2 px-4 py-3 text-left'
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? <ChevronDown className='h-4 w-4 text-muted-foreground' /> : <ChevronRight className='h-4 w-4 text-muted-foreground' />}
          <span className='text-sm font-semibold'>{group.name}</span>
          <span className='text-xs text-muted-foreground'>({group.links.length})</span>
        </button>

        {isAdmin && (
          <div className='flex items-center gap-1'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => onEditGroup(group)} aria-label={`Edit group ${group.name}`}>
                  <Pencil className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit group</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 text-destructive hover:text-destructive'
                  onClick={() => onDeleteGroup(group)}
                  aria-label={`Delete group ${group.name}`}
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete group</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {group.description && <p className='px-4 pb-2 text-xs text-muted-foreground'>{group.description}</p>}

      {expanded && (
        <div className='px-4 pb-3 space-y-2'>
          {group.links.length === 0 ? (
            <p className='py-4 text-center text-xs text-muted-foreground'>No links in this group yet</p>
          ) : (
            group.links.map(link => (
              <LinkCard key={link.id} link={link} isAdmin={isAdmin} onEdit={onEditLink} onDelete={onDeleteLink} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
