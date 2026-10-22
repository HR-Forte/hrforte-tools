import { AuthenticatedRequest, getUserFromRequest, handleAuth } from '@/lib/middlewares/auth';
import { formatErrorResponse, formatSuccessResponse } from '@/lib/utils';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';

export const GET = apiErrorHandler(async request => {
  const authResponse = await handleAuth(request);

  if (authResponse) {
    return authResponse;
  }

  try {
    const user = getUserFromRequest(request as AuthenticatedRequest);

    return formatSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        roles: user.roles?.map(role => ({ id: role.id, name: role.name })),
      },
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
});
