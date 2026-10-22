import { formatSuccessResponse } from '@/lib/utils';
import { requireAdmin } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { roleAssignmentService } from '@/modules/role-assignment/role-assignment.service';
import { getUserFromRequest } from '@/lib/middlewares/auth';
import { AuthenticatedRequest } from '@/lib/middlewares/auth';

export const POST = apiErrorHandler(async (request, context) => {
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

  const body = await request.json();
  const { roleId } = body;

  if (!roleId) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'Role ID is required',
    });
  }

  const user = getUserFromRequest(request as AuthenticatedRequest);
  const assignment = await roleAssignmentService.assignRoleToUser(userId, roleId, user.id);

  return formatSuccessResponse(assignment, 'Role assigned successfully', request);
});
