import { formatSuccessResponse } from '@/lib/utils';
import { handleAuth } from '@/lib/middlewares/auth';
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
  const variables = await environmentVariableService.listVariables(id);
  return formatSuccessResponse(variables, 'Variables listed', request);
});

export const POST = apiErrorHandler(async (request, context) => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const params = await context?.params;
  const id = params?.id;
  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Environment ID is required' });
  }
  const body = await request.json();
  const { key, value } = body ?? {};
  if (!key || typeof key !== 'string' || !key.trim()) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'key is required',
    });
  }
  const variable = await environmentVariableService.createVariable(id, {
    key: key.trim(),
    value: value != null ? String(value) : '',
  });
  return formatSuccessResponse(variable, 'Variable created', request);
});
