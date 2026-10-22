'use client';

import { useState, useEffect, useRef, type ComponentProps } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { QueryError } from '@/components/query-error';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTab, TabsPanel, TabsPanels } from '@/components/animate-ui/components/base/tabs';
import { MANAGED_REPO_NAMES, REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import {
  useRepoSecrets,
  useRepoVariables,
  useCreateOrUpdateRepoSecret,
  useDeleteRepoSecret,
  useCreateRepoVariable,
  useUpdateRepoVariable,
  useDeleteRepoVariable,
  useBulkCreateOrUpdateSecrets,
  useBulkDeleteSecrets,
  useBulkCreateOrUpdateVariables,
  useBulkDeleteVariables,
} from '@/modules/github/github.query';
import { GithubActionsSecret, GithubActionsVariable } from '@/modules/github/github.type';
import { formatDistanceToNow, format } from 'date-fns';
import {
  RefreshCcw,
  Plus,
  Pencil,
  Trash2,
  Key,
  Variable,
  Loader2,
  FileUp,
  FileDown,
  CalendarClock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type SubTab = 'secrets' | 'variables';

function exportKeysAsJson({ keys, filePrefix }: { keys: string[]; filePrefix: string }) {
  const uniqueKeys = Array.from(new Set(keys.map(k => k.trim()).filter(Boolean))).sort();
  const template = Object.fromEntries(uniqueKeys.map(key => [key, '']));
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filePrefix}-template.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

type DateAgeTier = 'ok' | 'yellow' | 'amber' | 'danger';

function getDateAgeTier(date: Date): DateAgeTier {
  const ageMs = Date.now() - date.getTime();
  if (ageMs >= ONE_YEAR_MS) return 'danger';
  if (ageMs >= SIX_MONTHS_MS) return 'amber';
  // if (ageMs >= ONE_MONTH_MS) return 'yellow';
  return 'ok';
}

const DATE_AGE_STYLES: Record<
  DateAgeTier,
  { className: string; label: string; dotClass: string }
> = {
  ok: {
    className: 'text-muted-foreground',
    label: 'Recent',
    dotClass: '',
  },
  yellow: {
    className: 'text-yellow-600 dark:text-yellow-500 font-medium',
    label: 'Over 1 month',
    dotClass: 'bg-yellow-500',
  },
  amber: {
    className: 'text-amber-600 dark:text-amber-500 font-medium',
    label: 'Over 6 months — consider rotating',
    dotClass: 'bg-amber-500',
  },
  danger: {
    className: 'text-red-600 dark:text-red-400 font-medium',
    label: 'Over 1 year — rotate soon',
    dotClass: 'bg-red-500',
  },
};

function DateAgeIndicator({
  dateString,
  prefix = 'Updated',
}: {
  dateString: string;
  prefix?: string;
}) {
  const date = new Date(dateString);
  const tier = getDateAgeTier(date);
  const { className, label, dotClass } = DATE_AGE_STYLES[tier];
  const relative = formatDistanceToNow(date, { addSuffix: true });
  const exact = format(date, 'PPp');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1.5 text-xs ${className} cursor-help`}
          title={exact}
        >
          <CalendarClock className="h-3.5 w-3.5 shrink-0 opacity-80" />
          <span>{relative}</span>
          {dotClass && (
            <span
              className={`inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
              aria-hidden
            />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">{prefix}: {exact}</p>
        <p className="text-muted-foreground text-xs mt-0.5">
          {tier !== 'ok' && label}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function SecretInput(props: Omit<ComponentProps<typeof Input>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className='relative flex-1'>
      <Input {...props} type={visible ? 'text' : 'password'} className={`pr-9 ${props.className ?? ''}`} />
      <Button
        type='button'
        size='icon'
        variant='ghost'
        className='absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2'
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide value' : 'Show value'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
      </Button>
    </div>
  );
}

const SecretsAndVariablesTab = () => {
  const [subTab, setSubTab] = useState<SubTab>('secrets');
  const [selectedRepo, setSelectedRepo] = useState<string>(MANAGED_REPO_NAMES[0] ?? '');

  const selectedOwner = selectedRepo ? (selectedRepo.split('/')[0] ?? '') : '';
  const selectedRepoName = selectedRepo ? (selectedRepo.split('/')[1] ?? '') : '';
  const displayInfo = selectedRepo ? REPO_NAME_MAPPING[selectedRepo] : null;

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <Label htmlFor='secrets-repo-select' className='text-sm font-medium text-foreground whitespace-nowrap'>
            Repository
          </Label>
          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
            <SelectTrigger id='secrets-repo-select' className='h-10 w-full sm:w-[280px] border-border/80 bg-background/50'>
              <SelectValue placeholder='Select repository' />
            </SelectTrigger>
            <SelectContent>
              {MANAGED_REPO_NAMES.map(fn => (
                <SelectItem key={fn} value={fn}>
                  {REPO_NAME_MAPPING[fn]?.name ?? fn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedRepo ? (
        <Tabs value={subTab} onValueChange={v => setSubTab(v as SubTab)}>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <TabsList>
              <TabsTab value='secrets'>Secrets</TabsTab>
              <TabsTab value='variables'>Variables</TabsTab>
            </TabsList>
            <div className='flex flex-wrap gap-2'>
              {subTab === 'secrets' ? (
                <>
                  <BulkSecretsModal mode='upsert' />
                  <BulkSecretsModal mode='delete' />
                </>
              ) : (
                <>
                  <BulkVariablesModal mode='upsert' />
                  <BulkVariablesModal mode='delete' />
                </>
              )}
            </div>
          </div>

          <TabsPanels className='mt-4'>
            <TabsPanel value='secrets' className={subTab !== 'secrets' ? 'hidden' : ''}>
              {subTab === 'secrets' && (
                <RepoSecretsCard
                  owner={selectedOwner}
                  repo={selectedRepoName}
                  fullName={selectedRepo}
                  displayName={displayInfo?.name ?? selectedRepo}
                  color={displayInfo?.color}
                />
              )}
            </TabsPanel>
            <TabsPanel value='variables' className={subTab !== 'variables' ? 'hidden' : ''}>
              {subTab === 'variables' && (
                <RepoVariablesCard
                  owner={selectedOwner}
                  repo={selectedRepoName}
                  fullName={selectedRepo}
                  displayName={displayInfo?.name ?? selectedRepo}
                  color={displayInfo?.color}
                />
              )}
            </TabsPanel>
          </TabsPanels>
        </Tabs>
      ) : (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 py-16 text-center'>
          <p className='text-sm font-medium text-muted-foreground'>
            Select a repository to view and manage its secrets and variables
          </p>
        </div>
      )}
    </div>
  );
};

function RepoSecretsCard({
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
  const { data, isPending, isError, error, refetch } = useRepoSecrets(owner, repo);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<GithubActionsSecret | null>(null);

  const secrets = data?.secrets ?? [];

  return (
    <Card className='border-border/60 bg-card/60'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex flex-wrap items-center justify-between gap-2 text-lg'>
          <div className='flex items-center gap-2'>
            <Badge style={color ? { backgroundColor: color } : undefined}>{displayName}</Badge>
            <a
              href={`https://github.com/${fullName}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-muted-foreground font-normal hover:text-foreground'
            >
              {fullName}
            </a>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button size='sm' variant='outline' onClick={() => setCreateModalOpen(true)}>
              <Plus className='mr-1.5 h-4 w-4' />
              Add secret
            </Button>
            <ImportFromJsonModal
              type='secrets'
              owner={owner}
              repo={repo}
              existingNames={secrets.map(s => s.name)}
              onSuccess={refetch}
            />
            <Button
              size='sm'
              variant='outline'
              onClick={() => exportKeysAsJson({ keys: secrets.map(s => s.name), filePrefix: `${repo}-secrets` })}
              disabled={secrets.length === 0}
            >
              <FileDown className='mr-1.5 h-4 w-4' />
              Export keys JSON
            </Button>
            <Button size='sm' variant='ghost' onClick={() => refetch()} aria-label='Refresh'>
              <RefreshCcw className='h-4 w-4' />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className='flex justify-center py-8'>
            <Spinner className='h-6 w-6' />
          </div>
        )}
        {!isPending && isError && <QueryError error={error} onRetry={refetch} />}
        {!isPending && !isError && secrets.length === 0 && (
          <p className='py-6 text-center text-sm text-muted-foreground'>No secrets</p>
        )}
        {!isPending && secrets.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className='min-w-[160px]'>Last updated</TableHead>
                <TableHead className='w-[120px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map(secret => (
                <TableRow key={secret.name} className='align-top'>
                  <TableCell className='font-mono align-middle'>{secret.name}</TableCell>
                  <TableCell className='align-middle'>
                    <DateAgeIndicator dateString={secret.updated_at} prefix='Updated' />
                  </TableCell>
                  <TableCell className='align-middle'>
                    <div className='flex gap-1'>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setEditingSecret(secret)}
                        aria-label={`Edit secret ${secret.name}`}
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </Button>
                      <DeleteSecretButton owner={owner} repo={repo} name={secret.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isPending && secrets.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Over 6 months — consider rotating
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
              Over 1 year — rotate soon
            </span>
          </p>
        )}
      </CardContent>

      <CreateOrEditSecretModal
        owner={owner}
        repo={repo}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        existingName={null}
      />
      {editingSecret && (
        <CreateOrEditSecretModal
          owner={owner}
          repo={repo}
          open={!!editingSecret}
          onOpenChange={open => !open && setEditingSecret(null)}
          existingName={editingSecret.name}
        />
      )}
    </Card>
  );
}

function RepoVariablesCard({
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
  const { data, isPending, isError, error, refetch } = useRepoVariables(owner, repo);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<GithubActionsVariable | null>(null);

  const variables = data?.variables ?? [];

  return (
    <Card className='border-border/60 bg-card/60'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex flex-wrap items-center justify-between gap-2 text-lg'>
          <div className='flex items-center gap-2'>
            <Badge style={color ? { backgroundColor: color } : undefined}>{displayName}</Badge>
            <a
              href={`https://github.com/${fullName}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-muted-foreground font-normal hover:text-foreground'
            >
              {fullName}
            </a>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button size='sm' variant='outline' onClick={() => setCreateModalOpen(true)}>
              <Plus className='mr-1.5 h-4 w-4' />
              Add variable
            </Button>
            <ImportFromJsonModal
              type='variables'
              owner={owner}
              repo={repo}
              existingNames={variables.map(v => v.name)}
              onSuccess={refetch}
            />
            <Button
              size='sm'
              variant='outline'
              onClick={() => exportKeysAsJson({ keys: variables.map(v => v.name), filePrefix: 'variables' })}
              disabled={variables.length === 0}
            >
              <FileDown className='mr-1.5 h-4 w-4' />
              Export keys JSON
            </Button>
            <Button size='sm' variant='ghost' onClick={() => refetch()} aria-label='Refresh'>
              <RefreshCcw className='h-4 w-4' />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className='flex justify-center py-8'>
            <Spinner className='h-6 w-6' />
          </div>
        )}
        {!isPending && isError && <QueryError error={error} onRetry={refetch} />}
        {!isPending && !isError && variables.length === 0 && (
          <p className='py-6 text-center text-sm text-muted-foreground'>No variables</p>
        )}
        {!isPending && variables.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className='min-w-[160px]'>Last updated</TableHead>
                <TableHead className='w-[120px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variables.map(v => (
                <TableRow key={v.name} className='align-top'>
                  <TableCell className='font-mono align-middle'>{v.name}</TableCell>
                  <TableCell className='font-mono text-muted-foreground align-middle max-w-[200px] truncate'>
                    {v.value || '(empty)'}
                  </TableCell>
                  <TableCell className='align-middle'>
                    <DateAgeIndicator dateString={v.updated_at} prefix='Updated' />
                  </TableCell>
                  <TableCell className='align-middle'>
                    <div className='flex gap-1'>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setEditingVariable(v)}
                        aria-label={`Edit variable ${v.name}`}
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </Button>
                      <DeleteVariableButton owner={owner} repo={repo} name={v.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isPending && variables.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Over 6 months — consider rotating
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
              Over 1 year — rotate soon
            </span>
          </p>
        )}
      </CardContent>

      <CreateOrEditVariableModal
        owner={owner}
        repo={repo}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        existingVariable={null}
      />
      {editingVariable && (
        <CreateOrEditVariableModal
          owner={owner}
          repo={repo}
          open={!!editingVariable}
          onOpenChange={open => !open && setEditingVariable(null)}
          existingVariable={editingVariable}
        />
      )}
    </Card>
  );
}

function CreateOrEditSecretModal({
  owner,
  repo,
  open,
  onOpenChange,
  existingName,
}: {
  owner: string;
  repo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingName: string | null;
}) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const mutate = useCreateOrUpdateRepoSecret();

  useEffect(() => {
    if (open) {
      setName(existingName ?? '');
      setValue('');
    }
  }, [open, existingName]);

  const isEdit = !!existingName;

  const handleSubmit = async () => {
    const finalName = isEdit ? existingName : name.trim();
    if (!finalName || !value) return;
    try {
      await mutate.mutateAsync({ owner, repo, name: finalName, value });
    } catch {
      return; // error toast is handled by the mutation hook
    }
    setValue('');
    if (!isEdit) setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Update secret' : 'Create secret'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Enter the new value for the secret. The name cannot be changed.'
              : 'Create a new repository secret. The value will be encrypted.'}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='secret-name'>Name</Label>
            <Input
              id='secret-name'
              value={isEdit ? existingName : name}
              onChange={e => setName(e.target.value)}
              placeholder='SECRET_NAME'
              disabled={isEdit}
              className='font-mono'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='secret-value'>Value</Label>
            <SecretInput
              id='secret-value'
              value={value}
              onChange={e => setValue(e.target.value)}
              autoComplete='off'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!value || mutate.isPending}>
            {mutate.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateOrEditVariableModal({
  owner,
  repo,
  open,
  onOpenChange,
  existingVariable,
}: {
  owner: string;
  repo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingVariable: GithubActionsVariable | null;
}) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const createMutate = useCreateRepoVariable();

  useEffect(() => {
    if (open) {
      setName(existingVariable?.name ?? '');
      setValue(existingVariable?.value ?? '');
    }
  }, [open, existingVariable]);
  const updateMutate = useUpdateRepoVariable();

  const isEdit = !!existingVariable;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (isEdit) {
        await updateMutate.mutateAsync({ owner, repo, name: existingVariable.name, value });
      } else {
        await createMutate.mutateAsync({ owner, repo, name: name.trim(), value });
      }
    } catch {
      return; // error toast is handled by the mutation hook
    }
    setName('');
    setValue('');
    onOpenChange(false);
  };

  const isPending = createMutate.isPending || updateMutate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Update variable' : 'Create variable'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the variable value. The name cannot be changed.' : 'Create a new repository variable.'}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='var-name'>Name</Label>
            <Input
              id='var-name'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='VARIABLE_NAME'
              disabled={isEdit}
              className='font-mono'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='var-value'>Value</Label>
            <Input id='var-value' value={value} onChange={e => setValue(e.target.value)} placeholder='value' />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ImportItem = { name: string; value: string; action: 'create' | 'update' };

