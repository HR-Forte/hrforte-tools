import { formatSuccessResponse } from '@/lib/utils';
import { handleAuth } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { roleService } from '@/modules/role/role.service';
import { withoutHiddenRoles } from '@/modules/user/user.util';

export const GET = apiErrorHandler(async request => {
  const authResponse = await handleAuth(request);

  if (authResponse) {
    return authResponse;
  }

  const roles = await roleService.getAllRoles();

  // Map to CustomRole format; hidden roles (e.g. Super Admin) are never exposed
  const activeRoles = withoutHiddenRoles(roles).map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
  }));

  return formatSuccessResponse(activeRoles, 'Get roles successfully', request);
});
