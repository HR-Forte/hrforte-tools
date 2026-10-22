'use client';

import { KeyboardEvent, MouseEvent, memo, useMemo, useState } from 'react';
import { Pencil, Trash2, Globe, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SafeNote } from '@/modules/note/note.type';
import Markdown from '@/components/safe-markdown';

export type ViewMode = 'grid' | 'list';

interface NoteCardProps {
  note: SafeNote;
  isOwner: boolean;
  isSharedTab?: boolean;
  viewMode?: ViewMode;
  onEdit: (note: SafeNote) => void;
  onDelete: (note: SafeNote) => void;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Card is clickable (open note); make it reachable and operable by keyboard too.
const cardA11y = (note: SafeNote, onOpen: (note: SafeNote) => void, isOwner: boolean) => ({
  role: 'button' as const,
  tabIndex: 0,
  'aria-label': `${isOwner ? 'Edit' : 'View'} note ${note.title}`,
  onClick: () => onOpen(note),
  onKeyDown: (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(note);
    }
  },
});

// Action buttons sit inside the clickable card: don't also trigger the card's open handler.
const stop = (fn: () => void) => (e: MouseEvent) => {
  e.stopPropagation();
  fn();
};

function NoteCardGrid({ note, isOwner, isSharedTab, onEdit, onDelete }: Omit<NoteCardProps, 'viewMode'>) {
  const [expanded] = useState(false);
  const isLongContent = useMemo(() => note.content.length > 260, [note.content.length]);

  return (
    <article
      className='group relative flex h-[20vh] min-h-48 flex-col rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-within:border-primary/40 focus-within:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer'
      {...cardA11y(note, onEdit, isOwner)}
    >
      <div className='flex items-start justify-between gap-2'>
        <h3 className='line-clamp-1 text-sm font-semibold text-foreground'>{note.title}</h3>
        <div className='shrink-0'>
          <Badge variant={note.isPublic ? 'secondary' : 'outline'} className='text-[10px] px-1.5 py-0'>
            {note.isPublic ? <Globe className='h-3 w-3 mr-0.5' /> : <Lock className='h-3 w-3 mr-0.5' />}
            {note.isPublic ? 'Public' : 'Private'}
          </Badge>
        </div>
      </div>

      <div
        className={`mt-2 flex-1 overflow-hidden text-xs leading-relaxed text-muted-foreground markdown-prose ${
          expanded ? 'max-h-48 overflow-y-auto pr-1' : 'max-h-24'
        }`}
      >
        <Markdown>{note.content}</Markdown>
      </div>
      {!expanded && isLongContent && (
        <div className='pointer-events-none -mt-8 h-8 bg-gradient-to-t from-card via-card/90 to-transparent' />
      )}
      {/* {isLongContent && (
        <button
          type='button'
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
          className='mt-2 w-fit text-xs font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:underline cursor-pointer'
        >
          {expanded ? 'View less' : 'View more'}
        </button>
      )} */}

      <div className='mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-3'>
        <div className='flex min-w-0 items-center gap-2 text-xs text-muted-foreground'>
          {isSharedTab && note.userName && (
            <span className='inline-flex max-w-32 items-center gap-1 truncate rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary'>
              <User className='h-3 w-3' />
              {note.userName}
            </span>
          )}
          {!isSharedTab && note.userName && (
            <span className='inline-flex min-w-0 items-center gap-1 truncate'>
              <User className='h-3 w-3' />
              {note.userName}
            </span>
          )}
          <span className='truncate'>{formatDate(note.updatedAt)}</span>
        </div>

        {isOwner && (
          <div className='flex items-center gap-1 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`Delete note ${note.title}`}
                  className='h-7 w-7 text-destructive hover:text-destructive cursor-pointer'
                  onClick={stop(() => onDelete(note))}
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </article>
  );
}

function NoteCardList({ note, isOwner, isSharedTab, onEdit, onDelete }: Omit<NoteCardProps, 'viewMode'>) {
  const [expanded, setExpanded] = useState(false);
  const isLongContent = useMemo(() => note.content.length > 180, [note.content.length]);

  return (
    <div
      className='group rounded-lg border border-border/60 bg-card/60 px-4 py-3 transition-all duration-200 hover:bg-accent/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer'
      {...cardA11y(note, onEdit, isOwner)}
    >
      <div className='flex items-start gap-4'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-semibold text-foreground truncate'>{note.title}</h3>
            <Badge variant={note.isPublic ? 'default' : 'outline'} className='text-[10px] px-1.5 py-0 shrink-0'>
              {note.isPublic ? <Globe className='h-3 w-3 mr-0.5' /> : <Lock className='h-3 w-3 mr-0.5' />}
              {note.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>

          <div
            className={`mt-1 h-20 overflow-hidden text-xs text-muted-foreground markdown-prose ${
              expanded ? 'h-auto max-h-[50vh] overflow-y-auto pr-1' : ''
            }`}
          >
            <Markdown>{note.content}</Markdown>
          </div>
          {isLongContent && (
            <button
              type='button'
              aria-expanded={expanded}
              onClick={e => {
                e.stopPropagation();
                setExpanded(prev => !prev);
              }}
              onKeyDown={e => e.stopPropagation()}
              className='mt-1 w-fit text-xs font-medium text-primary transition-colors hover:text-primary/80 cursor-pointer'
            >
              {expanded ? 'View less' : 'View more'}
            </button>
          )}

          <div className='mt-2 flex items-center gap-3 text-xs text-muted-foreground'>
            {isSharedTab && note.userName && (
              <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium'>
                <User className='h-3 w-3' />
                {note.userName}
              </span>
            )}
            {!isSharedTab && note.userName && (
              <span className='flex items-center gap-1'>
                <User className='h-3 w-3' />
                {note.userName}
              </span>
            )}
            <span>{formatDate(note.updatedAt)}</span>
          </div>
        </div>

        {isOwner && (
          <div className='flex items-center gap-1 shrink-0 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`Edit note ${note.title}`}
                  className='h-7 w-7 cursor-pointer'
                  onClick={stop(() => onEdit(note))}
                >
                  <Pencil className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`Delete note ${note.title}`}
                  className='h-7 w-7 text-destructive hover:text-destructive cursor-pointer'
                  onClick={stop(() => onDelete(note))}
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      {!expanded && isLongContent && (
        <div className='pointer-events-none -mt-8 h-8 bg-gradient-to-t from-card/90 to-transparent' />
      )}
    </div>
  );
}

// Memoized: markdown parsing per card is the expensive part of the notes page.
export const NoteCard = memo(function NoteCard({
  note,
  isOwner,
  isSharedTab = false,
  viewMode = 'grid',
  onEdit,
  onDelete,
}: NoteCardProps) {
  if (viewMode === 'list') {
    return <NoteCardList note={note} isOwner={isOwner} isSharedTab={isSharedTab} onEdit={onEdit} onDelete={onDelete} />;
  }
  return <NoteCardGrid note={note} isOwner={isOwner} isSharedTab={isSharedTab} onEdit={onEdit} onDelete={onDelete} />;
});
