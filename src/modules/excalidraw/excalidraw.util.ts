import { Excalidraw } from './excalidraw.model';
import { ExcalidrawSummary, SafeExcalidraw } from './excalidraw.type';

export const toSafeExcalidraw = (excalidraw: Excalidraw): SafeExcalidraw => {
  return {
    id: excalidraw.id,
    title: excalidraw.title,
    elements: excalidraw.elements,
    appState: excalidraw.appState,
    metadata: excalidraw.metadata,
    userId: excalidraw.userId,
    isDeleted: excalidraw.isDeleted,
    createdAt: excalidraw.createdAt,
    updatedAt: excalidraw.updatedAt,
    updatedBy: excalidraw.updatedBy,
    createdBy: excalidraw.createdBy,
  };
};

export const toSafeExcalidraws = (excalidraws: Excalidraw[]): SafeExcalidraw[] => {
  return excalidraws.map(toSafeExcalidraw);
};

export const toExcalidrawSummary = (
  excalidraw: Omit<Excalidraw, 'elements' | 'appState' | 'metadata'>
): ExcalidrawSummary => ({
  id: excalidraw.id,
  title: excalidraw.title,
  userId: excalidraw.userId ?? undefined,
  isDeleted: excalidraw.isDeleted,
  createdAt: excalidraw.createdAt,
  updatedAt: excalidraw.updatedAt,
  updatedBy: excalidraw.updatedBy ?? undefined,
  createdBy: excalidraw.createdBy ?? undefined,
});
