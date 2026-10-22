import { noteService } from '@/modules/note/note.service';
import { formatSuccessResponse } from '@/lib/utils';
import { AuthenticatedRequest, getUserFromRequest, handleAuth } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { z } from 'zod';
import { parseBody } from '@/lib/utils/parseBody';

// Only these fields are editable; userId/isDeleted/createdBy can't be set by clients
const updateNoteSchema = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const GET = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id } = params || {};
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);

  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Note not found', options: { request } });
  }

  const note = await noteService.getNoteById(id);
  if (!note) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Note not found', options: { request } });
  }

  if (!note.isPublic && note.userId !== user.id) {
    throw ErrorService.createError({ type: 'RESOURCE_ACCESS_DENIED', message: 'You do not have access to this note', options: { request } });
  }

  return formatSuccessResponse(note, 'Note retrieved successfully', request);
});

export const PUT = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id } = params || {};
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);

  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Note not found', options: { request } });
  }

  const existing = await noteService.getNoteById(id);
  if (!existing) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Note not found', options: { request } });
  }

  if (existing.userId !== user.id) {
    throw ErrorService.createError({ type: 'RESOURCE_ACCESS_DENIED', message: 'You can only edit your own notes', options: { request } });
  }

  const body = await parseBody(request, updateNoteSchema);
  const note = await noteService.updateNote(id, { ...body, updatedBy: user.id });
  return formatSuccessResponse(note, 'Note updated successfully', request);
});

export const DELETE = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id } = params || {};
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);

  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Note not found', options: { request } });
  }

  const existing = await noteService.getNoteById(id);
  if (!existing) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Note not found', options: { request } });
  }

  if (existing.userId !== user.id) {
    throw ErrorService.createError({ type: 'RESOURCE_ACCESS_DENIED', message: 'You can only delete your own notes', options: { request } });
  }

  await noteService.deleteNote(id, user.id);
  return formatSuccessResponse(null, 'Note deleted successfully', request);
});
