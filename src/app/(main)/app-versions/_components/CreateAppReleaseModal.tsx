'use client';

import { MultiSelectV2 } from '@/components/multi-select-v2';
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
import { EndpointName } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { REPO_NAME_MAPPING } from '@/modules/change-log/change-log.const';
import {
  useCreateAppRelease,
  useGetInfiniteAllComponentReleases,
  useGetRecommendedAppVersion,
} from '@/modules/change-log/change-log.query';
import { CreateAppReleaseBody } from '@/modules/change-log/change-log.type';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Eye,
  Layers,
  MapPin,
  Package,
  Sparkles,
  TrendingUp,
  WifiSync,
  WifiSyncIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import ViewComponentRelease from './ViewComponentRelease';
import { Switch } from '@/components/ui/switch';
import { removeVFromVersion } from '@/modules/change-log/change-log.util';
import InfiniteScrollList from '@/components/infinite-scroll-list';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const CreateAppReleaseModal = ({ endpoint }: { endpoint: EndpointName }) => {
  const [open, setOpen] = useState(false);
  const [componentReleasesSearch, setComponentReleasesSearch] = useState('');
  const [createMapProduction, setCreateMapProduction] = useState(false);
  // Mounted closed in the toolbar: only fetch once the dialog is opened
  const { data: recommendedAppVersion, isLoading: loadingVersion } = useGetRecommendedAppVersion(endpoint, {
    enabled: open,
  });
  const {
    data: componentReleasesPages,
    fetchNextPage: fetchNextComponentReleasesPage,
    hasNextPage: hasMoreComponentReleases,
    isLoading: isLoadingComponentReleases,
    isFetchingNextPage: isFetchingNextComponentReleases,
    refetch: refetchComponentReleases,
  } = useGetInfiniteAllComponentReleases(
    { take: 20, sorts: ['createdOn.DESC'], q: componentReleasesSearch },
    endpoint,
    { enabled: open }
  );

  // Special: There is an option to create for Production: EVA and MAP_PRODUCTION
  const { mutateAsync: createAppVersion, isPending } = useCreateAppRelease(endpoint);
  const { mutateAsync: createAppVersionMAPProduction, isPending: isPendingMAPProduction } =
    useCreateAppRelease('MAP_PRODUCTION');

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAppReleaseBody>({
    defaultValues: {
      appVersion: '',
      componentReleaseIds: [],
      releaseDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const componentReleaseIds = watch('componentReleaseIds');
  const selectedAppVersion = watch('appVersion');

  const onSubmit = async (data: CreateAppReleaseBody) => {
    if (!data.appVersion?.trim()) {
      toast.error('Please enter a version number');
      return;
    }

    try {
      await createAppVersion({
        ...data,
        appVersion: removeVFromVersion(data.appVersion),
        componentReleaseIds: data.componentReleaseIds.map(id => Number(id)),
      });

      if (createMapProduction) {
        await createAppVersionMAPProduction({
          ...data,
          appVersion: removeVFromVersion(data.appVersion),
          componentReleaseIds: data.componentReleaseIds.map(id => Number(id)),
        });
      }

      toast.success('App version created successfully!');
      setOpen(false);
    } catch {
      toast.error('Failed to create app version');
    }
  };

  useEffect(() => {
    if (open) {
      setComponentReleasesSearch('');
      setCreateMapProduction(false);
      void refetchComponentReleases();
    }
  }, [open, refetchComponentReleases]);

  useEffect(() => {
    if (open) {
      const promoteComponentReleases = recommendedAppVersion?.promoteComponentReleases.map(item => item.id);

      reset({
        appVersion: '',
        componentReleaseIds: promoteComponentReleases,
        releaseDate: new Date().toISOString(),
      });
    }
  }, [open, recommendedAppVersion?.promoteComponentReleases, reset]);

  const selectedComponents = componentReleases.filter(cr => watch('componentReleaseIds')?.includes(cr.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='gap-2 shadow-sm'>
          <Sparkles className='w-4 h-4' />
          Create App Release
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className='bg-black/40 backdrop-blur-sm' />
        <DialogContent className='overflow-hidden w-[700px] max-w-[90vw] max-h-[90vh] p-0 gap-0'>
          <DialogHeader className='p-6 pb-4 bg-gradient-to-br from-primary/5 to-transparent'>
            <DialogTitle className='text-2xl flex items-center gap-2'>
              <Sparkles className='w-6 h-6 text-primary' />
              Create New App Release
            </DialogTitle>
          </DialogHeader>

          <div className='overflow-y-auto max-h-[calc(90vh-180px)] px-6 pb-6'>
            {/* Version Recommendations Section */}
            <div className='mb-6'>
              <div className='flex items-center gap-2 mb-3'>
                <TrendingUp className='w-4 h-4 text-muted-foreground' />
                <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>
                  Version Recommendations
                </h3>
              </div>

              {loadingVersion ? (
                <Card>
                  <CardContent className='p-6'>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
                      Loading version recommendations...
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid gap-3'>
                  <Card className='border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors'>
                    <CardContent>
                      <div className='flex items-center gap-2'>
                        <p className='text-2xl font-bold font-mono'>
                          v{recommendedAppVersion?.publishedLatest || '--'}
                        </p>

                        <Badge variant='default' className='bg-primary'>
                          Published Latest
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {endpoint === 'EVA' && (
              <div className='flex items-center gap-2 mb-3'>
                <Label
                  htmlFor='createMapProduction'
                  className='text-base font-semibold flex items-center gap-2 text-destructive'
                >
                  <WifiSyncIcon className='w-4 h-4' />
                  Create for MAP Production
                </Label>

                <Switch
                  id='createMapProduction'
                  checked={createMapProduction}
                  onCheckedChange={setCreateMapProduction}
                />
              </div>
            )}

            {/* Form Section */}
            <form id='createAppVersionForm' onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              {/* Version Input */}
              <div className='space-y-2'>
                <Label htmlFor='appVersion' className='text-base font-semibold flex items-center gap-2'>
                  <Package className='w-4 h-4' />
                  App Version
                  <span className='text-destructive'>*</span>
                </Label>
                <Input
                  {...register('appVersion', { required: true })}
                  id='appVersion'
                  placeholder='e.g., 1.0.0'
                  className={cn(
                    'text-lg font-mono h-11',
                    errors.appVersion && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {selectedAppVersion && (
                  <p className='text-sm text-muted-foreground flex items-center gap-1'>
                    <CheckCircle2 className='w-3 h-3' />
                    Version: <span className='font-mono font-semibold'>v{selectedAppVersion}</span>
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

              {/* Component Releases */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label className='text-base font-semibold flex items-center gap-2'>
                    <Layers className='w-4 h-4' />
                    Component Releases
                    <Badge variant='secondary'>{componentReleaseIds.length} selected</Badge>
                  </Label>

                  <Button type='button' variant='outline' size='sm' onClick={() => setValue('componentReleaseIds', [])}>
                    Clear All
                  </Button>
                </div>

                {/* <MultiSelectV2
                  options={options}
                  values={componentReleaseIds}
                  onValuesChange={values => setValue('componentReleaseIds', values)}
                  valueType='number'
                  loading={isFetchingNextComponentReleases}
                  hasMore={hasMoreComponentReleases}
                  onLoadMore={fetchNextComponentReleasesPage}
                  placeholder='Select component releases...'
                  searchPlaceholder='Search releases...'
                  emptyMessage='No releases found.'
                  className='w-full'
                /> */}

                <div className='space-y-2'>
                  <Card className='bg-muted/50 p-0'>
                    <CardContent className='p-4'>
                      <p className='text-sm font-semibold mb-3'>
                        {!componentReleaseIds.length ? 'No Components Selected' : 'Selected Components:'}
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {selectedComponents.map(component => (
                          <Badge
                            key={component.id}
                            className='text-xs'
                            style={{ backgroundColor: REPO_NAME_MAPPING?.[component.repoName]?.color }}
                          >
                            {REPO_NAME_MAPPING?.[component.repoName]?.name || component.repoName} - v
                            {component.repoVersion}
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
              </div>
            </form>
          </div>

          <DialogFooter className='flex flex-row justify-end gap-3 p-6 pt-4 border-t bg-muted/20'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type='submit' form='createAppVersionForm' disabled={isPending} className='gap-2 min-w-[120px]'>
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

export default CreateAppReleaseModal;
