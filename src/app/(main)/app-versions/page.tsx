'use client';

import React, { useState } from 'react';
import { Tabs, TabsPanel, TabsPanels, TabsList, TabsTab } from '@/components/animate-ui/components/base/tabs';
import RepositoryVersions from './_components/RepositoryVersions';
import AppVersions from './_components/AppVersions';
import { EndpointName } from '@/lib/api/types';

const AppVersionsPage = () => {
  const [endpoint, setEndpoint] = useState<EndpointName>('MIA');

  const tabs = [
    {
      label: 'App Versions',
      value: 'app-versions',
      component: <AppVersions endpoint={endpoint} setEndpoint={setEndpoint} />,
    },
    {
      label: 'Repository Versions',
      value: 'repo-versions',
      component: <RepositoryVersions endpoint={endpoint} setEndpoint={setEndpoint} />,
    },
  ];

  return (
    <div className='p-4 w-full h-full'>
      <Tabs defaultValue={tabs[0].value}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTab key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTab>
          ))}
        </TabsList>
        <TabsPanels>
          {tabs.map(tab => (
            <TabsPanel key={tab.value} value={tab.value}>
              {tab.component}
            </TabsPanel>
          ))}
        </TabsPanels>
      </Tabs>
    </div>
  );
};

export default AppVersionsPage;
