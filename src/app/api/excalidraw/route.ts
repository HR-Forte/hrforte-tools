import { excalidrawService } from '@/modules/excalidraw/excalidraw.service';
import { toExcalidrawSummary } from '@/modules/excalidraw/excalidraw.util';
import type { SafeExcalidraw, ExcalidrawFilters, ExcalidrawListResult } from '@/modules/excalidraw/excalidraw.type';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/utils';
import { AuthenticatedRequest, getUserFromRequest, handleAuth } from '@/lib/middlewares/auth';
import { AppState, SceneData } from '@excalidraw/excalidraw/types';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';

export const GET = apiErrorHandler(async request => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10') || 10));
  const skip = (page - 1) * limit;

  // Build filters from query params; users only ever list their own drawings
  const filters: ExcalidrawFilters = { userId: user.id };
  if (searchParams.get('title')) filters.title = searchParams.get('title')!;

  // Get excalidraws from service
  const [excalidraws, total] = await Promise.all([
    excalidrawService.getExcalidraws(filters, skip, limit),
    excalidrawService.getExcalidrawsCount(filters),
  ]);

  const safeExcalidraws = excalidraws.map(toExcalidrawSummary);

  // Build paginated response
  const response: ExcalidrawListResult = {
    excalidraws: safeExcalidraws,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return formatSuccessResponse(response, 'Excalidraw drawings retrieved successfully', request);
});

export const POST = apiErrorHandler(async request => {
  const body = await request.json();
  const authResponse = await handleAuth(request);

  if (authResponse) {
    return authResponse;
  }
  const user = getUserFromRequest(request as AuthenticatedRequest);

  // Validate required fields
  if (!body.title || !body.elements) {
    return formatErrorResponse(new Error('Title and elements are required'), request);
  }

  // Create excalidraw with user ID
  const excalidraw = await excalidrawService.createExcalidraw({
    title: body.title,
    elements: body.elements,
    appState: body.appState,
    metadata: body.metadata,
    userId: user.id,
    createdBy: user.id,
  });

  const safeExcalidraw: SafeExcalidraw = {
    id: excalidraw.id,
    title: excalidraw.title,
    elements: excalidraw.elements as SceneData['elements'],
    appState: excalidraw.appState as unknown as AppState,
    metadata: excalidraw.metadata,
    userId: excalidraw.userId || '',
    isDeleted: excalidraw.isDeleted,
    createdAt: excalidraw.createdAt,
    updatedAt: excalidraw.updatedAt,
    updatedBy: '',
    createdBy: excalidraw.createdBy || '',
  };

  return formatSuccessResponse(safeExcalidraw, 'Excalidraw drawing created successfully', request);
});
