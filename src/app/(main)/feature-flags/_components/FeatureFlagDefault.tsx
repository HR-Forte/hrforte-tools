'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeatureFlagHeaderMap, FeatureFlagName, FeatureFlagNameEnum } from '@/modules/feature-flag/feature-flag.type';
import { Info, RefreshCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { EndpointName } from '@/lib/api/types';
import { useDefaultFeatureFlags, useUpdateDefaultFeatureFlag } from '@/modules/feature-flag/feature-flag.query';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { QueryError } from '@/components/query-error';

type FeatureFlagDefaultProps = {
  endpoint: EndpointName;
};

const features = Object.values(FeatureFlagNameEnum);

const FeatureFlagDefault = ({ endpoint }: FeatureFlagDefaultProps) => {
  const { data: defaultFeatureFlags, refetch, isFetching, isError, error } = useDefaultFeatureFlags(endpoint);
  const { mutateAsync: updateDefaultFeatureFlag } = useUpdateDefaultFeatureFlag(endpoint);
  const [featureFlag, setFeatureFlag] = useState<FeatureFlagName | null>(null);

  const enabledCount = features.filter(feature => defaultFeatureFlags?.[feature]).length;
  const isEnabling = !!featureFlag && !defaultFeatureFlags?.[featureFlag];

  return (
    <div className='flex flex-col gap-4'>
      <Alert>
        <Info className='h-4 w-4' />
        <AlertDescription>These flags apply to all companies unless overridden at the company level.</AlertDescription>
      </Alert>

      <div className='flex items-center justify-between gap-2'>
        <p className='text-sm text-muted-foreground' aria-live='polite'>
          {defaultFeatureFlags ? (
            <>
              <span className='font-medium text-foreground'>{enabledCount}</span> of {features.length} enabled
            </>
          ) : (
            !isError && 'Loading…'
          )}
        </p>
        <Button variant='outline' size='sm' onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {isError && <QueryError error={error} onRetry={refetch} title="Couldn't load default feature flags" />}

      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3 overflow-y-auto max-h-[calc(100vh-400px)] p-0.5'>
        {features.map(feature => {
          const enabled = !!defaultFeatureFlags?.[feature];

          if (!defaultFeatureFlags && !isError) {
            return <div key={feature} className='h-[74px] rounded-lg border bg-muted/40 animate-pulse' />;
          }

          return (
            <label
              key={feature}
              htmlFor={`default-${feature}`}
              className={cn(
                'flex items-center justify-between gap-3 p-4 rounded-lg border bg-card transition-colors',
                defaultFeatureFlags && 'cursor-pointer hover:bg-accent/50',
                enabled && 'border-green-600/30 bg-green-600/5 dark:border-green-400/30'
              )}
            >
              <div className='min-w-0'>
                <h3 className='font-medium truncate'>{FeatureFlagHeaderMap[feature]}</h3>
                <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <span
                    aria-hidden
                    className={cn(
                      'size-1.5 rounded-full',
                      enabled ? 'bg-green-600 dark:bg-green-400' : 'bg-muted-foreground/50'
                    )}
                  />
                  {defaultFeatureFlags ? (enabled ? 'Enabled' : 'Disabled') : 'Unknown'}
                </p>
              </div>

              {/* Unknown state (loading/failed) must not be toggleable: it would send the wrong value */}
              <Switch
                id={`default-${feature}`}
                aria-label={FeatureFlagHeaderMap[feature]}
                checked={enabled}
                disabled={!defaultFeatureFlags}
                onClick={event => {
                  event.preventDefault();
                  setFeatureFlag(feature);
                }}
              />
            </label>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!featureFlag}
        onOpenChange={open => !open && setFeatureFlag(null)}
        title={featureFlag && `${isEnabling ? 'Enable' : 'Disable'} ${FeatureFlagHeaderMap[featureFlag]}?`}
        description={
          featureFlag && (
            <>
              This will <b>{isEnabling ? 'enable' : 'disable'}</b> <b>{FeatureFlagHeaderMap[featureFlag]}</b> by default
              for <b>all companies</b> on <b>{endpoint.replace('_', ' ')}</b>, except those with a company override.
            </>
          )
        }
        confirmLabel={isEnabling ? 'Enable' : 'Disable'}
        variant={isEnabling ? 'default' : 'destructive'}
        onConfirm={() => featureFlag && updateDefaultFeatureFlag({ flags: { [featureFlag]: isEnabling } })}
      />
    </div>
  );
};

export default FeatureFlagDefault;
