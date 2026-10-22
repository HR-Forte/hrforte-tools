'use client';

import { useState, useRef } from 'react';
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
import { useBulkVariables } from '@/modules/environment-variable/environment-variable.query';
import { FileUp, Plus, Trash2, Loader2 } from 'lucide-react';
import { parseEnvToItems, parseJsonToItems } from '../_lib/parsers';

export function BulkUpsertModal({
  environmentId,
  onSuccess,
}: {
  environmentId: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkMutate = useBulkVariables(environmentId);

  const addRow = () => setRows(r => [...r, { key: '', value: '' }]);
  const addFiveRows = () => setRows(r => [...r, ...Array(5).fill({ key: '', value: '' })]);

  const updateRow = (i: number, field: 'key' | 'value', val: string) => {
    setRows(r => {
      const n = [...r];
      n[i] = { ...n[i], [field]: val };
      return n;
    });
  };

  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setParseError(null);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const isEnv = /\.env($|\.)/i.test(file.name) || (!file.name.endsWith('.json') && /^[^[{]*\w+\s*=/m.test(content));
        const items = isEnv ? parseEnvToItems(content) : parseJsonToItems(JSON.parse(content) as unknown);
        if (items.length === 0) {
          setParseError(
            isEnv
              ? 'No valid KEY=value pairs found. Supported: KEY=value, KEY="value", KEY=\'value\', # comments.'
              : 'No valid key/value pairs found. Use { "KEY": "value" } or { "items": [{ "key": "X", "value": "Y" }] }.'
          );
          return;
        }
        setRows(items);
      } catch {
        setParseError('Invalid file. Use JSON ({ "KEY": "value" }) or .env (KEY=value) format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    const upsert = rows.filter(r => r.key.trim()).map(r => ({ key: r.key.trim(), value: r.value }));
    if (upsert.length === 0) return;
    await bulkMutate.mutateAsync({ upsert });
    setOpen(false);
    setRows([{ key: '', value: '' }]);
    setParseError(null);
    onSuccess?.();
  };

  const validCount = rows.filter(r => r.key.trim()).length;

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FileUp className="mr-1.5 h-4 w-4" />
        Batch add/update
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Batch add/update variables</DialogTitle>
            <DialogDescription>
              Import from JSON or .env file, or add rows manually. Existing keys are updated; new keys are created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-auto min-h-0">
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
              <Label className="text-xs font-medium text-muted-foreground">Import from file</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.env,application/json,text/plain"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:hover:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground">
                JSON: <code className="rounded bg-muted px-1">&#123; &quot;KEY&quot;: &quot;value&quot; &#125;</code> or .env: <code className="rounded bg-muted px-1">KEY=value</code>
              </p>
              {parseError ? <p className="text-sm text-destructive">{parseError}</p> : null}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Key / Value rows</Label>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={addRow}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add row
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={addFiveRows}>
                    +5
                  </Button>
                </div>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-border/60 p-2">
                {rows.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="KEY"
                      value={row.key}
                      onChange={e => updateRow(i, 'key', e.target.value)}
                      className="font-mono text-sm"
                    />
                    <Input
                      placeholder="value"
                      value={row.value}
                      onChange={e => updateRow(i, 'value', e.target.value)}
                      className="text-sm"
                    />
                    <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={() => removeRow(i)} aria-label="Remove row">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={validCount === 0 || bulkMutate.isPending}>
              {bulkMutate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply {validCount} variable{validCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
