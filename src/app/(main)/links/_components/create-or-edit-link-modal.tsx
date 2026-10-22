'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { SafeLink, SafeLinkGroup } from '@/modules/link/link.type';

interface CreateOrEditLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: SafeLink | null;
  groups: SafeLinkGroup[];
  onSubmit: (data: { title: string; url: string; description?: string; groupId?: string | null }) => Promise<void>;
}

const NO_GROUP = '__none__';

export function CreateOrEditLinkModal({ open, onOpenChange, existing, groups, onSubmit }: CreateOrEditLinkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<string>(NO_GROUP);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(existing?.title ?? '');
      setUrl(existing?.url ?? '');
      setDescription(existing?.description ?? '');
      setGroupId(existing?.groupId ?? NO_GROUP);
    }
  }, [open, existing]);

  const handleSubmit = async () => {
    if (!title.trim() || !url.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        groupId: groupId === NO_GROUP ? null : groupId,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!existing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Link' : 'Add Link'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update this link.' : 'Add a new useful link for the team.'}</DialogDescription>
        </DialogHeader>

        <form
          className='grid gap-4'
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='link-title'>Title</Label>
              <Input id='link-title' placeholder='e.g. Jira Board' value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='link-url'>URL</Label>
              <Input id='link-url' type='url' placeholder='https://...' value={url} onChange={e => setUrl(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='link-desc'>Description (optional)</Label>
              <Textarea id='link-desc' placeholder='Short description...' rows={2} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='link-group'>Group (optional)</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id='link-group'>
                  <SelectValue placeholder='No group' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GROUP}>No group</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading || !title.trim() || !url.trim()}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
