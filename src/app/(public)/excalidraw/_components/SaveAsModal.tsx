'use client';
import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUser } from '@/lib/contexts/UserContext';
import { useCreateExcalidraw } from '@/modules/excalidraw/excalidraw.query';
import { toast } from 'sonner';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { SafeExcalidraw } from '@/modules/excalidraw/excalidraw.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SaveAsModalProps = {
  showSaveAsDialog: boolean;
  setShowSaveAsDialog: (open: boolean) => void;
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  setCurrentDrawing: (drawing: SafeExcalidraw | null) => void;
};

const SaveAsModal = (props: SaveAsModalProps) => {
  const { showSaveAsDialog, setShowSaveAsDialog, excalidrawAPI, setCurrentDrawing } = props;
  const [newTitle, setNewTitle] = useState('');
  const { user } = useUser();

  const { mutateAsync: createExcalidraw, isPending } = useCreateExcalidraw();
  const handleSaveAs = useCallback(async () => {
    if (!excalidrawAPI || !user) {
      console.warn('Excalidraw API not available or user not authenticated');
      return;
    }

    try {
      // Get the current scene data
      const sceneData = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();

      // Use the new title or generate one
      const title = newTitle || `Drawing ${new Date().toLocaleString()}`;

      // Prepare data for saving
      const saveData = {
        title,
        elements: sceneData,
        appState: appState,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
        userId: user.id,
      };

      // Always create new drawing for Save As
      const savedDrawing = await createExcalidraw(saveData);
      toast.success(`Drawing saved as new successfully! ID: ${savedDrawing?.data?.id}`);

      setCurrentDrawing(savedDrawing?.data || null);
      setShowSaveAsDialog(false);
      setNewTitle('');
    } catch (error) {
      console.error('Error saving drawing as new:', error);
      toast.error('Error saving drawing. Please try again.');
    }
  }, [createExcalidraw, excalidrawAPI, newTitle, setCurrentDrawing, setShowSaveAsDialog, user]);

  return (
    <Dialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Save As</DialogTitle>
          <DialogDescription>Create a new drawing with a custom title</DialogDescription>
        </DialogHeader>

        <form
          className='grid gap-4'
          onSubmit={e => {
            e.preventDefault();
            if (!isPending) handleSaveAs();
          }}
        >
          <div className='grid gap-2'>
            <Label htmlFor='save-as-title'>Title</Label>
            <Input
              id='save-as-title'
              placeholder='Enter drawing title'
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <div className='flex gap-2 justify-end'>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setShowSaveAsDialog(false);
                  setNewTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAsModal;
