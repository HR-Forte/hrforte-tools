'use client';

import { Tabs, TabsList, TabsTab, TabsPanel, TabsPanels } from '@/components/animate-ui/components/base/tabs';
import ManagedRepositoriesTab from './_components/ManagedRepositoriesTab';
import PullRequestsTab from './_components/PullRequestsTab';
import CreateAndMergeTab from './_components/CreateAndMergeTab';
import SecretsAndVariablesTab from './_components/SecretsAndVariablesTab';

const GithubPage = () => {
  return (
    <div className='min-h-screen bg-background px-6 py-10'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-8'>
        <div className='space-y-2'>
          <p className='text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground'>GitHub Toolkit</p>
          <h1 className='text-3xl font-semibold text-foreground md:text-4xl'>HR Forte Github</h1>
          <p className='text-sm text-muted-foreground'>
            Manage repositories, view pull requests, create or merge quickly, and manage Actions secrets and variables
            across managed repos.
          </p>
        </div>

        <Tabs defaultValue='create'>
          <TabsList>
            <TabsTab value='create'>Create PR / Quick Merge</TabsTab>
            <TabsTab value='pulls'>Pull Requests</TabsTab>
            <TabsTab value='actions-secrets'>Actions Secrets & Variables</TabsTab>
            <TabsTab value='repos'>Managed Repositories</TabsTab>
          </TabsList>
          <TabsPanels className='mt-4'>
            <TabsPanel value='create'>
              <CreateAndMergeTab />
            </TabsPanel>
            <TabsPanel value='pulls'>
              <PullRequestsTab />
            </TabsPanel>
            <TabsPanel value='actions-secrets'>
              <SecretsAndVariablesTab />
            </TabsPanel>
            <TabsPanel value='repos'>
              <ManagedRepositoriesTab />
            </TabsPanel>
          </TabsPanels>
        </Tabs>
      </div>
    </div>
  );
};

export default GithubPage;
