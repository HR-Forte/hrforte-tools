'use client';

import { useState, useMemo, useCallback, useId } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MANAGED_REPO_NAMES, REPO_NAME_ENUM, REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { useCreatePullRequest } from '@/modules/github/github.query';
import type { GithubPullRequest } from '@/modules/github/github.type';
import type { ApiResponse } from '@/lib/api/types';
import type { StoredCreatedPr } from '../_types';
import { Loader2, GitPullRequest, Rocket, Settings2, SlidersHorizontal, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BranchInputPair } from './branch-input-pair';
import { CardSectionLabel } from './card-section-label';

type DeployPreset = {
  label: string;
  title: string;
  head: string;
  base: string;
};

const DEPLOY_PRESETS: DeployPreset[] = [
  { label: 'Create EVA PR', title: 'Deploy EVA', head: 'develop', base: 'deployment/eva' },
  { label: 'Create MIA PR', title: 'Deploy MIA', head: 'develop', base: 'deployment/mia' },
  { label: 'Create DEV PR', title: 'Deploy DEV', head: 'develop', base: 'deployment/dev' },
  { label: 'Create MAP STAGING PR', title: 'Deploy MAP STAGING', head: 'develop', base: 'deployment/map-stag' },
  { label: 'Create MAP PRODUCTION PR', title: 'Deploy MAP PRODUCTION', head: 'develop', base: 'deployment/map-prod' },
];

const ignoreCreatePr = [REPO_NAME_ENUM['Mobile']];
interface CreatePrCardProps {
  onPrCreated: (entry: StoredCreatedPr) => void;
}

