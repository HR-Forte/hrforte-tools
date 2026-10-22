'use client';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ApiResponse } from '@/lib/api/types';
import { useUser } from '@/lib/contexts/UserContext';
import { cn, isEmpty } from '@/lib/utils';
import { excalidrawClient } from '@/modules/excalidraw/excalidraw.client';
import { ExcalidrawSummary, SafeExcalidraw } from '@/modules/excalidraw/excalidraw.type';
import { FilePlus2, FolderOpen, Loader, Save, SquarePen } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DrawingsList } from './DrawingsList';
import SaveAsModal from './SaveAsModal';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

const EXCALIDRAW_REDIRECT = '/excalidraw';

type CustomMenuProps = {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  currentDrawing: SafeExcalidraw | null;
  setCurrentDrawing: (drawing: SafeExcalidraw | null) => void;
};

const CustomMenu = (props: CustomMenuProps) => {
  const { excalidrawAPI, currentDrawing, setCurrentDrawing } = props;
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => unknown) | null>(null);

  const { user } = useUser();
  const router = useRouter();

  const requireLogin = useCallback(() => {
    toast.error('Please sign in to save or load drawings');
    router.push(`/sign-in?redirect=${encodeURIComponent(EXCALIDRAW_REDIRECT)}`);
  }, [router]);

  // Run `action` right away on an empty canvas, otherwise ask before it replaces the current scene.
  const confirmDiscard = useCallback(
    (action: () => unknown) => {
      if (excalidrawAPI && excalidrawAPI.getSceneElements().length > 0) {
        setPendingAction(() => action);
      } else {
        action();
      }
    },
    [excalidrawAPI]
  );

  const handleSave = useCallback(async () => {
    if (!excalidrawAPI) {
      toast.warning('Canvas not ready. Please try again.');
      return;
    }
    if (!user) {
      requireLogin();
      return;
    }

    try {
      setIsSaving(true);

      // Get the current scene data
      const sceneData = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();

      // Generate a title based on current time or use a default
      const title = currentDrawing?.title || `Drawing ${new Date().toLocaleString()}`;

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

      let savedDrawing: ApiResponse<SafeExcalidraw>;

      if (currentDrawing) {
        // Update existing drawing
        savedDrawing = await excalidrawClient.updateExcalidraw(currentDrawing.id, saveData);
        toast.success('Drawing updated successfully');
      } else {
        // Create new drawing
        savedDrawing = await excalidrawClient.createExcalidraw(saveData);
        toast.success('Drawing saved successfully');

        setCurrentDrawing(savedDrawing.data);
      }
    } catch (error) {
      console.error('Error saving drawing:', error);
      toast.error('Error saving drawing. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [excalidrawAPI, user, currentDrawing, setCurrentDrawing, requireLogin]);

  const handleLoadDrawing = useCallback(
    async (summary: ExcalidrawSummary) => {
      if (!excalidrawAPI) {
        toast.warning('Excalidraw API not available');
        return;
      }

      try {
        // The list only has metadata; fetch the full scene for the selected drawing
        const drawing = (await excalidrawClient.getExcalidrawById(summary.id)).data;

        // Collaborators is a Map, so we need to convert it to an object
        const collaborators =
          isEmpty(drawing.appState?.collaborators) || !drawing.appState?.collaborators
            ? new Map()
            : drawing.appState?.collaborators;

        if (drawing.appState) {
          excalidrawAPI.updateScene({
            elements: drawing.elements,
            appState: {
              ...drawing.appState,
              collaborators,
            },
          });

          setCurrentDrawing(drawing);

          toast.success(
            <span>
              Drawing <strong>{drawing.title}</strong> loaded successfully!
            </span>
          );
        }
      } catch (error) {
        console.error('Error loading drawing:', error);
        toast.error('Error loading drawing. Please try again.');
      }
    },
    [excalidrawAPI, setCurrentDrawing]
  );

  const handleNewDrawing = useCallback(() => {
    if (!excalidrawAPI) {
      toast.warning('Canvas not ready. Please try again.');
      return;
    }

    try {
      // Clear the current scene
      excalidrawAPI.updateScene({
        elements: [],
        appState: {},
      });

      setCurrentDrawing(null);
    } catch (error) {
      console.error('Error creating new drawing:', error);
      toast.error('Error creating new drawing. Please try again.');
    }
  }, [excalidrawAPI, setCurrentDrawing]);

  return (
    <div className='absolute top-4 left-16 z-50 flex flex-col gap-2 items-start'>
      <div className='inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse'>
        <Drawer direction='right'>
          <Tooltip>
            <TooltipTrigger asChild>
              <DrawerTrigger
                aria-label='Open saved drawings'
                className={cn(
                  'px-3',
                  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                  'rounded-none rounded-s-md shadow-none focus-visible:z-10',
                  'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50'
                )}
              >
                <FolderOpen />
              </DrawerTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select a drawing to load</p>
            </TooltipContent>
          </Tooltip>
          <DrawerContent>
            <DrawerTitle className='sr-only'>My drawings</DrawerTitle>
            <DrawingsList
              onSelectDrawing={summary => confirmDiscard(() => handleLoadDrawing(summary))}
              // Saving after deleting the open drawing would target a deleted id
              onDeleted={id => currentDrawing?.id === id && setCurrentDrawing(null)}
            />
          </DrawerContent>
        </Drawer>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className='rounded-none shadow-none focus-visible:z-10'
              variant='outline'
              onClick={() => confirmDiscard(handleNewDrawing)}
              aria-label='New drawing'
            >
              <FilePlus2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New drawing</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className='rounded-none shadow-none focus-visible:z-10'
              variant='outline'
              aria-label='Save as new drawing'
              onClick={() => {
                if (!user) {
                  requireLogin();
                  return;
                }
                setShowSaveAsDialog(true);
              }}
            >
              <SquarePen />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save As</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className='rounded-none rounded-e-md shadow-none focus-visible:z-10'
              variant='outline'
              onClick={handleSave}
              disabled={isSaving}
              aria-label={currentDrawing ? 'Update drawing' : 'Save drawing'}
            >
              {isSaving ? <Loader /> : <Save />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSaving ? 'Saving...' : currentDrawing ? 'Update' : 'Save'}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <SaveAsModal
        excalidrawAPI={excalidrawAPI}
        setCurrentDrawing={setCurrentDrawing}
        showSaveAsDialog={showSaveAsDialog}
        setShowSaveAsDialog={setShowSaveAsDialog}
      />

      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={open => {
          if (!open) setPendingAction(null);
        }}
        title='Discard current drawing?'
        description='The canvas has content that will be replaced. Save it first if you want to keep it.'
        confirmLabel='Discard & continue'
        onConfirm={() => pendingAction?.()}
      />
    </div>
  );
};

export default CustomMenu;
