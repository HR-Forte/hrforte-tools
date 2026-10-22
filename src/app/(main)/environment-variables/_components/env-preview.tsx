'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import type { EnvironmentVariable } from '@/modules/environment-variable/environment-variable.type';
import { variablesToEnvFormat } from '../_lib/export-utils';
import { CopyButton } from './copy-button';

export function EnvPreview({
  variables,
  maskValues,
  revealedKeys,
}: {
  variables: EnvironmentVariable[];
  maskValues: boolean;
  revealedKeys: Set<string>;
}) {
  const [showPreview, setShowPreview] = useState(true);
  const previewText = variablesToEnvFormat(variables, { maskValues, revealedKeys });

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">Preview (.env format)</Label>
        <div className="flex items-center gap-1">
          <CopyButton text={previewText} label="Copy .env preview" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowPreview(p => !p)}
          >
            {showPreview ? <EyeOff className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
            {showPreview ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>
      {showPreview ? (
        <Textarea
          readOnly
          value={previewText}
          className="font-mono text-xs min-h-[100px] max-h-48 resize-y bg-muted/30 cursor-default"
          spellCheck={false}
        />
      ) : null}
    </div>
  );
}
