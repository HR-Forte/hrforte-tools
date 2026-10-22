'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBulkVariables } from '@/modules/environment-variable/environment-variable.query';
import type { EnvironmentVariable } from '@/modules/environment-variable/environment-variable.type';
import { Trash2, Loader2 } from 'lucide-react';

export function BulkDeleteModal({
  environmentId,
  variables,
  onSuccess,
}: {
  environmentId: string;
  variables: EnvironmentVariable[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const bulkMutate = useBulkVariables(environmentId);

  const filtered = useMemo(() => {
    if (!search.trim()) return variables;
    const q = search.trim().toLowerCase();
    return variables.filter(v => v.key.toLowerCase().includes(q));
  }, [variables, search]);

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const keys = new Set(filtered.map(v => v.key));
    if (filtered.length > 0 && filtered.every(v => selected.has(v.key))) {
      setSelected(prev => new Set([...prev].filter(k => !keys.has(k))));
    } else {
      setSelected(prev => new Set([...prev, ...keys]));
    }
  };

  // Selection never outlives the dialog: avoids deleting stale picks in another environment
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSelected(new Set());
      setSearch('');
    }
  };

  const handleDelete = async () => {
    const keys = variables.filter(v => selected.has(v.key)).map(v => v.key);
    if (keys.length === 0) return;
    await bulkMutate.mutateAsync({ delete: keys });
    handleOpenChange(false);
    onSuccess?.();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            disabled={variables.length === 0}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Batch delete
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {variables.length === 0 ? 'No variables to delete' : 'Select multiple variables to delete'}
        </TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Batch delete variables</DialogTitle>
            <DialogDescription>
              Select the variables you want to remove. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-auto py-2">
            {variables.length > 0 ? (
              <Input
                placeholder="Search by key..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-xs"
              />
            ) : null}
            <div className="flex items-center gap-2">
              <Checkbox
                id="bulk-delete-select-all"
                checked={filtered.length > 0 && filtered.every(v => selected.has(v.key))}
                onCheckedChange={selectAllFiltered}
              />
              <Label htmlFor="bulk-delete-select-all" className="text-sm font-normal cursor-pointer">
                {search.trim() ? `Select all ${filtered.length} shown` : 'Select all'}
              </Label>
            </div>
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border/60 p-2">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {search.trim() ? 'No keys match your search' : 'No variables'}
                </p>
              ) : (
                filtered.map(v => (
                  <label
                    key={v.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
                  >
                    <Checkbox checked={selected.has(v.key)} onCheckedChange={() => toggle(v.key)} />
                    <span className="font-mono text-sm">{v.key}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={selected.size === 0 || bulkMutate.isPending}
            >
              {bulkMutate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete {selected.size} variable{selected.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
