import { formatSuccessResponse } from '@/lib/utils';
import { handleAuth, getUserFromRequest, AuthenticatedRequest } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { environmentVariableService } from '@/modules/environment-variable/environment-variable.service';

export const GET = apiErrorHandler(async request => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const list = await environmentVariableService.listEnvironments();
  return formatSuccessResponse(list, 'Environments listed', request);
});

export const POST = apiErrorHandler(async request => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  const { name, slug, description } = body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'name is required',
    });
  }
  const user = getUserFromRequest(request as AuthenticatedRequest);
  const env = await environmentVariableService.createEnvironment(
    { name: name.trim(), slug: slug?.trim(), description: description?.trim() },
    user?.id
  );
  return formatSuccessResponse(env, 'Environment created', request);
});
