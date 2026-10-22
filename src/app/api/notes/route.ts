import { noteService } from '@/modules/note/note.service';
import { formatSuccessResponse } from '@/lib/utils';
import { AuthenticatedRequest, getUserFromRequest, handleAuth } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';

export const GET = apiErrorHandler(async request => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);
  const result = await noteService.getNotes(user.id);
  return formatSuccessResponse(result, 'Notes retrieved successfully', request);
});

export const POST = apiErrorHandler(async request => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);
  const body = await request.json();

  if (!body.title || !body.content) {
    throw ErrorService.createError({ type: 'REQUIRED_FIELD', message: 'Title and content are required', options: { request } });
  }

  const note = await noteService.createNote({
    title: body.title,
    content: body.content,
    isPublic: body.isPublic ?? false,
    userId: user.id,
    createdBy: user.id,
  });

  return formatSuccessResponse(note, 'Note created successfully', request);
});
