import { formatSuccessResponse } from '@/lib/utils';
import { handleAuth, getUserFromRequest, AuthenticatedRequest } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { environmentVariableService } from '@/modules/environment-variable/environment-variable.service';

export const GET = apiErrorHandler(async (request, context) => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const params = await context?.params;
  const id = params?.id;
  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Environment ID is required' });
  }
  const env = await environmentVariableService.getEnvironmentById(id);
  if (!env) {
    throw ErrorService.createError({ type: 'RECORD_NOT_FOUND', message: 'Environment not found' });
  }
  return formatSuccessResponse(env, 'Environment found', request);
});

export const PATCH = apiErrorHandler(async (request, context) => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const params = await context?.params;
  const id = params?.id;
  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Environment ID is required' });
  }
  const body = await request.json();
  const { name, slug, description } = body ?? {};
  const user = getUserFromRequest(request as AuthenticatedRequest);
  const env = await environmentVariableService.updateEnvironment(
    id,
    {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
    },
    user?.id
  );
  return formatSuccessResponse(env, 'Environment updated', request);
});

export const DELETE = apiErrorHandler(async (request, context) => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const params = await context?.params;
  const id = params?.id;
  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Environment ID is required' });
  }
  const user = getUserFromRequest(request as AuthenticatedRequest);
  await environmentVariableService.deleteEnvironment(id, user?.id);
  return formatSuccessResponse({ success: true }, 'Environment deleted', request);
});
