'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, Edit3 } from 'lucide-react';
import { SafeNote } from '@/modules/note/note.type';
import Markdown from '@/components/safe-markdown';

interface CreateOrEditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: SafeNote | null;
  /** View a note you don't own: preview only, no editing. */
  readOnly?: boolean;
  onSubmit: (data: { title: string; content: string; isPublic: boolean }) => Promise<void>;
}

export function CreateOrEditNoteModal({
  open,
  onOpenChange,
  existing,
  readOnly = false,
  onSubmit,
}: CreateOrEditNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(existing?.title ?? '');
      setContent(existing?.content ?? '');
      setIsPublic(existing?.isPublic ?? false);
    }
  }, [open, existing]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), isPublic });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!existing;
  const isDirty =
    !readOnly &&
    (title !== (existing?.title ?? '') ||
      content !== (existing?.content ?? '') ||
      isPublic !== (existing?.isPublic ?? false));
  // Don't throw away unsaved edits on an accidental outside click / Esc; Cancel still discards.
  const guardClose = (e: Event) => {
    if (isDirty) e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='sm:max-w-6xl max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0'
        onInteractOutside={guardClose}
        onEscapeKeyDown={guardClose}
      >
        <DialogHeader className='shrink-0 border-b border-border/60 px-6 py-4'>
          <DialogTitle>{readOnly ? existing?.title : isEdit ? 'Edit Note' : 'Create Note'}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? `Shared by ${existing?.userName || 'a team member'}`
              : isEdit
                ? 'Update your note with markdown support.'
                : 'Write a new note with markdown support.'}
          </DialogDescription>
        </DialogHeader>

        {readOnly ? (
          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <div className='markdown-prose text-sm'>
              <Markdown>{existing?.content ?? ''}</Markdown>
            </div>
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <div className='grid h-full grid-rows-[auto_1fr_auto] gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='note-title'>Title</Label>
                <Input
                  id='note-title'
                  placeholder='Note title...'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className='grid min-h-0 gap-2'>
                <Label htmlFor='note-content'>Content (Markdown)</Label>
                <div className='grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2'>
                  <div className='flex min-h-0 flex-col gap-2'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Edit3 className='h-3.5 w-3.5' />
                      <span>Editor</span>
                    </div>
                    <Textarea
                      id='note-content'
                      placeholder=''
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className='min-h-0 h-[35vh] lg:h-[50vh] resize-none font-mono text-sm'
                    />
                  </div>

                  <div className='flex min-h-0 flex-col gap-2'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Eye className='h-3.5 w-3.5' />
                      <span>Preview</span>
                    </div>
                    <div className='min-h-0 h-[35vh] lg:h-[50vh] rounded-md border border-border/60 bg-muted/30 p-4 overflow-y-auto'>
                      {content ? (
                        <div className='markdown-prose text-sm'>
                          <Markdown>{content}</Markdown>
                        </div>
                      ) : (
                        <p className='text-muted-foreground text-sm'>Preview will appear here...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between rounded-lg border border-border/60 px-4 py-3'>
                <div>
                  <Label htmlFor='note-public' className='text-sm font-medium'>
                    Public
                  </Label>
                  <p className='text-xs text-muted-foreground'>Share this note with all team members</p>
                </div>
                <Switch id='note-public' checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className='shrink-0 border-t border-border/60 bg-background px-6 py-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button onClick={handleSubmit} disabled={loading || !title.trim() || !content.trim()}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isEdit ? 'Save' : 'Create'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