export function CreatePrCard({ onPrCreated }: CreatePrCardProps) {
  const createPullRequest = useCreatePullRequest();
  const fieldId = useId();
  const [selectedRepo, setSelectedRepo] = useState<string>(MANAGED_REPO_NAMES[0] ?? '');
  const [baseBranch, setBaseBranch] = useState('');
  const [headBranch, setHeadBranch] = useState('develop');
  const [title, setTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [pendingPr, setPendingPr] = useState<{
    owner: string;
    repo: string;
    title: string;
    head: string;
    base: string;
    prBody: string;
    draft: boolean;
  } | null>(null);

  const [selectedOwner, selectedRepoName] = useMemo(() => {
    const parts = selectedRepo.split('/');
    return [parts[0] ?? '', parts[1] ?? ''];
  }, [selectedRepo]);

  const handleCreatePullRequest = useCallback(
    (overrides?: {
      title?: string;
      headBranch?: string;
      baseBranch?: string;
      prBody?: string;
      draft?: boolean;
    }) => {
      const prTitle = overrides?.title ?? title;
      const prHeadBranch = overrides?.headBranch ?? headBranch;
      const prBaseBranch = overrides?.baseBranch ?? baseBranch;
      const prBodyText = overrides?.prBody ?? prBody;
      const prDraft = overrides?.draft ?? false;

      if (!selectedOwner || !selectedRepoName) {
        toast.error('Select a repository');
        return;
      }
      if (!prTitle || !prHeadBranch || !prBaseBranch) {
        toast.error('Title, head, and base are required');
        return;
      }
      setPendingPr({
        owner: selectedOwner,
        repo: selectedRepoName,
        title: prTitle,
        head: prHeadBranch,
        base: prBaseBranch,
        prBody: prBodyText,
        draft: prDraft,
      });
    },
    [title, headBranch, baseBranch, prBody, selectedOwner, selectedRepoName]
  );

  const confirmCreatePullRequest = useCallback(async () => {
    if (!pendingPr) return;
    // error toast is handled by the mutation hook
    const result = (await createPullRequest.mutateAsync(pendingPr).catch(() => undefined)) as
      | ApiResponse<GithubPullRequest>
      | GithubPullRequest
      | undefined;
    if (!result) return;
    const pr: GithubPullRequest = result && typeof result === 'object' && 'data' in result ? result.data : result;
    const repoFullName = `${pendingPr.owner}/${pendingPr.repo}`;
    onPrCreated({ pr, repoFullName, createdAt: new Date().toISOString() });
  }, [pendingPr, createPullRequest, onPrCreated]);

  return (
    <Card className='relative overflow-hidden border-border/60 bg-card/60 shadow-sm transition-shadow duration-200 hover:shadow-md'>
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent dark:from-primary/12' />
      <CardHeader className='relative space-y-1 pb-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10'>
            <GitPullRequest className='h-5 w-5 text-primary' />
          </div>
          <div>
            <CardTitle className='text-lg tracking-tight'>Create Pull Request</CardTitle>
            <CardDescription className='mt-0.5'>Create a single PR in the selected repository</CardDescription>
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
            <label htmlFor={`${fieldId}-repo`} className='text-sm font-medium text-foreground'>
              Repository
            </label>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger
                id={`${fieldId}-repo`}
                className='h-10 w-full cursor-pointer border-border/80 bg-background/80'
              >
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
          <div className='space-y-2'>
            <label htmlFor={`${fieldId}-body`} className='text-sm font-medium text-foreground'>
              Description <span className='font-normal text-muted-foreground'>(optional)</span>
            </label>
            <Textarea
              id={`${fieldId}-body`}
              value={prBody}
              onChange={e => setPrBody(e.target.value)}
              rows={4}
              className='resize-none border-border/80 bg-background/80'
              placeholder='Describe your changes...'
            />
          </div>
        </div>

        <div className='space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4'>
          <CardSectionLabel
            action={
              <Badge variant='secondary' className='text-[10px] font-normal normal-case tracking-normal'>
                One click
              </Badge>
            }
          >
            <Zap className='h-3.5 w-3.5 text-primary' aria-hidden />
            Quick actions
          </CardSectionLabel>
          <p className='text-xs text-muted-foreground'>
            Preset branches and title, using the settings above. You confirm before anything is created.
          </p>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {DEPLOY_PRESETS.map(preset => (
              <Button
                key={preset.base}
                onClick={() =>
                  handleCreatePullRequest({
                    title: preset.title,
                    headBranch: selectedRepo === REPO_NAME_ENUM['.NET API'] ? 'master' : preset.head,
                    baseBranch: preset.base,
                  })
                }
                variant='outline'
                className='h-10 w-full cursor-pointer justify-start bg-background/80 font-medium shadow-sm transition-colors duration-200 hover:border-primary/40 hover:bg-primary/5'
                disabled={ignoreCreatePr.includes(selectedRepo) || createPullRequest.isPending}
              >
                <Rocket className='mr-2 h-3.5 w-3.5 shrink-0 text-primary' />
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
            base={baseBranch}
            head={headBranch}
            onBaseChange={setBaseBranch}
            onHeadChange={setHeadBranch}
          />

          <div className='space-y-2'>
            <label htmlFor={`${fieldId}-title`} className='text-sm font-medium text-foreground'>
              Title
            </label>
            <Input
              id={`${fieldId}-title`}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className='h-10 border-border/80 bg-background/80'
              placeholder='PR title'
            />
          </div>

          <Button
            onClick={() => handleCreatePullRequest()}
            disabled={createPullRequest.isPending}
            className='h-11 w-full cursor-pointer font-medium shadow-sm transition-colors duration-200'
          >
            {createPullRequest.isPending ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Creating...
              </>
            ) : (
              <>
                <GitPullRequest className='h-4 w-4' />
                Create PR
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={pendingPr !== null}
        onOpenChange={open => !open && setPendingPr(null)}
        title='Create pull request?'
        description={
          pendingPr && (
            <>
              Create {pendingPr.draft ? 'draft ' : ''}PR &quot;{pendingPr.title}&quot; from{' '}
              <span className='font-mono'>{pendingPr.head}</span> into{' '}
              <span className='font-mono'>{pendingPr.base}</span> in{' '}
              <span className='font-medium'>
                {pendingPr.owner}/{pendingPr.repo}
              </span>
              .
            </>
          )
        }
        confirmLabel='Create PR'
        variant='default'
        onConfirm={confirmCreatePullRequest}
      />
    </Card>
  );
}
