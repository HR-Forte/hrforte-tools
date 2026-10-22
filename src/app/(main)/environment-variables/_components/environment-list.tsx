'use client';

import { Badge } from '@/components/ui/badge';
import { FolderCog } from 'lucide-react';
import type { Environment } from '@/modules/environment-variable/environment-variable.type';
import { CreateEnvironmentButton } from './create-environment-button';

export function EnvironmentListSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-10 w-32 shrink-0 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export function EnvironmentList({
  environments,
  selectedId,
  isLoading,
  onSelect,
  onRefetch,
}: {
  environments: Environment[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onRefetch: () => void;
}) {
  if (isLoading) return <EnvironmentListSkeleton />;

  if (environments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl gap-2 border border-dashed border-border/60 bg-muted/20 py-8 text-center">
        <FolderCog className="h-10 w-10 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium text-muted-foreground">No environments yet</p>
        <p className="mt-0.5 max-w-sm text-xs text-muted-foreground">
          Create an environment to group and manage variables.
        </p>
        <CreateEnvironmentButton onSuccess={onRefetch} />
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1">
      {environments.map((env: Environment) => (
        <button
          key={env.id}
          type="button"
          aria-pressed={selectedId === env.id}
          onClick={() => onSelect(env.id)}
          className={`group flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            selectedId === env.id
              ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
              : 'border-border/60 bg-background/50 hover:border-primary/40 hover:bg-muted/30'
          }`}
        >
          <FolderCog
            className={`h-4 w-4 shrink-0 ${selectedId === env.id ? 'text-primary' : 'text-muted-foreground group-hover:text-muted-foreground/80'}`}
          />
          <span className="truncate max-w-[140px] font-medium text-sm">{env.name}</span>
          <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 font-normal">
            {env._count?.variables ?? 0}
          </Badge>
        </button>
      ))}
    </div>
  );
}
