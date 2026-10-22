'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useCreateVariable,
  useUpdateVariable,
} from '@/modules/environment-variable/environment-variable.query';
import type { EnvironmentVariable } from '@/modules/environment-variable/environment-variable.type';
import { Eye, EyeOff, Loader2, Variable } from 'lucide-react';

interface CreateOrEditVariableModalProps {
  environmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: EnvironmentVariable | null;
  onSuccess?: () => void;
}

export function CreateOrEditVariableModal({
  environmentId,
  open,
  onOpenChange,
  existing,
  onSuccess,
}: CreateOrEditVariableModalProps) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [useTextarea, setUseTextarea] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const createVar = useCreateVariable(environmentId);
  const updateVar = useUpdateVariable(environmentId);
  const isEdit = !!existing;

  useEffect(() => {
    if (open) {
      setKey(existing?.key ?? '');
      setValue(existing?.value ?? '');
      setUseTextarea((existing?.value ?? '').length > 80 || (existing?.value ?? '').includes('\n'));
      setShowValue(false);
    }
  }, [open, existing]);

  const isPending = createVar.isPending || updateVar.isPending;

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        await updateVar.mutateAsync({ key: existing.key, value });
      } else {
        if (!key.trim()) return;
        await createVar.mutateAsync({ key: key.trim(), value });
      }
    } catch {
      return; // toasted by the mutation hooks
    }
    setKey('');
    setValue('');
    onOpenChange(false);
    onSuccess?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if ((isEdit || key.trim()) && !isPending) {
        handleSubmit();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5 text-muted-foreground" />
            {isEdit ? 'Update variable' : 'Add variable'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Change the value below. The key cannot be edited.'
              : 'Use UPPER_SNAKE_CASE for keys (e.g. API_SECRET_KEY). Keys are used in .env exports.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={e => {
            e.preventDefault();
            if ((isEdit || key.trim()) && !isPending) handleSubmit();
          }}
        >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="var-key">Key</Label>
              <Input
                id="var-key"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="API_SECRET_KEY"
                disabled={isEdit}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="var-value">Value</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setUseTextarea(t => !t)}
                >
                  {useTextarea ? 'Single line' : 'Multi-line'}
                </Button>
              </div>
              {useTextarea ? (
                <Textarea
                  id="var-value"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="Value (supports multiple lines)"
                  rows={4}
                  className="font-mono text-sm resize-y min-h-[100px]"
                />
              ) : (
                <div className="relative">
                  <Input
                    id="var-value"
                    type={showValue ? 'text' : 'password'}
                    autoComplete="off"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="value"
                    className="pr-9"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-1/2 h-full w-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowValue(s => !s)}
                    aria-label={showValue ? 'Hide value' : 'Show value'}
                    aria-pressed={showValue}
                  >
                    {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={(isEdit ? false : !key.trim()) || isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
        <p className="text-xs text-muted-foreground text-center -mt-2">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘</kbd> /{' '}
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd> +{' '}
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to submit
        </p>
      </DialogContent>
    </Dialog>
  );
}
