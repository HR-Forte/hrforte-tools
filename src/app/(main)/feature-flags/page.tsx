'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/animate-ui/components/base/tabs';
import { Globe, Building2, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FeatureFlagCompanyOverrides from './_components/FeatureFlagCompanyOverrides';
import FeatureFlagDefault from './_components/FeatureFlagDefault';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EndpointName } from '@/lib/api/types';
import { useState } from 'react';
import { getEndpointOptions } from '@/lib/utils';

const endPoints = getEndpointOptions('MIA', 'EVA', 'DEV', 'MAP_STAGING', 'MAP_PRODUCTION');

const FeatureFlagsPage = () => {
  const [endpoint, setEndpoint] = useState<EndpointName>('MIA');
  const isProduction = endpoint === 'EVA' || endpoint === 'MAP_PRODUCTION';

  return (
    <div className='p-4 w-full h-screen'>
      <Card className='shadow-none w-full h-full'>
        <CardHeader className='flex flex-col gap-4 border-b'>
          <div className='flex flex-wrap items-start justify-between gap-4 w-full'>
            <div className='space-y-1'>
              <CardTitle className='text-2xl font-bold'>Feature Flags</CardTitle>
              <CardDescription>
                Manage default feature flags and per-company overrides for each environment.
              </CardDescription>
            </div>

            <div className='flex flex-col gap-1.5'>
              <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>Environment</span>
              <Tabs value={endpoint} onValueChange={value => setEndpoint(value)}>
                <TabsList>
                  {endPoints.map(endPoint => (
                    <TabsTab key={endPoint.value} value={endPoint.value}>
                      {endPoint.label}
                    </TabsTab>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isProduction && (
            <Alert variant='destructive' className='border-destructive/40 bg-destructive/5 py-2'>
              <TriangleAlert className='h-4 w-4' />
              <AlertDescription>
                <span>
                  <strong>Production environment.</strong> Don&apos;t do the stupid things.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className='max-h-[calc(100vh-100px)]'>
          <Tabs defaultValue='general' className='space-y-6'>
            <TabsList className='grid w-full max-w-md grid-cols-2'>
              <TabsTab value='general' className='flex items-center gap-2'>
                <Globe className='w-4 h-4' />
                General Settings
              </TabsTab>
              <TabsTab value='companies' className='flex items-center gap-2'>
                <Building2 className='w-4 h-4' />
                Company Overrides
              </TabsTab>
            </TabsList>

            {/* General Settings Tab */}
            <TabsPanel value='general' className='space-y-4'>
              <FeatureFlagDefault endpoint={endpoint} />
            </TabsPanel>

            {/* Company Overrides Tab */}
            <TabsPanel value='companies' className='space-y-4'>
              <FeatureFlagCompanyOverrides endpoint={endpoint} />
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureFlagsPage;
