import { AppState, SceneData } from '@excalidraw/excalidraw/types';

export interface CreateExcalidrawInput {
  title: string;
  elements: SceneData['elements']; // Excalidraw scene elements
  appState?: AppState; // Excalidraw app state
  metadata?: any; // Additional metadata
  userId?: string;
  createdBy?: string;
}

export interface UpdateExcalidrawInput {
  title?: string;
  elements?: SceneData['elements'];
  appState?: AppState;
  metadata?: any;
  updatedBy?: string;
}

export interface ExcalidrawFilters {
  title?: string;
  userId?: string;
  createdBy?: string;
}

// List items carry metadata only; fetch the drawing by id to get its scene
export type ExcalidrawSummary = Omit<SafeExcalidraw, 'elements' | 'appState' | 'metadata'>;

export interface ExcalidrawListResult {
  excalidraws: ExcalidrawSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SafeExcalidraw {
  id: string;
  title: string;
  elements: SceneData['elements'];
  appState?: AppState;
  metadata?: any;
  userId?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
  createdBy?: string;
}

export interface ExcalidrawFilters {
  page?: number;
  limit?: number;
  title?: string;
  userId?: string;
}
