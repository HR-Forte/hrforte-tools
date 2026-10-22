'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import type { EnvironmentVariable } from '@/modules/environment-variable/environment-variable.type';
import { VariableRow } from './variable-row';

interface VariablesTableProps {
  variables: EnvironmentVariable[];
  environmentId: string;
  maskValues: boolean;
  revealedKeys: Set<string>;
  search: string;
  onClearSearch: () => void;
  onEdit: (variable: EnvironmentVariable) => void;
  onToggleReveal: (key: string) => void;
  onRefetch: () => void;
}

export function VariablesTable({
  variables,
  environmentId,
  maskValues,
  revealedKeys,
  search,
  onClearSearch,
  onEdit,
  onToggleReveal,
  onRefetch,
}: VariablesTableProps) {
  const handleEdit = useCallback(
    (v: EnvironmentVariable) => onEdit(v),
    [onEdit]
  );

  const handleToggleReveal = useCallback(
    (key: string) => onToggleReveal(key),
    [onToggleReveal]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="w-[min(200px,30%)] font-medium">Key</TableHead>
              <TableHead className="min-w-[220px] font-medium">Value</TableHead>
              <TableHead className="w-[120px] text-muted-foreground font-medium">Updated</TableHead>
              <TableHead className="w-[140px] text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      No variables match &quot;{search}&quot;
                    </p>
                    <Button variant="outline" size="sm" onClick={onClearSearch}>
                      Clear search
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              variables.map(v => (
                <VariableRow
                  key={v.id}
                  variable={v}
                  environmentId={environmentId}
                  maskValues={maskValues}
                  isRevealed={!maskValues || revealedKeys.has(v.key)}
                  onEdit={handleEdit}
                  onToggleReveal={handleToggleReveal}
                  onRefetch={onRefetch}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
