'use client';

import { useState, useMemo, useCallback, useDeferredValue } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Variable,
  Plus,
  FileDown,
  RefreshCcw,
  Search,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { EnvironmentVariable } from '@/modules/environment-variable/environment-variable.type';
import { exportAsEnv, exportAsJson } from '../_lib/export-utils';
import { VariablesTable } from './variables-table';
import { EnvPreview } from './env-preview';
import { CreateOrEditVariableModal } from './create-or-edit-variable-modal';
import { BulkUpsertModal } from './bulk-upsert-modal';
import { BulkDeleteModal } from './bulk-delete-modal';

interface VariablesCardProps {
  environmentId: string;
  environmentSlug: string;
  environmentName: string;
  variables: EnvironmentVariable[];
  isLoading: boolean;
  onRefetch: () => void;
}

function VariablesLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 py-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-4 rounded-lg border border-border/40 p-3">
          <div className="h-4 w-32 shrink-0 rounded bg-muted animate-pulse" />
          <div className="h-4 flex-1 rounded bg-muted/80 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  environmentId,
  onAddClick,
  onRefetch,
}: {
  environmentId: string;
  onAddClick: () => void;
  onRefetch: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-gradient-to-b from-muted/20 to-muted/5 py-16 px-6 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <Variable className="h-10 w-10 text-primary/70" />
      </div>
      <p className="mt-4 text-base font-medium text-foreground">No variables yet</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Add your first variable or import multiple from a JSON or .env file.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button size="sm" onClick={onAddClick}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add variable
        </Button>
        <BulkUpsertModal environmentId={environmentId} onSuccess={onRefetch} />
      </div>
    </div>
  );
}

export function VariablesCard({
  environmentId,
  environmentSlug,
  environmentName,
  variables,
  isLoading,
  onRefetch,
}: VariablesCardProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvironmentVariable | null>(null);
  const [search, setSearch] = useState('');
  const [maskValues, setMaskValues] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const deferredSearch = useDeferredValue(search);
  const filteredVariables = useMemo(() => {
    if (!deferredSearch.trim()) return variables;
    const q = deferredSearch.trim().toLowerCase();
    // Don't let search leak masked values (a match would reveal what's behind the mask).
    return variables.filter(
      v =>
        v.key.toLowerCase().includes(q) ||
        ((!maskValues || revealedKeys.has(v.key)) && (v.value ?? '').toLowerCase().includes(q))
    );
  }, [variables, deferredSearch, maskValues, revealedKeys]);

  const handleEdit = useCallback((v: EnvironmentVariable) => setEditingVar(v), []);
  const handleToggleReveal = useCallback((key: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleToggleMask = useCallback(() => {
    setMaskValues(m => !m);
    if (maskValues) setRevealedKeys(new Set());
  }, [maskValues]);

  const clearSearch = useCallback(() => setSearch(''), []);

  return (
    <Card className="border-border/60 bg-card/60 shadow-sm">
      <CardHeader className="space-y-4 pb-4">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-lg">
          <span className="flex items-center gap-2">
            <Variable className="h-5 w-5 text-muted-foreground" />
            <span>{environmentName}</span>
            <Badge variant="outline" className="font-mono font-normal">
              {environmentSlug}
            </Badge>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add variable
            </Button>
            <BulkUpsertModal environmentId={environmentId} onSuccess={onRefetch} />
            <BulkDeleteModal environmentId={environmentId} variables={variables} onSuccess={onRefetch} />
            <div className="h-6 w-px bg-border" aria-hidden />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportAsEnv(variables, environmentSlug)}
                  disabled={variables.length === 0}
                >
                  <FileDown className="mr-1.5 h-4 w-4" />
                  .env
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download as .env file</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportAsJson(variables, environmentSlug)}
                  disabled={variables.length === 0}
                >
                  <FileDown className="mr-1.5 h-4 w-4" />
                  JSON
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download as JSON</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onRefetch} aria-label="Refresh variables">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh list</TooltipContent>
            </Tooltip>
          </div>
        </CardTitle>
        {variables.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={maskValues ? "Search by key..." : "Search by key or value..."}
                aria-label="Search variables"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-9 font-normal"
              />
              {search ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-1/2 h-full w-9 -translate-y-1/2"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={maskValues ? 'secondary' : 'outline'}
                  onClick={handleToggleMask}
                  className="shrink-0"
                >
                  {maskValues ? (
                    <>
                      <Eye className="mr-1.5 h-4 w-4" />
                      Show values
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-1.5 h-4 w-4" />
                      Mask values
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {maskValues ? 'Reveal all values' : 'Mask sensitive values (use eye icon per row to reveal)'}
              </TooltipContent>
            </Tooltip>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <VariablesLoadingSkeleton />
        ) : variables.length === 0 ? (
          <EmptyState
            environmentId={environmentId}
            onAddClick={() => setCreateModalOpen(true)}
            onRefetch={onRefetch}
          />
        ) : (
          <div className="space-y-4">
            <VariablesTable
              variables={filteredVariables}
              environmentId={environmentId}
              maskValues={maskValues}
              revealedKeys={revealedKeys}
              search={search}
              onClearSearch={clearSearch}
              onEdit={handleEdit}
              onToggleReveal={handleToggleReveal}
              onRefetch={onRefetch}
            />
            <EnvPreview
              variables={variables}
              maskValues={maskValues}
              revealedKeys={revealedKeys}
            />
          </div>
        )}
      </CardContent>

      <CreateOrEditVariableModal
        environmentId={environmentId}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        existing={null}
        onSuccess={onRefetch}
      />
      {editingVar ? (
        <CreateOrEditVariableModal
          environmentId={environmentId}
          open={!!editingVar}
          onOpenChange={open => { if (!open) setEditingVar(null); }}
          existing={editingVar}
          onSuccess={onRefetch}
        />
      ) : null}
    </Card>
  );
}
