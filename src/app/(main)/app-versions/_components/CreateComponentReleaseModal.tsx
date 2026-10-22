'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EndpointName } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { MANAGED_REPO_NAMES, REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { useCreateComponentRelease } from '@/modules/change-log/change-log.query';
import { CreateComponentReleaseBody } from '@/modules/change-log/change-log.type';
import { removeVFromVersion } from '@/modules/change-log/change-log.util';
import { Calendar, CheckCircle2, FileText, GitBranch, Package, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Markdown from '@/components/safe-markdown';
import { format } from 'date-fns';

interface CreateComponentReleaseModalProps {
  endpoint: EndpointName;
}

const CreateComponentReleaseModal = ({ endpoint }: CreateComponentReleaseModalProps) => {
  const [open, setOpen] = useState(false);

  const { mutateAsync: createComponentRelease, isPending } = useCreateComponentRelease(endpoint);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateComponentReleaseBody>({
    defaultValues: {
      repoName: '',
      repoVersion: '',
      releaseDate: format(new Date(), 'yyyy-MM-dd'),
      content: '',
    },
  });

  const repoName = watch('repoName');
  const repoVersion = watch('repoVersion');
  const content = watch('content');

  const onSubmit = async (data: CreateComponentReleaseBody) => {
    if (!data.repoName?.trim()) {
      toast.error('Please select a repository');
      return;
    }
    if (!data.repoVersion?.trim()) {
      toast.error('Please enter a version number');
      return;
    }
    if (!data.content?.trim()) {
      toast.error('Please enter change logs');
      return;
    }

    try {
      await createComponentRelease({
        ...data,
        repoName: data.repoName,
        repoVersion: removeVFromVersion(data.repoVersion),
        releaseDate: data.releaseDate ? new Date(data.releaseDate).toISOString() : new Date().toISOString(),
        content: data.content,
      });

      toast.success('Repository version created successfully!');
      setOpen(false);
    } catch {
      toast.error('Failed to create repository version');
    }
  };

  useEffect(() => {
    if (open) {
      reset({
        repoName: '',
        repoVersion: '',
        releaseDate: format(new Date(), 'yyyy-MM-dd'),
        content: '',
      });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <Plus className='w-4 h-4' />
          Create Repository Version
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className='bg-black/40 backdrop-blur-sm' />
        <DialogContent className='overflow-hidden w-[700px] max-w-[90vw] max-h-[90vh] p-0 gap-0'>
          <DialogHeader className='p-6 pb-4 bg-gradient-to-br from-primary/5 to-transparent'>
            <DialogTitle className='text-2xl flex items-center gap-2'>
              <Plus className='w-6 h-6 text-primary' />
              Create Repository Version
            </DialogTitle>
          </DialogHeader>

          <div className='overflow-y-auto max-h-[calc(90vh-180px)] px-6 pb-6'>
            <form id='createComponentReleaseForm' onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              {/* Repository Selection */}
              <div className='space-y-2'>
                <Label htmlFor='repoName' className='text-base font-semibold flex items-center gap-2'>
                  <GitBranch className='w-4 h-4' />
                  Repository
                  <span className='text-destructive'>*</span>
                </Label>
                <Select value={repoName || undefined} onValueChange={value => setValue('repoName', value)}>
                  <SelectTrigger
                    id='repoName'
                    className={cn('h-11', errors.repoName && 'border-destructive focus-visible:ring-destructive')}
                  >
                    <SelectValue placeholder='Select a repository...' />
                  </SelectTrigger>
                  <SelectContent>
                    {MANAGED_REPO_NAMES.map(repo => (
                      <SelectItem key={repo} value={repo}>
                        <div className='flex items-center gap-2'>
                          <Badge style={{ backgroundColor: REPO_NAME_MAPPING?.[repo]?.color }}>
                            {REPO_NAME_MAPPING?.[repo]?.name || repo}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Version Input */}
              <div className='space-y-2'>
                <Label htmlFor='repoVersion' className='text-base font-semibold flex items-center gap-2'>
                  <Package className='w-4 h-4' />
                  Version
                  <span className='text-destructive'>*</span>
                </Label>
                <Input
                  {...register('repoVersion', { required: true })}
                  id='repoVersion'
                  placeholder='e.g., 1.0.0'
                  className={cn(
                    'text-lg font-mono h-11',
                    errors.repoVersion && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {repoVersion && (
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <CheckCircle2 className='w-3 h-3' />
                    Version: <span className='font-mono font-semibold'>v{removeVFromVersion(repoVersion)}</span>
                  </p>
                )}
              </div>

              {/* Release Date */}
              <div className='space-y-2'>
                <Label htmlFor='releaseDate' className='text-base font-semibold flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Release Date
                </Label>
                <Input {...register('releaseDate')} id='releaseDate' type='date' className='h-11' />
              </div>

              {/* Change Logs */}
              <div className='space-y-3'>
                <Label className='text-base font-semibold flex items-center gap-2'>
                  <FileText className='w-4 h-4' />
                  Change Logs
                  <span className='text-destructive'>*</span>
                </Label>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-muted-foreground'>Markdown Editor</Label>
                    </div>
                    <Textarea
                      {...register('content', { required: true })}
                      className={cn(
                        'w-full h-[200px] font-mono text-sm border-2 focus:border-primary transition-colors custom-scrollbar',
                        errors.content && 'border-destructive focus-visible:ring-destructive'
                      )}
                      placeholder='Write your change logs in markdown format...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-muted-foreground'>Preview</Label>
                    <Card className='border-2 p-0'>
                      <CardContent className='p-0'>
                        <div className='markdown-prose max-w-none p-4 bg-muted/30 rounded-lg h-[200px] overflow-y-auto custom-scrollbar'>
                          {content ? (
                            <Markdown>{content}</Markdown>
                          ) : (
                            <div className='flex items-center justify-center h-full text-muted-foreground text-sm'>
                              Preview will appear here...
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <DialogFooter className='flex flex-row justify-end gap-3 p-6 pt-4 border-t bg-muted/20'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type='submit'
              form='createComponentReleaseForm'
              disabled={isPending}
              className='gap-2 min-w-[120px]'
            >
              {isPending ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className='w-4 h-4' />
                  Create Release
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default CreateComponentReleaseModal;
