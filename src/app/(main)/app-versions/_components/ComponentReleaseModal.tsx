'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import ViewComponentRelease from './ViewComponentRelease';
import { ComponentRelease } from '@/modules/change-log/change-log.model';
import UpdateComponentRelease from './UpdateComponentRelease';
import { EndpointName } from '@/lib/api/types';

interface ComponentReleaseModalProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  selectedRelease: ComponentRelease | null;
  endpoint: EndpointName;
}

const ComponentReleaseModal = ({
  isDialogOpen,
  setIsDialogOpen,
  selectedRelease,
  endpoint,
}: ComponentReleaseModalProps) => {
  const [isEdit, setIsEdit] = useState(false);

  // Always reopen in view mode (closing can come from here or from the update form)
  useEffect(() => {
    if (!isDialogOpen) setIsEdit(false);
  }, [isDialogOpen]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className='sm:max-w-3xl overflow-auto max-h-[80vh]' showCloseButton={false}>
        <DialogHeader>
          <div className='flex justify-between items-center'>
            <div>
              <DialogTitle>Repository Version Details</DialogTitle>
            </div>
            <div className='flex gap-2 items-center'>
              {isEdit && (
                <Button type='submit' form='update-component-release-form'>
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
          <UpdateComponentRelease
            selectedRelease={selectedRelease}
            setIsDialogOpen={setIsDialogOpen}
            endpoint={endpoint}
          />
        ) : (
          <ViewComponentRelease selectedRelease={selectedRelease} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ComponentReleaseModal;
