import { formatSuccessResponse } from '@/lib/utils';
import { requireAdmin } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { roleAssignmentService } from '@/modules/role-assignment/role-assignment.service';

export const DELETE = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id: userId, roleId } = params || {};

  if (!userId || !roleId) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'User ID and Role ID are required',
    });
  }

  const authResponse = await requireAdmin(request);

  if (authResponse) {
    return authResponse;
  }

  await roleAssignmentService.unassignRoleFromUser(userId, roleId);

  return formatSuccessResponse({ success: true }, 'Role unassigned successfully', request);
});
