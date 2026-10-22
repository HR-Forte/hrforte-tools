import { formatSuccessResponse } from '@/lib/utils';
import { handleAuth } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { environmentVariableService } from '@/modules/environment-variable/environment-variable.service';
import { BulkVariablesPayload } from '@/modules/environment-variable/environment-variable.type';

export const POST = apiErrorHandler(async (request, context) => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const params = await context?.params;
  const id = params?.id;
  if (!id) {
    throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Environment ID is required' });
  }
  const body = (await request.json()) as BulkVariablesPayload;
  if (!body || (typeof body.upsert !== 'undefined' && !Array.isArray(body.upsert)) || (typeof body.delete !== 'undefined' && !Array.isArray(body.delete))) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'Body must contain upsert (array of { key, value }) and/or delete (array of keys)',
    });
  }
  const result = await environmentVariableService.bulkVariables(id, {
    upsert: body.upsert,
    delete: body.delete,
  });
  return formatSuccessResponse(result, 'Bulk operation completed', request);
});
