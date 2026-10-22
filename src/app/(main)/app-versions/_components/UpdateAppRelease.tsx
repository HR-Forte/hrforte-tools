'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppRelease, AppReleaseStatus } from '@/modules/change-log/change-log.model';
import { useGetInfiniteAllComponentReleases, useUpdateAppRelease } from '@/modules/change-log/change-log.query';
import { UpdateAppReleaseBody } from '@/modules/change-log/change-log.type';
import { format } from 'date-fns';
import {
  Calendar,
  Tag,
  FileText,
  Package,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Loader2,
  RefreshCcw,
  WifiSyncIcon,
} from 'lucide-react';
import Markdown from '@/components/safe-markdown';
import { Controller, useForm } from 'react-hook-form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EndpointName } from '@/lib/api/types';
import InfiniteScrollList from '@/components/infinite-scroll-list';
import { REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ViewComponentRelease from './ViewComponentRelease';
import { useState } from 'react';
import { removeVFromVersion } from '@/modules/change-log/change-log.util';
import dynamic from 'next/dynamic';

// Load the player and its 30KB animation JSON only when the saving overlay is shown
const LoadingAnimation = dynamic(
  async () => {
    const [{ default: Lottie }, { default: animationData }] = await Promise.all([
      import('lottie-react'),
      import('@/assets/lottie/hr-forte-loading.json'),
    ]);
    const Animation = ({ className }: { className?: string }) => (
      <Lottie animationData={animationData} className={className} />
    );
    return Animation;
  },
  { ssr: false }
);
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

type UpdateAppReleaseFormData = UpdateAppReleaseBody & { generateContent?: boolean };

type UpdateAppReleaseProps = {
  selectedRelease: AppRelease | null;
  setIsDialogOpen: (open: boolean) => void;
  endpoint: EndpointName;
};

const UpdateAppRelease = ({ selectedRelease, setIsDialogOpen, endpoint }: UpdateAppReleaseProps) => {
  const [componentReleasesSearch, setComponentReleasesSearch] = useState('');
  const {
    data: componentReleasesPages,
    fetchNextPage: fetchNextComponentReleasesPage,
    hasNextPage: hasMoreComponentReleases,
    isLoading: isLoadingComponentReleases,
    isFetchingNextPage: isFetchingNextComponentReleases,
  } = useGetInfiniteAllComponentReleases({ take: 20, sorts: ['createdOn.DESC'], q: componentReleasesSearch }, endpoint);

  const { mutateAsync: updateAppRelease, isPending: isUpdatingAppRelease } = useUpdateAppRelease(endpoint, {});

  const componentReleases =
    componentReleasesPages?.pages.flatMap(componentReleasePage => componentReleasePage.data) || [];

  const options =
    componentReleases?.map(componentRelease => ({
      label: (
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center gap-2'>
            <Badge style={{ backgroundColor: REPO_NAME_MAPPING?.[componentRelease.repoName]?.color }}>
              {REPO_NAME_MAPPING?.[componentRelease.repoName]?.name || componentRelease.repoName}
            </Badge>
            <div className='font-bold text-sm'>v{componentRelease.repoVersion}</div>
            <div className='text-xs text-muted-foreground'>
              {format(new Date(componentRelease.createdOn || componentRelease.releaseDate), 'dd/MM/yyyy - HH:mm')}
            </div>
            {!!componentRelease.appReleases?.length && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant='default' className='text-xs'>
                    {componentRelease.appReleases?.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>App releases: {componentRelease.appReleases?.length}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <Dialog>
            <DialogTrigger aria-label='View component release'>
              <Eye size={15} />
            </DialogTrigger>

            <DialogContent>
              <ViewComponentRelease selectedRelease={componentRelease} />
            </DialogContent>
          </Dialog>
        </div>
      ),
      value: componentRelease.id.toString(),
    })) || [];

  const { register, handleSubmit, watch, control, setValue } = useForm<UpdateAppReleaseFormData>({
    defaultValues: {
      appVersion: selectedRelease?.appVersion || '',
      // Stored as UTC midnight, so the UTC date part round-trips; guard missing dates (RangeError)
      releaseDate: selectedRelease?.releaseDate
        ? new Date(selectedRelease.releaseDate).toISOString().split('T')[0]
        : '',
      content: selectedRelease?.content || '',
      status: selectedRelease?.status || AppReleaseStatus.DRAFT,
      tags: selectedRelease?.tags || '',
      componentReleaseIds:
        selectedRelease?.componentReleases?.map(componentRelease => componentRelease?.id).filter(Boolean) || [],
      generateContent: false,
    },
  });

  const onSubmit = async (data: UpdateAppReleaseFormData) => {
    if (!selectedRelease?.id) return;

    const version = removeVFromVersion(data?.appVersion || '');

    try {
      await updateAppRelease({
        id: selectedRelease.id,
        body: {
          ...data,
          appVersion: version,
        },
        generateContent: data.generateContent,
      });

      setIsDialogOpen(false);
    } catch {
      toast.error('Failed to update app release');
    }
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
    [AppReleaseStatus.PUBLISHED]: <CheckCircle2 className='w-4 h-4' color='green' />,
    [AppReleaseStatus.DRAFT]: <Clock className='w-4 h-4' color='gray' />,
  };

  const selectedComponents = componentReleases.filter(cr => watch('componentReleaseIds')?.includes(cr.id));

  return (
    <div className='overflow-auto'>
      {isUpdatingAppRelease && (
        <div className='flex-1 w-full h-full flex items-center justify-center z-10 absolute inset-0 bg-black/20'>
          <div className='text-center text-white'>
            <LoadingAnimation className='w-50 h-50' />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} id='update-app-release-form'>
        {/* Basic Information Section */}
        <Card className='border-2 shadow-sm p-0'>
          <CardContent className='p-6 space-y-5'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-1 h-6 bg-primary rounded-full' />
              <h3 className='text-base font-semibold'>Basic Information</h3>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='appVersion' className='flex items-center gap-2 text-sm font-medium'>
                  <Package className='w-4 h-4 text-muted-foreground' />
                  App Version
                </Label>
                <Input
                  id='appVersion'
                  type='text'
                  {...register('appVersion')}
                  className='border-2 focus:border-primary transition-colors'
                  placeholder='e.g., 1.0.0'
                />
              </div>
              <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <Calendar className='w-4 h-4 text-muted-foreground' />
                  Release Date
                </Label>
                <Input {...register('releaseDate')} id='releaseDate' type='date' className='h-11' />
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <Label className='flex items-center gap-2 text-sm font-medium'>
                <CheckCircle2 className='w-4 h-4 text-muted-foreground' />
                Status
              </Label>
              <Controller
                control={control}
                name='status'
                render={({ field }) => (
                  <Select defaultValue={field?.value} onValueChange={field.onChange}>
                    <SelectTrigger className='border-2 focus:border-primary transition-colors'>
                      <SelectValue placeholder='Select a status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.values(AppReleaseStatus).map(status => (
                          <SelectItem key={status} value={status}>
                            <div className='flex items-center gap-2'>
                              {statusIcons[status]}
                              <span>{status}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className='space-y-2'>
              <div className='flex items-center gap-4'>
                <Label htmlFor='tags' className='flex items-center gap-2 text-sm font-medium'>
                  <Tag className='w-4 h-4 text-muted-foreground' />
                  Tags
                </Label>

                <div className='flex items-center gap-2'>
                  {watch('tags') && (
                    <div className='flex flex-wrap gap-1.5'>
                      {watch('tags')
                        ?.split(',')
                        .filter(t => t.trim())
                        .map((tag, idx) => (
                          <Badge key={idx} variant='outline' className='text-xs'>
                            {tag.trim()}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <Input
                id='tags'
                type='text'
                {...register('tags')}
                className='border-2 focus:border-primary transition-colors'
                placeholder='feature, bugfix, enhancement (comma separated)'
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Logs Section */}
        <Card className='border-2 shadow-sm mt-6 p-0'>
          <CardContent className='p-6 space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='w-1 h-6 bg-primary rounded-full' />
              <h3 className='text-base font-semibold'>Change Logs</h3>
            </div>

            <div className='flex items-center gap-2'>
              <Label className='flex items-center gap-2 text-sm font-medium'>
                <RefreshCcw className='w-4 h-4 text-muted-foreground' />
                Re-generate content
              </Label>
              <Controller
                control={control}
                name='generateContent'
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
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
                <Card className='border-2 p-0'>
                  <CardContent className='p-0'>
                    <div className='markdown-prose max-w-none p-4 bg-muted/30 rounded-lg h-[350px] overflow-y-auto custom-scrollbar'>
                      {watch('content') ? (
                        <Markdown>{watch('content') || ''}</Markdown>
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

        {/* Component Releases Section */}
        <Card className='border-2 shadow-sm mt-6 p-0'>
          <CardContent className='p-6 space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='w-1 h-6 bg-primary rounded-full' />
                <h3 className='text-base font-semibold'>Component Releases</h3>
              </div>
              <Badge variant='secondary' className='text-xs'>
                {watch('componentReleaseIds')?.length || 0} selected
              </Badge>
            </div>

            <div className='space-y-2'>
              <Card className='bg-muted/50 p-0'>
                <CardContent className='p-4'>
                  <p className='text-sm font-semibold mb-3'>
                    {!selectedComponents.length ? 'No Components Selected' : 'Selected Components:'}
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {selectedComponents.map(component => (
                      <Badge
                        key={component.id}
                        className='text-xs'
                        style={{ backgroundColor: REPO_NAME_MAPPING?.[component.repoName]?.color }}
                      >
                        {REPO_NAME_MAPPING?.[component.repoName]?.name || component.repoName} - v{component.repoVersion}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <InfiniteScrollList
                value={watch('componentReleaseIds')?.map(id => id.toString()) || []}
                options={options}
                onSelect={values =>
                  setValue(
                    'componentReleaseIds',
                    values.map(id => parseInt(id))
                  )
                }
                onSearchChange={setComponentReleasesSearch}
                onFetchMore={() => {
                  if (hasMoreComponentReleases) {
                    fetchNextComponentReleasesPage();
                  }
                }}
                hasMore={hasMoreComponentReleases ?? false}
                isLoading={isLoadingComponentReleases || isFetchingNextComponentReleases}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default UpdateAppRelease;
