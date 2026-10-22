import { formatSuccessResponse } from '@/lib/utils';
import { handleAuth } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { roleService } from '@/modules/role/role.service';

export const GET = apiErrorHandler(async request => {
  const authResponse = await handleAuth(request);

  if (authResponse) {
    return authResponse;
  }

  const roles = await roleService.getAllRoles();

  // Filter out deleted roles and map to CustomRole format
  const activeRoles = roles.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
  }));

  return formatSuccessResponse(activeRoles, 'Get roles successfully', request);
});
