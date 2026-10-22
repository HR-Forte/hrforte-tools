'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteVariable } from '@/modules/environment-variable/environment-variable.query';
import { Trash2, Loader2 } from 'lucide-react';

export function DeleteVariableButton({
  environmentId,
  keyName,
  onSuccess,
}: {
  environmentId: string;
  keyName: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const deleteVar = useDeleteVariable(environmentId);

  const handleDelete = async () => {
    try {
      await deleteVar.mutateAsync(keyName);
    } catch {
      return; // toasted by useDeleteVariable
    }
    setOpen(false);
    onSuccess?.();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setOpen(true)}
            aria-label={`Delete ${keyName}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete variable</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <code className="rounded bg-muted px-1 font-mono text-xs">{keyName}</code>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteVar.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteVar.isPending}>
              {deleteVar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
