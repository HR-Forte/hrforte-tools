'use client';

import { useState, useId } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MANAGED_REPO_NAMES, REPO_NAME_ENUM, REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { GitMerge, Loader2, Rocket, Settings2, SlidersHorizontal, Zap } from 'lucide-react';
import type { QuickMergeOverrides } from '../_types';
import { BranchInputPair } from './branch-input-pair';
import { CardSectionLabel } from './card-section-label';

type QuickMergePreset = {
  label: string;
  title: string;
  head: string;
  base: string;
};

const QUICK_MERGE_PRESETS: QuickMergePreset[] = [
  {
    label: 'Quick Merge EVA',
    title: 'Deploy EVA',
    head: 'develop',
    base: 'deployment/eva',
  },
  {
    label: 'Quick Merge MIA',
    title: 'Deploy MIA',
    head: 'develop',
    base: 'deployment/mia',
  },
  { label: 'Quick Merge DEV', title: 'Deploy DEV', head: 'develop', base: 'deployment/dev' },
  {
    label: 'Quick Merge MAP STAGING',
    title: 'Deploy MAP STAGING',
    head: 'develop',
    base: 'deployment/map-stag',
  },
  {
    label: 'Quick Merge MAP PRODUCTION',
    title: 'Deploy MAP PRODUCTION',
    head: 'develop',
    base: 'deployment/map-prod',
  },
];

