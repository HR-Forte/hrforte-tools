import { formatSuccessResponse } from '@/lib/utils';
import { requireAdmin, getUserFromRequest } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { userService } from '@/modules/user/user.service';
import { AuthenticatedRequest } from '@/lib/middlewares/auth';

export const PATCH = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id: userId } = params || {};

  if (!userId) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'User ID is required',
    });
  }

  const authResponse = await requireAdmin(request);

  if (authResponse) {
    return authResponse;
  }

  const currentUser = getUserFromRequest(request as AuthenticatedRequest);

  if (userId === currentUser.id) {
    throw ErrorService.createError({
      type: 'INVALID_CHOICE',
      message: 'You cannot archive your own account',
    });
  }

  const archivedUser = await userService.archiveUser(userId, currentUser.id);

  // Return safe user (without password)
  const { password: _password, ...safeUser } = archivedUser;

  return formatSuccessResponse(safeUser, 'User archived successfully', request);
});
