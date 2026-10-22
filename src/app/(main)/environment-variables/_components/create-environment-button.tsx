'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateEnvironment } from '@/modules/environment-variable/environment-variable.query';
import { Plus, Loader2 } from 'lucide-react';
import { slugFromName } from '../_lib/export-utils';

export function CreateEnvironmentButton({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const createEnv = useCreateEnvironment();

  const suggestedSlug = slugFromName(name);
  const showSlugHint = name.trim() && (!slug.trim() || slug === suggestedSlug);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      await createEnv.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      });
    } catch {
      return; // toasted by useCreateEnvironment
    }
    setOpen(false);
    setName('');
    setSlug('');
    setDescription('');
    onSuccess?.();
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add environment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create environment</DialogTitle>
            <DialogDescription>
              Environments group variables (e.g. Staging, Production). Slug is used in export filenames.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={e => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="env-name">Name</Label>
                <Input
                  id="env-name"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!slug.trim()) setSlug(slugFromName(e.target.value));
                  }}
                  placeholder="e.g. Staging"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="env-slug">Slug (optional)</Label>
                <Input
                  id="env-slug"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="e.g. staging"
                  className="font-mono"
                />
                {showSlugHint ? (
                  <p className="text-xs text-muted-foreground">
                    Export files will be named like <code className="rounded bg-muted px-1">{suggestedSlug || 'slug'}.env</code>
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="env-desc">Description (optional)</Label>
                <Input
                  id="env-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createEnv.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || createEnv.isPending}>
                {createEnv.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