const ignoreQuickMerge = [REPO_NAME_ENUM['Mobile']];
interface QuickMergeCardProps {
  quickSelectedRepos: Set<string>;
  quickBase: string;
  quickHead: string;
  quickTitle: string;
  quickBody: string;
  quickDraft: boolean;
  quickRunning: boolean;
  onBaseChange: (value: string) => void;
  onHeadChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onToggleRepo: (fullName: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onRunQuickMerge: (overrides?: QuickMergeOverrides) => void;
}

export function QuickMergeCard({
  quickSelectedRepos,
  quickBase,
  quickHead,
  quickTitle,
  quickBody,
  quickDraft,
  quickRunning,
  onBaseChange,
  onHeadChange,
  onTitleChange,
  onBodyChange,
  onToggleRepo,
  onSelectAll,
  onClearAll,
  onRunQuickMerge,
}: QuickMergeCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fieldId = useId();
  const [pendingOverrides, setPendingOverrides] = useState<QuickMergeOverrides | undefined>(undefined);

  const requestMerge = (overrides?: QuickMergeOverrides) => {
    const base = overrides?.base ?? quickBase;
    const head = overrides?.head ?? quickHead;
    const prTitle = overrides?.title ?? quickTitle;
    const targetRepos = overrides?.repos ?? Array.from(quickSelectedRepos);

    if (!prTitle || !head || !base) {
      toast.error('Title, head, and base are required');
      return;
    }
    if (!targetRepos.length) {
      toast.error('Select at least one repository');
      return;
    }

    setPendingOverrides(overrides);
    setConfirmOpen(true);
  };

  const handleConfirmMerge = () => {
    onRunQuickMerge(pendingOverrides);
    setConfirmOpen(false);
    setPendingOverrides(undefined);
  };

  const base = pendingOverrides?.base ?? quickBase;
  const head = pendingOverrides?.head ?? quickHead;
  const prTitle = pendingOverrides?.title ?? quickTitle;
  const targetRepos = pendingOverrides?.repos ?? Array.from(quickSelectedRepos);
  const repoList = targetRepos.map(r => REPO_NAME_MAPPING[r]?.name ?? r).join(', ');
  const isNETRepo = quickSelectedRepos.has(REPO_NAME_ENUM['.NET API']);

  return (
    <>
      <Card className='relative overflow-hidden border-border/60 bg-card/60 shadow-sm transition-shadow duration-200 hover:shadow-md'>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-transparent dark:from-purple-500/12' />
        <CardHeader className='relative space-y-1 pb-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10'>
              <Zap className='h-5 w-5 text-purple-600 dark:text-purple-400' />
            </div>
            <div>
              <CardTitle className='text-lg tracking-tight'>Quick Create & Merge</CardTitle>
              <CardDescription className='mt-0.5'>
                Create and merge PRs across multiple repositories
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='relative space-y-5'>
          <div className='space-y-3'>
            <CardSectionLabel>
              <Settings2 className='h-3.5 w-3.5' aria-hidden />
              Applies to both
            </CardSectionLabel>
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm font-medium text-foreground'>Repositories</span>
                <div className='flex items-center gap-2'>
                  {quickSelectedRepos.size > 0 ? (
                    <Badge variant='secondary' className='text-[10px] font-normal'>
                      {quickSelectedRepos.size} selected
                    </Badge>
                  ) : null}
                  <div className='flex gap-1.5'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={onSelectAll}
                      className='h-7 cursor-pointer text-xs transition-colors duration-200'
                    >
                      All
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={onClearAll}
                      className='h-7 cursor-pointer text-xs transition-colors duration-200'
                    >
                      None
                    </Button>
                  </div>
                </div>
              </div>
              <div className='max-h-36 overflow-y-auto rounded-xl border border-border/50 bg-muted/20 p-2'>
                {MANAGED_REPO_NAMES.map(fn => {
                  const repoInfo = REPO_NAME_MAPPING[fn];
                  const isSelected = quickSelectedRepos.has(fn);
                  return (
                    <label
                      key={fn}
                      className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-muted/60 has-[:checked]:bg-purple-500/10'
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => onToggleRepo(fn)} />
                      <span
                        className='h-2 w-2 shrink-0 rounded-full'
                        style={{ backgroundColor: repoInfo?.color ?? 'var(--muted-foreground)' }}
                        aria-hidden
                      />
                      <span className='text-sm font-medium'>{repoInfo?.name ?? fn}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className='space-y-2'>
              <label htmlFor={`${fieldId}-body`} className='text-sm font-medium text-foreground'>
                Description <span className='font-normal text-muted-foreground'>(optional)</span>
              </label>
              <Textarea
                id={`${fieldId}-body`}
                value={quickBody}
                onChange={e => onBodyChange(e.target.value)}
                rows={3}
                className='resize-none border-border/80 bg-background/80'
                placeholder='Optional description...'
              />
            </div>
            {isNETRepo && quickSelectedRepos.size !== 1 ? (
              <p className='rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
                Please select only one .NET API repository to run quick merge
              </p>
            ) : null}
          </div>

          <div className='space-y-3 rounded-xl border border-purple-500/30 bg-purple-500/5 p-4'>
            <CardSectionLabel
              action={
                <Badge variant='secondary' className='text-[10px] font-normal normal-case tracking-normal'>
                  One click
                </Badge>
              }
            >
              <Zap className='h-3.5 w-3.5 text-purple-600 dark:text-purple-400' aria-hidden />
              Quick actions
            </CardSectionLabel>
            <p className='text-xs text-muted-foreground'>
              Preset branches and title for every selected repo, using the settings above. You confirm before anything runs.
            </p>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              {QUICK_MERGE_PRESETS.map(preset => (
                <Button
                  key={preset.base}
                  onClick={() =>
                    requestMerge({
                      title: preset.title,
                      head: isNETRepo ? 'master' : preset.head,
                      base: preset.base,
                      body: quickBody,
                      draft: quickDraft,
                      repos: Array.from(quickSelectedRepos),
                    })
                  }
                  variant='outline'
                  disabled={
                    quickRunning ||
                    (isNETRepo && quickSelectedRepos.size !== 1) ||
                    ignoreQuickMerge.some(repo => quickSelectedRepos.has(repo))
                  }
                  className='h-10 w-full cursor-pointer justify-start bg-background/80 font-medium shadow-sm transition-colors duration-200 hover:border-purple-500/40 hover:bg-purple-500/5'
                >
                  <Rocket className='mr-2 h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400' />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
            <span className='h-px flex-1 bg-border' />
            or configure manually
            <span className='h-px flex-1 bg-border' />
          </div>

          <div className='space-y-4 rounded-xl border border-border/50 p-4'>
            <CardSectionLabel>
              <SlidersHorizontal className='h-3.5 w-3.5' aria-hidden />
              Manual
            </CardSectionLabel>
            <BranchInputPair
              base={quickBase}
              head={quickHead}
              onBaseChange={onBaseChange}
              onHeadChange={onHeadChange}
            />

            <div className='space-y-2'>
              <label htmlFor={`${fieldId}-title`} className='text-sm font-medium text-foreground'>
                Title
              </label>
              <Input
                id={`${fieldId}-title`}
                value={quickTitle}
                onChange={e => onTitleChange(e.target.value)}
                className='h-10 border-border/80 bg-background/80'
                placeholder='Quick PR'
              />
            </div>

            <Button
              onClick={() => requestMerge()}
              disabled={quickRunning || (isNETRepo && quickSelectedRepos.size !== 1)}
              className='h-11 w-full cursor-pointer font-medium shadow-sm transition-colors duration-200'
            >
              {quickRunning ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Running...
                </>
              ) : (
                <>
                  <GitMerge className='h-4 w-4' />
                  Run Quick Merge
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={open => {
          setConfirmOpen(open);
          if (!open) setPendingOverrides(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Quick Merge</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='space-y-2 text-sm text-muted-foreground'>
                <p>
                  Create and merge PR &quot;{prTitle}&quot; ({head} → {base}) in {targetRepos.length} repo(s):
                </p>
                <pre className='max-h-32 overflow-y-auto rounded-md border border-border/50 bg-muted/50 p-3 text-left text-sm text-foreground'>
                  {repoList}
                </pre>
                <p>Continue?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMerge} className='cursor-pointer'>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