function parseJsonToItems(json: unknown): { name: string; value: string }[] {
  if (!json || typeof json !== 'object') return [];
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.items)) {
    return obj.items
      .filter((x): x is { name?: string; value?: unknown } => x && typeof x === 'object')
      .map(x => ({
        name: String(x.name ?? '').trim(),
        value: x.value != null ? String(x.value) : '',
      }))
      .filter(x => x.name);
  }
  return Object.entries(obj)
    .map(([name, value]) => ({
      name: name.trim(),
      value: value != null ? String(value) : '',
    }))
    .filter(x => x.name);
}

function ImportFromJsonModal({
  type,
  owner,
  repo,
  existingNames,
  onSuccess,
}: {
  type: 'secrets' | 'variables';
  owner: string;
  repo: string;
  existingNames: string[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<ImportItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [parseError, setParseError] = useState<string | null>(null);
  const [step, setStep] = useState<'file' | 'preview'>('file');
  const [showValues, setShowValues] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkCreateOrUpdateSecrets = useBulkCreateOrUpdateSecrets();
  const bulkCreateOrUpdateVariables = useBulkCreateOrUpdateVariables();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setParseError(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const json = JSON.parse(text) as unknown;
        const raw = parseJsonToItems(json);
        if (raw.length === 0) {
          setParseError(
            'No valid name/value pairs found. Expected format: { "KEY": "value" } or { "items": [{ "name": "X", "value": "Y" }] }'
          );
          return;
        }
        const items: ImportItem[] = raw.map(({ name, value }) => ({
          name,
          value,
          action: existingNames.includes(name) ? 'update' : 'create',
        }));
        setPreviewItems(items);
        setSelected(new Set(items.map((_, i) => i)));
        setStep('preview');
      } catch {
        setParseError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const resetModal = () => {
    setStep('file');
    setPreviewItems([]);
    setSelected(new Set());
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetModal();
    setOpen(next);
  };

  const toggleItem = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const removeItem = (i: number) => {
    setPreviewItems(p => p.filter((_, idx) => idx !== i));
    setSelected(s => new Set([...s].filter(x => x !== i).map(x => (x > i ? x - 1 : x))));
  };

  const handleApply = async () => {
    const toApply = previewItems.filter((_, i) => selected.has(i));
    if (toApply.length === 0) return;
    try {
      if (type === 'secrets') {
        const items = toApply.map(item => ({ owner, repo, name: item.name, value: item.value }));
        await bulkCreateOrUpdateSecrets.mutateAsync(items);
      } else {
        const items = toApply.map(item => ({ owner, repo, name: item.name, value: item.value }));
        await bulkCreateOrUpdateVariables.mutateAsync(items);
      }
      onSuccess?.();
      handleOpenChange(false);
    } catch {
      // Error toast is handled by the mutation hook
    }
  };

  const isPending = bulkCreateOrUpdateSecrets.isPending || bulkCreateOrUpdateVariables.isPending;
  const selectedCount = previewItems.filter((_, i) => selected.has(i)).length;

  return (
    <>
      <Button size='sm' variant='outline' onClick={() => setOpen(true)}>
        <FileUp className='mr-1.5 h-4 w-4' />
        Import Values from JSON
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className='sm:max-w-5xl max-h-[80vh] overflow-y-auto flex flex-col'>
          <DialogHeader>
            <DialogTitle>Import {type} from JSON</DialogTitle>
            <DialogDescription>
              Upload a JSON file with name/value pairs. Preview and select which items to import before saving. Expected
              format: {'{'} &quot;KEY&quot;: &quot;value&quot; {'}'} or {'{'} &quot;items&quot;: [{'{'}
              &quot;name&quot;: &quot;X&quot;, &quot;value&quot;: &quot;Y&quot; {'}'}]{'}'}
            </DialogDescription>
          </DialogHeader>

          {step === 'file' && (
            <div className='py-4'>
              <input
                ref={fileInputRef}
                type='file'
                accept='.json,application/json'
                onChange={handleFileChange}
                className='block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90'
              />
              {parseError && <p className='mt-2 text-sm text-destructive'>{parseError}</p>}
            </div>
          )}

          {step === 'preview' && (
            <div className='flex flex-1 flex-col gap-4 overflow-hidden'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <Button variant='ghost' size='sm' onClick={() => setStep('file')}>
                  Choose different file
                </Button>
                <div className='flex items-center gap-2'>
                  {type === 'secrets' && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowValues(v => !v)}
                      aria-pressed={showValues}
                    >
                      {showValues ? <EyeOff className='mr-1.5 h-4 w-4' /> : <Eye className='mr-1.5 h-4 w-4' />}
                      {showValues ? 'Hide values' : 'Show values'}
                    </Button>
                  )}
                  <span className='text-sm text-muted-foreground'>
                    {selectedCount} of {previewItems.length} selected
                  </span>
                </div>
              </div>
              <div className='min-h-0 flex-1 overflow-auto rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-10'></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className='w-24'>Action</TableHead>
                      <TableHead className='w-12'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(i)}
                            onCheckedChange={() => toggleItem(i)}
                            aria-label={`Select ${item.name}`}
                          />
                        </TableCell>
                        <TableCell className='font-mono'>{item.name}</TableCell>
                        <TableCell className='max-w-[200px] truncate font-mono text-muted-foreground'>
                          {!item.value ? '(empty)' : type === 'secrets' && !showValues ? '••••••••' : item.value}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.action === 'create' ? 'default' : 'secondary'}>{item.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='h-8 w-8'
                            onClick={() => removeItem(i)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            {step === 'preview' ? (
              <>
                <Button variant='outline' onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApply} disabled={selectedCount === 0 || isPending}>
                  {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Apply {selectedCount} {type}
                </Button>
              </>
            ) : (
              <Button variant='outline' onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeleteSecretButton({ owner, repo, name }: { owner: string; repo: string; name: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutate = useDeleteRepoSecret();

  return (
    <>
      <Button
        size='sm'
        variant='ghost'
        className='text-destructive hover:text-destructive'
        onClick={() => setConfirmOpen(true)}
        aria-label={`Delete secret ${name}`}
      >
        <Trash2 className='h-3.5 w-3.5' />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title='Delete secret'
        description={`Are you sure you want to delete "${name}"? This cannot be undone.`}
        onConfirm={() => mutate.mutateAsync({ owner, repo, name })}
      />
    </>
  );
}

function DeleteVariableButton({ owner, repo, name }: { owner: string; repo: string; name: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutate = useDeleteRepoVariable();

  return (
    <>
      <Button
        size='sm'
        variant='ghost'
        className='text-destructive hover:text-destructive'
        onClick={() => setConfirmOpen(true)}
        aria-label={`Delete variable ${name}`}
      >
        <Trash2 className='h-3.5 w-3.5' />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title='Delete variable'
        description={`Are you sure you want to delete "${name}"? This cannot be undone.`}
        onConfirm={() => mutate.mutateAsync({ owner, repo, name })}
      />
    </>
  );
}

type BulkSecretsModalProps = { mode: 'upsert' | 'delete' };

function BulkSecretsModal({ mode }: BulkSecretsModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<{ name: string; value: string }[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bulkUpsert = useBulkCreateOrUpdateSecrets();
  const bulkDelete = useBulkDeleteSecrets();

  const toggleRepo = (fullName: string) => {
    setSelectedRepos(prev => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });
  };

  const addRow = () => setRows(r => [...r, { name: '', value: '' }]);
  const updateRow = (i: number, field: 'name' | 'value', val: string) => {
    setRows(r => {
      const n = [...r];
      n[i] = { ...n[i], [field]: val };
      return n;
    });
  };
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (mode === 'upsert') {
      const items = rows
        .filter(r => r.name.trim() && r.value)
        .flatMap(r =>
          Array.from(selectedRepos).map(fullName => {
            const [owner, repo] = fullName.split('/');
            return { owner, repo, name: r.name.trim(), value: r.value };
          })
        );
      if (items.length === 0) return;
      await bulkUpsert.mutateAsync(items);
    } else {
      const items = rows
        .filter(r => r.name.trim())
        .flatMap(r =>
          Array.from(selectedRepos).map(fullName => {
            const [owner, repo] = fullName.split('/');
            return { owner, repo, name: r.name.trim() };
          })
        );
      if (items.length === 0) return;
      await bulkDelete.mutateAsync(items);
    }
    setOpen(false);
    setRows([]);
    setSelectedRepos(new Set());
  };

  const isPending = bulkUpsert.isPending || bulkDelete.isPending;
  const canSubmit =
    selectedRepos.size > 0 &&
    (mode === 'upsert' ? rows.some(r => r.name.trim() && r.value) : rows.some(r => r.name.trim()));

  return (
    <>
      <Button size='sm' variant='outline' onClick={() => setOpen(true)}>
        {mode === 'upsert' ? (
          <>
            <Key className='mr-1.5 h-4 w-4' />
            Bulk add/update secrets
          </>
        ) : (
          <>
            <Trash2 className='mr-1.5 h-4 w-4' />
            Bulk delete secrets
          </>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{mode === 'upsert' ? 'Bulk add/update secrets' : 'Bulk delete secrets'}</DialogTitle>
            <DialogDescription>
              {mode === 'upsert'
                ? 'Select repositories and add name/value pairs. Each pair will be applied to all selected repos.'
                : 'Select repositories and secret names to delete.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label className='mb-2 block'>Repositories</Label>
              <div className='flex flex-wrap gap-2'>
                {MANAGED_REPO_NAMES.map(fullName => {
                  const info = REPO_NAME_MAPPING[fullName];
                  return (
                    <label
                      key={fullName}
                      className='flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted/50'
                    >
                      <Checkbox checked={selectedRepos.has(fullName)} onCheckedChange={() => toggleRepo(fullName)} />
                      <span>{info?.name ?? fullName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <Label>{mode === 'upsert' ? 'Name / Value' : 'Secret names'}</Label>
                <Button size='sm' variant='ghost' onClick={addRow} aria-label='Add row'>
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              <div className='max-h-48 space-y-2 overflow-y-auto'>
                {rows.map((row, i) => (
                  <div key={i} className='flex gap-2'>
                    <Input
                      placeholder='NAME'
                      aria-label='Name'
                      value={row.name}
                      onChange={e => updateRow(i, 'name', e.target.value)}
                      className='font-mono'
                    />
                    {mode === 'upsert' && (
                      <SecretInput
                        placeholder='value'
                        aria-label='Value'
                        autoComplete='off'
                        value={row.value}
                        onChange={e => updateRow(i, 'value', e.target.value)}
                      />
                    )}
                    <Button size='icon' variant='ghost' onClick={() => removeRow(i)} aria-label='Remove row'>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={mode === 'delete' ? 'destructive' : 'default'}
              onClick={() => setConfirmOpen(true)}
              disabled={!canSubmit || isPending}
            >
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={mode === 'delete' ? 'Delete secrets across repositories?' : 'Apply secrets across repositories?'}
        description={(() => {
          const count = rows.filter(r => mode === 'delete' ? r.name.trim() : r.name.trim() && r.value).length;
          const repoNames = Array.from(selectedRepos)
            .map(fn => REPO_NAME_MAPPING[fn]?.name ?? fn)
            .join(', ');
          return mode === 'delete'
            ? `Delete ${count} secret(s) from ${selectedRepos.size} repo(s): ${repoNames}. This cannot be undone.`
            : `Create or overwrite ${count} secret(s) in ${selectedRepos.size} repo(s): ${repoNames}. Existing values with the same name will be replaced.`;
        })()}
        confirmLabel={mode === 'delete' ? 'Delete' : 'Apply'}
        variant={mode === 'delete' ? 'destructive' : 'default'}
        onConfirm={handleSubmit}
      />
    </>
  );
}

type BulkVariablesModalProps = { mode: 'upsert' | 'delete' };

function BulkVariablesModal({ mode }: BulkVariablesModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<{ name: string; value: string }[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bulkUpsert = useBulkCreateOrUpdateVariables();
  const bulkDelete = useBulkDeleteVariables();

  const toggleRepo = (fullName: string) => {
    setSelectedRepos(prev => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });
  };

  const addRow = () => setRows(r => [...r, { name: '', value: '' }]);
  const updateRow = (i: number, field: 'name' | 'value', val: string) => {
    setRows(r => {
      const n = [...r];
      n[i] = { ...n[i], [field]: val };
      return n;
    });
  };
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (mode === 'upsert') {
      const items = rows
        .filter(r => r.name.trim() && r.value !== undefined)
        .flatMap(r =>
          Array.from(selectedRepos).map(fullName => {
            const [owner, repo] = fullName.split('/');
            return { owner, repo, name: r.name.trim(), value: r.value };
          })
        );
      if (items.length === 0) return;
      await bulkUpsert.mutateAsync(items);
    } else {
      const items = rows
        .filter(r => r.name.trim())
        .flatMap(r =>
          Array.from(selectedRepos).map(fullName => {
            const [owner, repo] = fullName.split('/');
            return { owner, repo, name: r.name.trim() };
          })
        );
      if (items.length === 0) return;
      await bulkDelete.mutateAsync(items);
    }
    setOpen(false);
    setRows([]);
    setSelectedRepos(new Set());
  };

  const isPending = bulkUpsert.isPending || bulkDelete.isPending;
  const canSubmit =
    selectedRepos.size > 0 && (mode === 'upsert' ? rows.some(r => r.name.trim()) : rows.some(r => r.name.trim()));

  return (
    <>
      <Button size='sm' variant='outline' onClick={() => setOpen(true)}>
        {mode === 'upsert' ? (
          <>
            <Variable className='mr-1.5 h-4 w-4' />
            Bulk add/update variables
          </>
        ) : (
          <>
            <Trash2 className='mr-1.5 h-4 w-4' />
            Bulk delete variables
          </>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{mode === 'upsert' ? 'Bulk add/update variables' : 'Bulk delete variables'}</DialogTitle>
            <DialogDescription>
              {mode === 'upsert'
                ? 'Select repositories and add name/value pairs. Each pair will be applied to all selected repos.'
                : 'Select repositories and variable names to delete.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label className='mb-2 block'>Repositories</Label>
              <div className='flex flex-wrap gap-2'>
                {MANAGED_REPO_NAMES.map(fullName => {
                  const info = REPO_NAME_MAPPING[fullName];
                  return (
                    <label
                      key={fullName}
                      className='flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted/50'
                    >
                      <Checkbox checked={selectedRepos.has(fullName)} onCheckedChange={() => toggleRepo(fullName)} />
                      <span>{info?.name ?? fullName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <Label>{mode === 'upsert' ? 'Name / Value' : 'Variable names'}</Label>
                <Button size='sm' variant='ghost' onClick={addRow} aria-label='Add row'>
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              <div className='max-h-48 space-y-2 overflow-y-auto'>
                {rows.map((row, i) => (
                  <div key={i} className='flex gap-2'>
                    <Input
                      placeholder='NAME'
                      aria-label='Name'
                      value={row.name}
                      onChange={e => updateRow(i, 'name', e.target.value)}
                      className='font-mono'
                    />
                    {mode === 'upsert' && (
                      <Input
                        placeholder='value'
                        aria-label='Value'
                        value={row.value}
                        onChange={e => updateRow(i, 'value', e.target.value)}
                      />
                    )}
                    <Button size='icon' variant='ghost' onClick={() => removeRow(i)} aria-label='Remove row'>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={mode === 'delete' ? 'destructive' : 'default'}
              onClick={() => setConfirmOpen(true)}
              disabled={!canSubmit || isPending}
            >
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={mode === 'delete' ? 'Delete variables across repositories?' : 'Apply variables across repositories?'}
        description={(() => {
          const count = rows.filter(r => mode === 'delete' ? r.name.trim() : r.name.trim()).length;
          const repoNames = Array.from(selectedRepos)
            .map(fn => REPO_NAME_MAPPING[fn]?.name ?? fn)
            .join(', ');
          return mode === 'delete'
            ? `Delete ${count} variable(s) from ${selectedRepos.size} repo(s): ${repoNames}. This cannot be undone.`
            : `Create or overwrite ${count} variable(s) in ${selectedRepos.size} repo(s): ${repoNames}. Existing values with the same name will be replaced.`;
        })()}
        confirmLabel={mode === 'delete' ? 'Delete' : 'Apply'}
        variant={mode === 'delete' ? 'destructive' : 'default'}
        onConfirm={handleSubmit}
      />
    </>
  );
}

export default SecretsAndVariablesTab;
