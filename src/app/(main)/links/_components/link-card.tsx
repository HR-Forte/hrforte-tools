'use client';

import { useState, useCallback } from 'react';
import { ExternalLink, Pencil, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SafeLink } from '@/modules/link/link.type';
import { toast } from 'sonner';

interface LinkCardProps {
  link: SafeLink;
  isAdmin: boolean;
  onEdit: (link: SafeLink) => void;
  onDelete: (link: SafeLink) => void;
}

function formatUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    return url;
  }
}

export function LinkCard({ link, isAdmin, onEdit, onDelete }: LinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [link.url]);

  return (
    <div className='group flex items-start gap-3 rounded-lg border border-border/60 bg-card/60 px-4 py-3 transition-all duration-200 hover:bg-accent/50 hover:shadow-sm'>
      {link.favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={link.favicon} alt='' className='mt-0.5 h-5 w-5 shrink-0 rounded' />
      ) : (
        <div className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground'>
          <ExternalLink className='h-3 w-3' />
        </div>
      )}

      <div className='flex-1 min-w-0'>
        <a
          href={link.url}
          target='_blank'
          rel='noopener noreferrer'
          className='text-sm font-medium text-foreground hover:underline truncate block'
        >
          {link.title}
        </a>
        {link.description && (
          <p className='text-xs text-muted-foreground truncate mt-0.5'>{link.description}</p>
        )}
        <div className='mt-1 flex items-center gap-1.5'>
          <span className='truncate text-xs text-muted-foreground/70 font-mono'>
            {formatUrl(link.url)}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                onClick={handleCopy}
                className='inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground/60 transition-colors duration-200 hover:bg-muted hover:text-foreground'
                aria-label='Copy link URL'
              >
                {copied ? (
                  <Check className='h-3 w-3 text-green-600' />
                ) : (
                  <Copy className='h-3 w-3' />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side='top'>{copied ? 'Copied!' : 'Copy URL'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className='flex items-center gap-1 shrink-0 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='icon' className='h-7 w-7 cursor-pointer' asChild>
              <a href={link.url} target='_blank' rel='noopener noreferrer' aria-label={`Open ${link.title}`}>
                <ExternalLink className='h-3.5 w-3.5' />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open link</TooltipContent>
        </Tooltip>

        {isAdmin && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-7 w-7 cursor-pointer' onClick={() => onEdit(link)} aria-label={`Edit ${link.title}`}>
                  <Pencil className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-7 w-7 cursor-pointer text-destructive hover:text-destructive' onClick={() => onDelete(link)} aria-label={`Delete ${link.title}`}>
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
