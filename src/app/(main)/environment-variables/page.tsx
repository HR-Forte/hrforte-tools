'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { RefreshCcw, FolderCog, Shield } from 'lucide-react';
import {
  useEnvironments,
  useVariables,
} from '@/modules/environment-variable/environment-variable.query';
import type { Environment } from '@/modules/environment-variable/environment-variable.type';
import { EnvironmentList } from './_components/environment-list';
import { CreateEnvironmentButton } from './_components/create-environment-button';
import { VariablesCard } from './_components/variables-card';
import { QueryError } from '@/components/query-error';

const EnvironmentVariablesPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const {
    data: environments = [],
    isPending: envLoading,
    isError: envError,
    error: envErrorObj,
    refetch: refetchEnvs,
  } = useEnvironments();
  const {
    data: variables = [],
    isPending: varLoading,
    isError: varError,
    error: varErrorObj,
    refetch: refetchVars,
  } = useVariables(selectedId);
  const selectedEnv = environments.find((e: Environment) => e.id === selectedId);

  return (
    <TooltipProvider>
      <div className="space-y-8 p-8">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Environment Variables</h1>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                Manage env vars by environment. Values are stored encrypted.
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => refetchEnvs()} aria-label="Refresh environments">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh environments</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <Card className="border-border/60 bg-card/60 shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
              <span className="flex items-center gap-2">
                <FolderCog className="h-4 w-4 text-muted-foreground" />
                Environments
              </span>
              <CreateEnvironmentButton onSuccess={() => refetchEnvs()} />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {envError ? (
              <QueryError error={envErrorObj} onRetry={refetchEnvs} title="Couldn't load environments" />
            ) : (
              <EnvironmentList
                environments={environments}
                selectedId={selectedId}
                isLoading={envLoading}
                onSelect={setSelectedId}
                onRefetch={() => refetchEnvs()}
              />
            )}
          </CardContent>
        </Card>

        {selectedId && selectedEnv && varError ? (
          <QueryError error={varErrorObj} onRetry={refetchVars} title="Couldn't load variables" />
        ) : selectedId && selectedEnv ? (
          <VariablesCard
            key={selectedId}
            environmentId={selectedId}
            environmentSlug={selectedEnv.slug}
            environmentName={selectedEnv.name}
            variables={variables}
            isLoading={varLoading}
            onRefetch={refetchVars}
          />
        ) : null}

        {environments.length > 0 && !selectedId ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/5 py-16 px-6 text-center">
            <div className="rounded-full bg-muted/50 p-4">
              <FolderCog className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">Select an environment</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose an environment above to view and manage its variables</p>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
};

export default EnvironmentVariablesPage;
