'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableCell, TableRow } from '@/components/ui/table';
import { Pencil, Eye, EyeOff, Variable } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { EnvironmentVariable } from '@/modules/environment-variable/environment-variable.type';
import { CopyButton } from './copy-button';
import { DeleteVariableButton } from './delete-variable-button';

interface VariableRowProps {
  variable: EnvironmentVariable;
  environmentId: string;
  maskValues: boolean;
  isRevealed: boolean;
  onEdit: (variable: EnvironmentVariable) => void;
  onToggleReveal: (key: string) => void;
  onRefetch: () => void;
}

export const VariableRow = memo(function VariableRow({
  variable: v,
  environmentId,
  maskValues,
  isRevealed,
  onEdit,
  onToggleReveal,
  onRefetch,
}: VariableRowProps) {
  const displayValue = isRevealed ? (v.value || '(empty)') : '••••••••••••';

  return (
    <TableRow className="group transition-colors hover:bg-muted/40 border-b border-border/40 last:border-0">
      <TableCell className="font-mono text-sm py-3">
        <span className="flex items-center gap-1.5">
          <Variable className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {v.key}
        </span>
      </TableCell>
      <TableCell className="py-3 align-middle">
        <div className="flex max-w-md items-center gap-1.5">
          <span
            className={`truncate font-mono text-sm ${isRevealed ? 'text-muted-foreground' : 'text-muted-foreground/80 select-none'}`}
            title={isRevealed ? (v.value || '(empty)') : 'Click eye to reveal'}
          >
            {displayValue}
          </span>
          {maskValues ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => onToggleReveal(v.key)}
                  aria-label={isRevealed ? `Hide ${v.key}` : `Reveal ${v.key}`}
                >
                  {isRevealed ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isRevealed ? 'Hide value' : 'Reveal value'}</TooltipContent>
            </Tooltip>
          ) : null}
          <CopyButton text={v.value ?? ''} label={`Copy value of ${v.key}`} />
        </div>
      </TableCell>
      <TableCell className="py-3 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(v.updatedAt), { addSuffix: true })}
      </TableCell>
      <TableCell className="py-3 text-right">
        <div className="flex justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onEdit(v)}
                aria-label={`Edit ${v.key}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <DeleteVariableButton environmentId={environmentId} keyName={v.key} onSuccess={onRefetch} />
        </div>
      </TableCell>
    </TableRow>
  );
});
