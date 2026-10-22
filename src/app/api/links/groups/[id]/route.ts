import { linkService } from '@/modules/link/link.service';
import { formatSuccessResponse } from '@/lib/utils';
import { AuthenticatedRequest, getUserFromRequest, requireAdmin } from '@/lib/middlewares/auth';
import { parseBody } from '@/lib/utils/parseBody';
import { updateLinkGroupSchema } from '@/modules/link/link.schema';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';

export const PUT = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id } = params || {};
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);

  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Link group not found', options: { request } });
  }

  const body = await parseBody(request, updateLinkGroupSchema);
  const group = await linkService.updateLinkGroup(id, { ...body, updatedBy: user.id });
  return formatSuccessResponse(group, 'Link group updated successfully', request);
});

export const DELETE = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id } = params || {};
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);

  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Link group not found', options: { request } });
  }

  await linkService.deleteLinkGroup(id, user.id);
  return formatSuccessResponse(null, 'Link group deleted successfully', request);
});
