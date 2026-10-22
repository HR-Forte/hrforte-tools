'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ComponentRelease, AppReleaseStatus } from '@/modules/change-log/change-log.model';
import { componentReleaseQueries, useUpdateComponentRelease } from '@/modules/change-log/change-log.query';
import { UpdateComponentReleaseBody } from '@/modules/change-log/change-log.type';
import { format } from 'date-fns';
import { Calendar, GitBranch, FileText, AppWindow, Edit3, CheckCircle2, Clock } from 'lucide-react';
import Markdown from '@/components/safe-markdown';
import { useForm } from 'react-hook-form';
import { queryClient } from '@/lib/query/queryClient';
import { MultiSelect } from '@/components/multi-select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EndpointName } from '@/lib/api/types';

const UpdateComponentRelease = ({
  selectedRelease,
  setIsDialogOpen,
  endpoint,
}: {
  selectedRelease: ComponentRelease | null;
  setIsDialogOpen: (open: boolean) => void;
  endpoint: EndpointName;
}) => {
  const { mutate: updateComponentRelease } = useUpdateComponentRelease(endpoint, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: componentReleaseQueries.list._def });
      setIsDialogOpen(false);
    },
  });

  const { register, handleSubmit, watch, setValue } = useForm<UpdateComponentReleaseBody>({
    defaultValues: {
      repoVersion: selectedRelease?.repoVersion,
      content: selectedRelease?.content,
    },
  });

  const onSubmit = (data: UpdateComponentReleaseBody) => {
    if (!selectedRelease?.id) return;

    updateComponentRelease({
      id: selectedRelease.id,
      body: data,
    });
  };

  if (!selectedRelease) {
    return (
      <div className='flex items-center justify-center h-64 text-muted-foreground'>
        <div className='text-center'>
          <Edit3 className='w-12 h-12 mx-auto mb-3 opacity-50' />
          <p>No release selected</p>
        </div>
      </div>
    );
  }

  const statusIcons = {
    [AppReleaseStatus.PUBLISHED]: <CheckCircle2 className='w-3 h-3' />,
    [AppReleaseStatus.DRAFT]: <Clock className='w-3 h-3' />,
  };

  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit(onSubmit)} id='update-component-release-form'>
        {/* Basic Information Section */}
        <Card className='border-2 shadow-sm'>
          <CardContent className='p-6 space-y-5'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-1 h-6 bg-primary rounded-full' />
              <h3 className='text-base font-semibold'>Repository Information</h3>
            </div>

            <div className='space-y-2'>
              <Label className='flex items-center gap-2 text-sm font-medium'>
                <GitBranch className='w-4 h-4 text-muted-foreground' />
                Repository Name
              </Label>
              <div className='flex items-center h-10 px-3 rounded-md border bg-muted/30 text-sm font-semibold'>
                {selectedRelease.repoName}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='repoVersion' className='flex items-center gap-2 text-sm font-medium'>
                  <GitBranch className='w-4 h-4 text-muted-foreground' />
                  Repository Version
                </Label>
                <Input
                  id='repoVersion'
                  type='text'
                  {...register('repoVersion')}
                  className='border-2 focus:border-primary transition-colors font-mono'
                  placeholder='e.g., 1.0.0'
                />
              </div>

              <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <Calendar className='w-4 h-4 text-muted-foreground' />
                  Release Date
                </Label>
                <div className='flex items-center h-10 px-3 rounded-md border bg-muted/30 text-sm'>
                  {format(selectedRelease.releaseDate, 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Logs Section */}
        <Card className='border-2 shadow-sm mt-6'>
          <CardContent className='p-6 space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='w-1 h-6 bg-primary rounded-full' />
              <h3 className='text-base font-semibold'>Change Logs</h3>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <FileText className='w-4 h-4 text-muted-foreground' />
                  Markdown Editor
                </Label>
                <Textarea
                  {...register('content')}
                  className='w-full h-[350px] font-mono text-sm border-2 focus:border-primary transition-colors custom-scrollbar'
                  placeholder='Write your change logs in markdown format...'
                />
              </div>

              <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <FileText className='w-4 h-4 text-muted-foreground' />
                  Preview
                </Label>
                <Card className='border-2'>
                  <CardContent className='p-0'>
                    <div className='markdown-prose max-w-none p-4 bg-muted/30 rounded-lg h-[350px] overflow-y-auto custom-scrollbar'>
                      {watch('content') ? (
                        <Markdown>{watch('content')}</Markdown>
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
          </CardContent>
        </Card>

        {/* App Releases Section */}
        <Card className='border-2 shadow-sm mt-6'>
          <CardContent className='p-6 space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='w-1 h-6 bg-primary rounded-full' />
                <h3 className='text-base font-semibold'>Associated App Releases</h3>
              </div>
              <Badge variant='secondary' className='text-xs'>
                {selectedRelease.appReleases?.length || 0} releases
              </Badge>
            </div>

            <div className='space-y-2'>
              <Label className='flex items-center gap-2 text-sm font-medium'>
                <AppWindow className='w-4 h-4 text-muted-foreground' />
                App Releases (Read-only)
              </Label>
              <div className='border-2 rounded-lg p-4 bg-muted/20 max-h-[200px] overflow-y-auto custom-scrollbar'>
                {!selectedRelease.appReleases?.length ? (
                  <div className='text-sm text-muted-foreground text-center py-4'>
                    <AppWindow className='w-8 h-8 mx-auto mb-2 opacity-40' />
                    <p>No app releases associated yet</p>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {selectedRelease.appReleases.map(appRelease => (
                      <div
                        key={appRelease.id}
                        className='flex items-center justify-between p-3 bg-background border rounded-md hover:border-primary/30 transition-colors'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='w-2 h-2 rounded-full bg-primary' />
                          <div>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='font-semibold text-sm'>v{appRelease.appVersion}</span>
                              <Badge variant='outline' className='text-xs px-2 py-0'>
                                {appRelease.status}
                              </Badge>
                            </div>
                            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                              <Calendar className='w-3 h-3' />
                              <span>{format(appRelease.releaseDate, 'MMM dd, yyyy HH:mm')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className='text-xs text-muted-foreground mt-2'>
                App releases are managed from the app release form. This list shows which app versions include this
                component.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default UpdateComponentRelease;
