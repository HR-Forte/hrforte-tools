import { formatSuccessResponse } from '@/lib/utils';
import { handleAuth } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { environmentVariableService } from '@/modules/environment-variable/environment-variable.service';

export const PUT = apiErrorHandler(async (request, context) => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const params = await context?.params;
  const id = params?.id;
  const keyRaw = params?.key;
  if (!id || keyRaw === undefined) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Environment ID and variable key are required' });
  }
  const key = decodeURIComponent(keyRaw);
  const body = await request.json();
  const value = body?.value != null ? String(body.value) : '';
  const variable = await environmentVariableService.updateVariable(id, key, value);
  return formatSuccessResponse(variable, 'Variable updated', request);
});

export const DELETE = apiErrorHandler(async (request, context) => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const params = await context?.params;
  const id = params?.id;
  const keyRaw = params?.key;
  if (!id || keyRaw === undefined) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Environment ID and variable key are required' });
  }
  const key = decodeURIComponent(keyRaw);
  await environmentVariableService.deleteVariable(id, key);
  return formatSuccessResponse({ success: true }, 'Variable deleted', request);
});
