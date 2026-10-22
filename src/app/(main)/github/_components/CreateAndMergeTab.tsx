'use client';

import { GitMerge, GitPullRequest, Layers, Zap } from 'lucide-react';
import { MANAGED_REPO_NAMES } from '@/modules/change-log/change-log.const';
import { useCreatedPrs } from './create-and-merge/_hooks/use-created-prs';
import { useQuickMerge } from './create-and-merge/_hooks/use-quick-merge';
import { DirectMergeCard } from './create-and-merge/_components/direct-merge-card';
import { CreatePrCard } from './create-and-merge/_components/create-pr-card';
import { QuickMergeCard } from './create-and-merge/_components/quick-merge-card';
import { PrStatusCard } from './create-and-merge/_components/pr-status-card';
import { QuickMergeResultsCard } from './create-and-merge/_components/quick-merge-results-card';
import { WorkflowSection } from './create-and-merge/_components/workflow-section';
import { WorkflowStatCard } from './create-and-merge/_components/workflow-stat-card';

const CreateAndMergeTab = () => {
  const { createdPrs, addCreatedPr, clearAll: clearCreatedPrs } = useCreatedPrs();

  const {
    quickSelectedRepos,
    quickMergeHistory,
    quickBase,
    setQuickBase,
    quickHead,
    setQuickHead,
    quickTitle,
    setQuickTitle,
    quickBody,
    setQuickBody,
    quickDraft,
    quickRunning,
    actionLogs,
    toggleQuickRepo,
    selectAllQuickRepos,
    clearQuickRepos,
    clearHistory,
    runQuickMerge,
  } = useQuickMerge();

  const successCount = actionLogs.filter(l => l.status === 'success').length;
  const activeLogCount = actionLogs.length;

  return (
    <div className='space-y-10'>
      <div className='grid gap-3 sm:grid-cols-3'>
        <WorkflowStatCard
          label='Session PRs'
          value={createdPrs.length}
          hint={createdPrs.length === 0 ? 'Create a PR to track status' : 'Created in this session'}
          icon={<GitMerge className='h-4 w-4 text-green-600 dark:text-green-400' />}
          accent='green'
        />
        <WorkflowStatCard
          label='Selected repos'
          value={quickSelectedRepos.size}
          hint={`${quickSelectedRepos.size} of ${MANAGED_REPO_NAMES.length} for quick merge`}
          icon={<Layers className='h-4 w-4 text-primary' />}
          accent='blue'
        />
        <WorkflowStatCard
          label='Merge runs'
          value={quickMergeHistory.length + (activeLogCount > 0 ? 1 : 0)}
          hint={
            quickRunning
              ? 'Quick merge in progress…'
              : activeLogCount > 0
                ? `${successCount}/${activeLogCount} repos succeeded`
                : 'No runs yet'
          }
          icon={<Zap className='h-4 w-4 text-purple-600 dark:text-purple-400' />}
          accent='purple'
        />
      </div>

      <WorkflowSection
        title='Create Pull Request'
        description='Create a single PR and track its mergeability.'
        icon={<GitPullRequest className='h-5 w-5 text-green-600 dark:text-green-400' />}
      >
        <div className='grid items-start gap-6 xl:grid-cols-2'>
          <CreatePrCard onPrCreated={addCreatedPr} />
          <PrStatusCard createdPrs={createdPrs} onClearAll={clearCreatedPrs} />
        </div>
      </WorkflowSection>

      <WorkflowSection
        title='Quick Create & Merge'
        description='Batch create-and-merge across repositories and review run outcomes.'
        icon={<Zap className='h-5 w-5 text-purple-600 dark:text-purple-400' />}
      >
        <div className='grid items-start gap-6 xl:grid-cols-2'>
          <QuickMergeCard
            quickSelectedRepos={quickSelectedRepos}
            quickBase={quickBase}
            quickHead={quickHead}
            quickTitle={quickTitle}
            quickBody={quickBody}
            quickDraft={quickDraft}
            quickRunning={quickRunning}
            onBaseChange={setQuickBase}
            onHeadChange={setQuickHead}
            onTitleChange={setQuickTitle}
            onBodyChange={setQuickBody}
            onToggleRepo={toggleQuickRepo}
            onSelectAll={selectAllQuickRepos}
            onClearAll={clearQuickRepos}
            onRunQuickMerge={runQuickMerge}
          />
          <QuickMergeResultsCard
            actionLogs={actionLogs}
            quickMergeHistory={quickMergeHistory}
            quickTitle={quickTitle}
            quickRunning={quickRunning}
            onClearHistory={clearHistory}
          />
        </div>
      </WorkflowSection>

      <WorkflowSection
        title='Direct Branch Merge'
        description='Merge one branch into another directly, without a PR.'
        icon={<GitMerge className='h-5 w-5 text-primary' />}
      >
        <DirectMergeCard />
      </WorkflowSection>
    </div>
  );
};

export default CreateAndMergeTab;
