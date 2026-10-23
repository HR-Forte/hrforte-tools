'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ViewAppRelease from './ViewAppRelease';
import { AppRelease } from '@/modules/change-log/change-log.model';
import UpdateAppRelease from './UpdateAppRelease';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EndpointName } from '@/lib/api/types';
import { useDeleteAppRelease } from '@/modules/change-log/change-log.query';
import { cn } from '@/lib/utils';
import { Eye, Loader2, Package, Pencil, Save, Trash2, X } from 'lucide-react';

interface AppReleaseModalProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  selectedRelease: AppRelease | null;
  endpoint: EndpointName;
}

const AppReleaseModal = ({ isDialogOpen, setIsDialogOpen, selectedRelease, endpoint }: AppReleaseModalProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const { mutateAsync: deleteAppRelease, isPending: isDeleting } = useDeleteAppRelease(endpoint);

  // Always reopen in view mode (closing can come from here or from the update form)
  useEffect(() => {
    if (!isDialogOpen) setIsEdit(false);
  }, [isDialogOpen]);

  const modes = [
    { value: false, label: 'View', icon: Eye },
    { value: true, label: 'Edit', icon: Pencil },
  ];

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className='sm:max-w-5xl max-h-[85vh] flex flex-col gap-0 p-0' showCloseButton={false}>
        <DialogHeader className='px-6 py-4 border-b'>
          <div className='flex flex-wrap justify-between items-center gap-3'>
            <div className='flex items-center gap-3 min-w-0'>
              <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <Package className='size-5' />
              </div>
              <div className='min-w-0 text-left'>
                <DialogTitle className='truncate'>
                  {isEdit ? 'Edit App Version' : 'App Version Details'}
                  {selectedRelease?.appVersion && (
                    <span className='ml-2 text-muted-foreground font-medium'>v{selectedRelease.appVersion}</span>
                  )}
                </DialogTitle>
                <DialogDescription className='mt-1'>
                  {isEdit
                    ? 'Update the release information and save your changes'
                    : 'Detailed information about the selected app version'}
                </DialogDescription>
              </div>
            </div>

            <div className='flex gap-2 items-center'>
              <div role='group' aria-label='Mode' className='inline-flex rounded-md border bg-muted/50 p-0.5'>
                {modes.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={label}
                    size='sm'
                    variant='ghost'
                    aria-pressed={isEdit === value}
                    onClick={() => setIsEdit(value)}
                    className={cn(
                      'h-7 text-muted-foreground',
                      isEdit === value && 'bg-background text-foreground shadow-sm hover:bg-background'
                    )}
                  >
                    <Icon className='size-3.5' />
                    {label}
                  </Button>
                ))}
              </div>

              {isEdit && (
                <Button size='sm' type='submit' form='update-app-release-form'>
                  <Save className='size-4' />
                  Save
                </Button>
              )}

              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        size='icon'
                        variant='outline'
                        aria-label='Delete app release'
                        className='size-8 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40'
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Delete release</TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete App Release</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete
                      {selectedRelease?.appVersion ? (
                        <span className='font-semibold text-foreground'> v{selectedRelease.appVersion}</span>
                      ) : (
                        ' this app release'
                      )}
                      ? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={e => e.stopPropagation()}>
                      Cancel
                    </AlertDialogCancel>
                    {/* Plain Button (not AlertDialogAction) so the confirm stays open while deleting */}
                    <Button
                      variant='destructive'
                      disabled={isDeleting}
                      onClick={async e => {
                        e.stopPropagation();

                        if (selectedRelease?.id) {
                          await deleteAppRelease(selectedRelease.id).catch(() => undefined);
                          setIsDialogOpen(false);
                        }
                      }}
                    >
                      {isDeleting ? <Loader2 className='size-4 animate-spin' /> : <Trash2 className='size-4' />}
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <DialogClose asChild>
                <Button size='icon' variant='ghost' aria-label='Close' className='size-8'>
                  <X className='size-4' />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto px-6 py-5'>
          {isEdit ? (
            <UpdateAppRelease selectedRelease={selectedRelease} setIsDialogOpen={setIsDialogOpen} endpoint={endpoint} />
          ) : (
            <ViewAppRelease selectedRelease={selectedRelease} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppReleaseModal;
