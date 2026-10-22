'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { SafeLinkGroup } from '@/modules/link/link.type';

interface CreateOrEditGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: SafeLinkGroup | null;
  onSubmit: (data: { name: string; description?: string }) => Promise<void>;
}

export function CreateOrEditGroupModal({ open, onOpenChange, existing, onSubmit }: CreateOrEditGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(existing?.name ?? '');
      setDescription(existing?.description ?? '');
    }
  }, [open, existing]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined });
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
          <DialogTitle>{isEdit ? 'Edit Group' : 'Create Group'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update group details.' : 'Create a new group to organize links.'}</DialogDescription>
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
              <Label htmlFor='group-name'>Name</Label>
              <Input id='group-name' placeholder='e.g. Development Tools' value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='group-desc'>Description (optional)</Label>
              <Textarea id='group-desc' placeholder='What this group is about...' rows={2} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading || !name.trim()}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
