'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppRelease, AppReleaseStatus, ComponentRelease } from '@/modules/change-log/change-log.model';
import { useGetInfiniteAllComponentReleases, useUpdateAppRelease } from '@/modules/change-log/change-log.query';
import { UpdateAppReleaseBody } from '@/modules/change-log/change-log.type';
import { format } from 'date-fns';
import { Calendar, Tag, FileText, Package, CheckCircle2, Clock, Edit3, Eye, RefreshCcw, Layers, X } from 'lucide-react';
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

const SectionTitle = ({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Package;
  title: string;
  children?: React.ReactNode;
}) => (
  <div className='flex items-center justify-between gap-2'>
    <div className='flex items-center gap-2'>
      <div className='flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary'>
        <Icon className='size-4' />
      </div>
      <h3 className='text-base font-semibold'>{title}</h3>
    </div>
    {children}
  </div>
);

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
        <div className='flex items-center justify-between w-full gap-2'>
          <div className='flex items-center gap-2 min-w-0'>
            <Badge
              className='shrink-0'
              style={{ backgroundColor: REPO_NAME_MAPPING?.[componentRelease.repoName]?.color }}
            >
              {REPO_NAME_MAPPING?.[componentRelease.repoName]?.name || componentRelease.repoName}
            </Badge>
            <div className='font-semibold text-sm'>v{componentRelease.repoVersion}</div>
            <div className='text-xs text-muted-foreground truncate'>
              {format(new Date(componentRelease.createdOn || componentRelease.releaseDate), 'dd/MM/yyyy - HH:mm')}
            </div>
            {!!componentRelease.appReleases?.length && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant='secondary' className='text-xs'>
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
            <DialogTrigger
              aria-label='View component release'
              className='shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
            >
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

  const selectedIds = watch('componentReleaseIds') || [];
  // Fall back to the release's own components so selections outside the loaded pages still show
  const knownComponents = new Map<number, ComponentRelease>();
  [...(selectedRelease.componentReleases || []), ...componentReleases].forEach(
    cr => cr && knownComponents.set(cr.id, cr)
  );
  const selectedComponents = selectedIds.map(id => knownComponents.get(id)).filter(Boolean) as ComponentRelease[];

  const tags = (watch('tags') || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  const content = watch('content');
  const generateContent = watch('generateContent');

  return (
    <div className='overflow-auto'>
      {isUpdatingAppRelease && (
        <div className='flex-1 w-full h-full flex items-center justify-center z-10 absolute inset-0 bg-black/30 backdrop-blur-[1px] rounded-lg'>
          <div className='text-center text-white'>
            <LoadingAnimation className='w-50 h-50' />
            <p className='text-sm font-medium'>Saving changes...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} id='update-app-release-form' className='space-y-5'>
        {/* Basic Information Section */}
        <Card className='shadow-sm p-0'>
          <CardContent className='p-5 space-y-5'>
            <SectionTitle icon={Package} title='Basic Information' />

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='appVersion' className='flex items-center gap-2 text-sm font-medium'>
                  <Package className='w-4 h-4 text-muted-foreground' />
                  App Version
                </Label>
                <Input id='appVersion' type='text' {...register('appVersion')} placeholder='e.g., 1.0.0' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='releaseDate' className='flex items-center gap-2 text-sm font-medium'>
                  <Calendar className='w-4 h-4 text-muted-foreground' />
                  Release Date
                </Label>
                <Input {...register('releaseDate')} id='releaseDate' type='date' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='status' className='flex items-center gap-2 text-sm font-medium'>
                  <CheckCircle2 className='w-4 h-4 text-muted-foreground' />
                  Status
                </Label>
                <Controller
                  control={control}
                  name='status'
                  render={({ field }) => (
                    <Select defaultValue={field?.value} onValueChange={field.onChange}>
                      <SelectTrigger id='status' className='w-full'>
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
            </div>

            <div className='space-y-2'>
              <Label htmlFor='tags' className='flex items-center gap-2 text-sm font-medium'>
                <Tag className='w-4 h-4 text-muted-foreground' />
                Tags
                <span className='text-xs font-normal text-muted-foreground'>(comma separated)</span>
              </Label>
              <Input id='tags' type='text' {...register('tags')} placeholder='feature, bugfix, enhancement' />
              {!!tags.length && (
                <div className='flex flex-wrap gap-1.5 pt-1'>
                  {tags.map((tag, idx) => (
                    <Badge key={idx} variant='outline' className='text-xs'>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Logs Section */}
        <Card className='shadow-sm p-0'>
          <CardContent className='p-5 space-y-4'>
            <SectionTitle icon={FileText} title='Change Logs' />

            <label
              htmlFor='generateContent'
              className='flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3 cursor-pointer'
            >
              <div className='flex items-start gap-3'>
                <RefreshCcw className='w-4 h-4 mt-0.5 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Re-generate content</p>
                  <p className='text-xs text-muted-foreground'>
                    {generateContent
                      ? 'Change logs will be re-generated when you save'
                      : 'Keep the change logs written below'}
                  </p>
                </div>
              </div>
              <Controller
                control={control}
                name='generateContent'
                render={({ field }) => (
                  <Switch id='generateContent' checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </label>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='content' className='flex items-center gap-2 text-sm font-medium'>
                  <Edit3 className='w-4 h-4 text-muted-foreground' />
                  Markdown Editor
                </Label>
                <Textarea
                  id='content'
                  {...register('content')}
                  className='w-full h-[350px] resize-none font-mono text-sm custom-scrollbar'
                  placeholder='Write your change logs in markdown format...'
                />
              </div>

              <div className='space-y-2'>
                <Label className='flex items-center gap-2 text-sm font-medium'>
                  <Eye className='w-4 h-4 text-muted-foreground' />
                  Preview
                </Label>
                <div className='markdown-prose max-w-none p-4 border rounded-md bg-muted/30 h-[350px] overflow-y-auto custom-scrollbar'>
                  {content ? (
                    <Markdown>{content}</Markdown>
                  ) : (
                    <div className='flex flex-col items-center justify-center h-full text-muted-foreground text-sm'>
                      <FileText className='w-8 h-8 mb-2 opacity-40' />
                      Preview will appear here...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Releases Section */}
        <Card className='shadow-sm p-0'>
          <CardContent className='p-5 space-y-4'>
            <SectionTitle icon={Layers} title='Component Releases'>
              <Badge variant='secondary' className='text-xs'>
                {selectedIds.length} selected
              </Badge>
            </SectionTitle>

            <div className='rounded-lg border border-dashed bg-muted/30 p-3'>
              {!selectedComponents.length ? (
                <p className='text-sm text-muted-foreground text-center py-1'>
                  No components selected. Pick from the list below.
                </p>
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {selectedComponents.map(component => (
                    <Badge
                      key={component.id}
                      className='text-xs gap-1 pr-1'
                      style={{ backgroundColor: REPO_NAME_MAPPING?.[component.repoName]?.color }}
                    >
                      {REPO_NAME_MAPPING?.[component.repoName]?.name || component.repoName} - v{component.repoVersion}
                      <button
                        type='button'
                        aria-label={`Remove ${component.repoName} v${component.repoVersion}`}
                        className='rounded-sm p-0.5 hover:bg-black/20 transition-colors'
                        onClick={() =>
                          setValue(
                            'componentReleaseIds',
                            selectedIds.filter(id => id !== component.id)
                          )
                        }
                      >
                        <X className='size-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <InfiniteScrollList
              value={selectedIds.map(id => id.toString())}
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default UpdateAppRelease;
