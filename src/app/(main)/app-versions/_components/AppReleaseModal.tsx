'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import ViewAppRelease from './ViewAppRelease';
import { AppRelease } from '@/modules/change-log/change-log.model';
import UpdateAppRelease from './UpdateAppRelease';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EndpointName } from '@/lib/api/types';
import { useDeleteAppRelease } from '@/modules/change-log/change-log.query';
import { Trash } from 'lucide-react';

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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className='sm:max-w-5xl max-h-[80vh] overflow-y-auto' showCloseButton={false}>
        <DialogHeader>
          <div className='flex flex-wrap justify-between items-center gap-2'>
            <div>
              <DialogTitle>App Version Details</DialogTitle>
              <DialogDescription>Detailed information about the selected app version</DialogDescription>
            </div>
            <div className='flex gap-2 items-center'>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='outline' aria-label='Delete app release'>
                    <Trash className='w-4 h-4 text-destructive' />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete App Release</DialogTitle>
                  </DialogHeader>
                  <DialogDescription>Are you sure you want to delete this app release?</DialogDescription>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant='outline' onClick={e => e.stopPropagation()}>
                        Cancel
                      </Button>
                    </DialogClose>
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
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {isEdit && (
                <Button type='submit' form='update-app-release-form'>
                  Save
                </Button>
              )}
              <Button variant='outline' onClick={() => setIsEdit(!isEdit)}>
                {isEdit ? 'View' : 'Edit'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isEdit ? (
          <UpdateAppRelease selectedRelease={selectedRelease} setIsDialogOpen={setIsDialogOpen} endpoint={endpoint} />
        ) : (
          <ViewAppRelease selectedRelease={selectedRelease} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppReleaseModal;
