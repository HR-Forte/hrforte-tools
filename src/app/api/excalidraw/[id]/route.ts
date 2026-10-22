import { excalidrawService } from '@/modules/excalidraw/excalidraw.service';
import { toSafeExcalidraw } from '@/modules/excalidraw/excalidraw.util';
import type { SafeExcalidraw } from '@/modules/excalidraw/excalidraw.type';
import { formatSuccessResponse } from '@/lib/utils';
import { AuthenticatedRequest, getUserFromRequest, handleAuth } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';

export const GET = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id } = params || {};
  const authResponse = await handleAuth(request);

  if (authResponse) {
    return authResponse;
  }

  if (!id) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'Excalidraw drawing not found',
      options: { request },
    });
  }

  const excalidraw = await excalidrawService.getExcalidrawById(id);

  if (!excalidraw) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'Excalidraw drawing not found',
      options: { request },
    });
  }

  // Check if user owns the drawing
  if (excalidraw.userId !== getUserFromRequest(request as AuthenticatedRequest).id) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'Excalidraw drawing not found',
      options: { request },
    });
  }

  const safeExcalidraw: SafeExcalidraw = toSafeExcalidraw(excalidraw);

  return formatSuccessResponse(safeExcalidraw, 'Excalidraw drawing retrieved successfully', request);
});

export const PUT = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id } = params || {};
  const authResponse = await handleAuth(request);

  if (authResponse) {
    return authResponse;
  }

  const body = await request.json();
  const user = getUserFromRequest(request as AuthenticatedRequest);

  if (!id) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'Excalidraw drawing not found',
      options: { request },
    });
  }

  const existingExcalidraw = await excalidrawService.getExcalidrawById(id);
  if (!existingExcalidraw) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'Excalidraw drawing not found',
      options: { request },
    });
  }

  // Check if user owns the drawing
  if (existingExcalidraw.userId !== user.id) {
    throw ErrorService.createError({
      type: 'INVALID_USER_ID',
      message: 'You can only update your own drawings',
      options: { request },
    });
  }

  // Update excalidraw
  const updatedExcalidraw = await excalidrawService.updateExcalidraw(id, {
    title: body.title,
    elements: body.elements,
    appState: body.appState,
    metadata: body.metadata,
    updatedBy: user.id,
  });

  if (!updatedExcalidraw) {
    throw ErrorService.createError({
      type: 'QUERY_FAILED',
      message: 'Failed to update excalidraw drawing',
      options: { request },
    });
  }

  const safeExcalidraw: SafeExcalidraw = toSafeExcalidraw(updatedExcalidraw);

  return formatSuccessResponse(safeExcalidraw, 'Excalidraw drawing updated successfully', request);
});

export const DELETE = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id } = params || {};
  const authResponse = await handleAuth(request);

  if (authResponse) {
    return authResponse;
  }

  const user = getUserFromRequest(request as AuthenticatedRequest);

  if (!id) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'Excalidraw drawing not found',
      options: { request },
    });
  }

  const existingExcalidraw = await excalidrawService.getExcalidrawById(id);
  if (!existingExcalidraw) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'Excalidraw drawing not found',
      options: { request },
    });
  }

  // Check if user owns the drawing
  if (existingExcalidraw.userId !== user.id) {
    throw ErrorService.createError({
      type: 'INVALID_USER_ID',
      message: 'You can only delete your own drawings',
      options: { request },
    });
  }

  // Delete excalidraw (soft delete)
  await excalidrawService.deleteExcalidraw(id, user.id);

  return formatSuccessResponse(null, 'Excalidraw drawing deleted successfully', request);
});
