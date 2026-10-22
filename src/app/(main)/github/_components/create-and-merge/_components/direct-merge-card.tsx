'use client';

import { useState, useMemo, useCallback, useId } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MANAGED_REPO_NAMES, REPO_NAME_ENUM, REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { useMergeBranches } from '@/modules/github/github.query';
import { Loader2, GitMerge, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { BranchInputPair } from './branch-input-pair';
import { CardSectionLabel } from './card-section-label';

type MergePreset = {
  label: string;
  head: string;
  base: string;
};

const QUICK_MERGE_PRESETS: MergePreset[] = [
  { label: 'Deploy EVA', head: 'develop', base: 'deployment/eva' },
  { label: 'Deploy MIA', head: 'develop', base: 'deployment/mia' },
  { label: 'Deploy DEV', head: 'develop', base: 'deployment/dev' },
  { label: 'Deploy MAP STAGING', head: 'develop', base: 'deployment/map-stag' },
  { label: 'Deploy MAP PRODUCTION', head: 'develop', base: 'deployment/map-prod' },
];

const QUICK_MERGE_NET_CORE_PRESETS: MergePreset[] = [
  { label: 'Deploy .NET EVA', head: 'master', base: 'deployment/eva' },
  { label: 'Deploy .NET MIA', head: 'master', base: 'deployment/mia' },
  { label: 'Deploy .NET DEV', head: 'master', base: 'deployment/dev' },
];

const ignoreQuickMerge = [REPO_NAME_ENUM['.NET API'], REPO_NAME_ENUM['Mobile']];

export function DirectMergeCard() {
  const mergeBranches = useMergeBranches();
  const [selectedRepo, setSelectedRepo] = useState<string>(MANAGED_REPO_NAMES[0] ?? '');
  const [baseBranch, setBaseBranch] = useState('');
  const [headBranch, setHeadBranch] = useState('develop');
  const [commitMessage, setCommitMessage] = useState('');
  const [pendingMerge, setPendingMerge] = useState<{
    owner: string;
    repo: string;
    base: string;
    head: string;
    commitMessage?: string;
  } | null>(null);
  const repoId = useId();
  const commitMessageId = useId();

  const [selectedOwner] = useMemo(() => {
    const parts = selectedRepo.split('/');
    return [parts[0] ?? '', parts[1] ?? ''];
  }, [selectedRepo]);

  const handleMerge = useCallback(
    (overrides?: { head?: string; base?: string; repo?: string }) => {
      const mergeHead = overrides?.head ?? headBranch;
      const mergeBase = overrides?.base ?? baseBranch;
      const mergeRepo = overrides?.repo ?? selectedRepo;
      const [overrideOwner, overrideRepoName] = mergeRepo.split('/');
      const mergeOwner = overrideRepoName ? overrideOwner : selectedOwner;
      const mergeRepoName = overrideRepoName ?? mergeRepo;

      if (!mergeOwner || !mergeRepoName) {
        toast.error('Select a repository');
        return;
      }

      if (!mergeHead || !mergeBase) {
        toast.error('Head and base branches are required');
        return;
      }

      if (mergeHead === mergeBase) {
        toast.error('Head and base branches must be different');
        return;
      }

      setPendingMerge({
        owner: mergeOwner,
        repo: mergeRepoName,
        base: mergeBase,
        head: mergeHead,
        commitMessage: commitMessage || undefined,
      });
    },
    [headBranch, baseBranch, selectedRepo, selectedOwner, commitMessage]
  );

  return (
    <Card className='relative overflow-hidden border-border/60 bg-card/60 lg:col-span-2 shadow-sm transition-shadow duration-200 hover:shadow-md'>
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-green-500/8 via-transparent to-transparent dark:from-green-500/12' />
      <CardHeader className='relative space-y-1 pb-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10'>
            <GitMerge className='h-5 w-5 text-green-600 dark:text-green-400' />
          </div>
          <div>
            <CardTitle className='text-lg tracking-tight'>Direct Branch Merge</CardTitle>
            <CardDescription className='mt-0.5'>
              Merge branches directly without creating a pull request
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='relative space-y-6'>
        <div className='grid gap-6 lg:grid-cols-2'>
          <div className='space-y-5'>
            <CardSectionLabel>Configuration</CardSectionLabel>

            <div className='space-y-2'>
              <label htmlFor={repoId} className='text-sm font-medium text-foreground'>
                Repository
              </label>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger id={repoId} className='h-10 w-full cursor-pointer border-border/80 bg-background/80'>
                  <SelectValue placeholder='Select repository' />
                </SelectTrigger>
                <SelectContent>
                  {MANAGED_REPO_NAMES.map(fn => (
                    <SelectItem key={fn} value={fn} className='cursor-pointer'>
                      {REPO_NAME_MAPPING[fn]?.name ?? fn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <BranchInputPair
              base={baseBranch}
              head={headBranch}
              onBaseChange={setBaseBranch}
              onHeadChange={setHeadBranch}
              basePlaceholder='main'
              headPlaceholder='develop'
            />

            <div className='space-y-2'>
              <label htmlFor={commitMessageId} className='text-sm font-medium text-foreground'>
                Commit Message <span className='font-normal text-muted-foreground'>(optional)</span>
              </label>
              <Input
                id={commitMessageId}
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                className='h-10 border-border/80 bg-background/80'
                placeholder='Leave empty for default merge commit message'
              />
            </div>

            <Button
              onClick={() => handleMerge()}
              disabled={mergeBranches.isPending || !headBranch || !baseBranch}
              className='h-11 w-full cursor-pointer font-medium shadow-sm transition-colors duration-200'
            >
              {mergeBranches.isPending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Merging...
                </>
              ) : (
                <>
                  <GitMerge className='h-4 w-4' />
                  Merge Branches
                </>
              )}
            </Button>
          </div>

          <div className='space-y-4'>
            <CardSectionLabel
              action={
                <span className='text-[11px] font-normal normal-case tracking-normal text-muted-foreground'>
                  Uses selected repo
                </span>
              }
            >
              Deploy presets
            </CardSectionLabel>

            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              {QUICK_MERGE_PRESETS.map(preset => (
                <Button
                  key={`${preset.head}-${preset.base}`}
                  onClick={() => handleMerge({ head: preset.head, base: preset.base })}
                  variant='outline'
                  className='h-10 cursor-pointer justify-start font-medium shadow-sm transition-colors duration-200 hover:border-green-500/40 hover:bg-green-500/5'
                  disabled={mergeBranches.isPending || ignoreQuickMerge.includes(selectedRepo) || !selectedRepo}
                >
                  <Rocket className='mr-2 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400' />
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className='space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4'>
              <CardSectionLabel>.NET API presets</CardSectionLabel>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {QUICK_MERGE_NET_CORE_PRESETS.map(preset => (
                  <Button
                    key={`${preset.head}-${preset.base}`}
                    onClick={() =>
                      handleMerge({ head: preset.head, base: preset.base, repo: REPO_NAME_ENUM['.NET API'] })
                    }
                    disabled={mergeBranches.isPending}
                    variant='outline'
                    className='h-10 cursor-pointer justify-start font-medium shadow-sm transition-colors duration-200 hover:border-primary/40 hover:bg-primary/5'
                  >
                    <Rocket className='mr-2 h-3.5 w-3.5 shrink-0 text-primary' />
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <ConfirmDialog
        open={pendingMerge !== null}
        onOpenChange={open => !open && setPendingMerge(null)}
        title='Merge branches?'
        description={
          pendingMerge && (
            <>
              Merge <span className='font-mono'>{pendingMerge.head}</span> into{' '}
              <span className='font-mono'>{pendingMerge.base}</span> in{' '}
              <span className='font-medium'>
                {pendingMerge.owner}/{pendingMerge.repo}
              </span>
              . This pushes directly to the base branch.
            </>
          )
        }
        confirmLabel='Merge'
        variant='default'
        onConfirm={() => pendingMerge && mergeBranches.mutateAsync(pendingMerge)}
      />
    </Card>
  );
}
