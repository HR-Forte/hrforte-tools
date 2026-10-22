'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Only this route needs Excalidraw's styles; keep them out of every other page's critical CSS
import '@excalidraw/excalidraw/index.css';
import { useTheme } from 'next-themes';
import { SafeExcalidraw } from '@/modules/excalidraw/excalidraw.type';
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { SceneData } from '@excalidraw/excalidraw/types';
import CustomMenu from './_components/CustomMenu';
import { isEmpty } from '@/lib/utils';

const EXCALIDRAW_LOCAL_STORAGE_KEY = 'excalidraw-local-drawing';
const LOCAL_SAVE_DEBOUNCE_MS = 500;

const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, {
  ssr: false,
});

const getLocalDrawing = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(EXCALIDRAW_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    parsed.appState.collaborators = isEmpty(parsed.appState?.collaborators)
      ? new Map()
      : new Map(parsed.appState?.collaborators || []);


    return parsed;
  } catch (error) {
    console.error('Error getting local drawing:', error);
    return null;
  }
};

const saveLocalDrawing = (elements: SceneData['elements'], appState: AppState) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXCALIDRAW_LOCAL_STORAGE_KEY, JSON.stringify({ elements, appState }));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

const clearLocalDrawing = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(EXCALIDRAW_LOCAL_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const ExcalidrawPage = () => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [currentDrawing, setCurrentDrawingState] = useState<SafeExcalidraw | null>(null);

  const setCurrentDrawing = useCallback((drawing: SafeExcalidraw | null) => {
    if (drawing) {
      clearLocalDrawing();
    }
    setCurrentDrawingState(drawing);
  }, []);

  const { resolvedTheme } = useTheme();

  const initialData = useMemo(() => getLocalDrawing(), []);

  // onChange fires on every pointer move/scroll; serializing the whole scene each time blocks the
  // main thread, so debounce the local backup and flush it when leaving the page.
  const pendingSave = useRef<(() => void) | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushLocalSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    pendingSave.current?.();
    pendingSave.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', flushLocalSave);
    return () => {
      window.removeEventListener('beforeunload', flushLocalSave);
      flushLocalSave();
    };
  }, [flushLocalSave]);

  const handleChange = useCallback(
    (elements: SceneData['elements'], appState: AppState) => {
      if (currentDrawing) return;
      pendingSave.current = () => saveLocalDrawing(elements, appState);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushLocalSave, LOCAL_SAVE_DEBOUNCE_MS);
    },
    [currentDrawing, flushLocalSave]
  );

  // A pending local save must not land after a cloud drawing is opened
  useEffect(() => {
    if (!currentDrawing) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    pendingSave.current = null;
  }, [currentDrawing]);

  return (
    <div className='h-[calc(100dvh-2.5rem)] md:h-screen w-full md:w-[calc(100vw-60px)] relative flex'>
      <div className='flex-1 relative'>
        {/* Action Buttons */}
        <CustomMenu
          excalidrawAPI={excalidrawAPI}
          currentDrawing={currentDrawing}
          setCurrentDrawing={setCurrentDrawing}
        />

        <div className='absolute top-16 left-4 z-2 flex flex-col gap-2 items-start'>
          {currentDrawing && (
            <div className='z-2 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-md'>
              <p className='text-sm'>
                Current Drawing: <span className='italic font-bold'>{currentDrawing.title}</span>
              </p>
            </div>
          )}
        </div>

        <Excalidraw
          excalidrawAPI={api => setExcalidrawAPI(api)}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          initialData={initialData}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default ExcalidrawPage;
