'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { MANAGED_REPO_NAMES, REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { useGithubRepo } from '@/modules/github/github.query';
import { format } from 'date-fns';
import { ExternalLink, GitBranch, Star, Calendar } from 'lucide-react';

const ManagedRepositoriesTab = () => {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {MANAGED_REPO_NAMES.map(fullName => {
          const [owner, repo] = fullName.split('/');
          const displayInfo = REPO_NAME_MAPPING[fullName];
          return (
            <RepoCard
              key={fullName}
              owner={owner}
              repo={repo}
              fullName={fullName}
              displayName={displayInfo?.name ?? fullName}
              color={displayInfo?.color}
            />
          );
        })}
      </div>
    </div>
  );
};

function RepoCard({
  owner,
  repo,
  fullName,
  displayName,
  color,
}: {
  owner: string;
  repo: string;
  fullName: string;
  displayName: string;
  color?: string;
}) {
  const { data: repoData, isPending, error } = useGithubRepo(owner, repo);
  const htmlUrl = repoData?.html_url ?? `https://github.com/${fullName}`;

  return (
    <Card className='group overflow-hidden border-border/60 bg-card/60 transition-all duration-200 hover:border-primary/20 hover:shadow-md pt-0'>
      <div
        className='h-1.5 w-full'
        style={color ? { backgroundColor: color } : { background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)' }}
      />
      <CardContent className='p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <h3
              className='truncate text-base font-semibold text-foreground'
              style={color ? { color } : undefined}
              title={displayName}
            >
              {displayName}
            </h3>
            <p className='mt-0.5 truncate text-sm text-muted-foreground' title={fullName}>
              {fullName}
            </p>
          </div>
          <Button variant='outline' size='icon' className='shrink-0' asChild>
            <a
              href={htmlUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-muted-foreground transition-colors hover:text-foreground'
            >
              <ExternalLink className='h-4 w-4' />
            </a>
          </Button>
        </div>

        {isPending && (
          <div className='mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted/30 py-8'>
            <Spinner className='h-5 w-5' />
            <span className='text-sm text-muted-foreground'>Loading...</span>
          </div>
        )}

        {error && (
          <div className='mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-4'>
            <p className='text-sm font-medium text-destructive'>Failed to load repository</p>
            <p className='mt-1 text-xs text-muted-foreground'>Check your connection and try again</p>
          </div>
        )}

        {repoData && !isPending && (
          <div className='mt-4 flex flex-col gap-3'>
            <div className='flex flex-wrap gap-2 text-sm text-muted-foreground'>
              <span className='inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1'>
                <GitBranch className='h-3.5 w-3.5' />
                <span className='font-mono text-xs'>{repoData.default_branch}</span>
              </span>
              {repoData.stargazers_count !== undefined && repoData.stargazers_count > 0 && (
                <span className='inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1'>
                  <Star className='h-3.5 w-3.5 fill-amber-400 text-amber-400' />
                  <span>{repoData.stargazers_count}</span>
                </span>
              )}
            </div>
            {repoData.updated_at && (
              <p className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Calendar className='h-3.5 w-3.5 shrink-0' />
                Updated {format(new Date(repoData.updated_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ManagedRepositoriesTab;
