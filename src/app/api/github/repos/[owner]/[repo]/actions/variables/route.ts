import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import { listRepoVariables, createRepoVariable } from '@/lib/github/github.service';
import { requireAdmin } from '@/lib/middlewares/auth';

export const GET = apiErrorHandler(async (request, context) => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const params = (await context?.params) ?? {};
  const owner = (params as { owner?: string }).owner;
  const repo = (params as { repo?: string }).repo;

  if (!owner || !repo) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'owner and repo are required',
    });
  }

  const data = await listRepoVariables(owner, repo);
  return formatSuccessResponse(data, 'List repository variables successfully', request);
});

export const POST = apiErrorHandler(async (request, context) => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const params = (await context?.params) ?? {};
  const owner = (params as { owner?: string }).owner;
  const repo = (params as { repo?: string }).repo;

  if (!owner || !repo) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'owner and repo are required',
    });
  }

  const body = await request.json();
  const { name, value } = body as { name?: string; value?: string };

  if (!name || value === undefined) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'name and value are required',
    });
  }

  await createRepoVariable(owner, repo, name, value);
  return formatSuccessResponse({ name, value }, 'Variable created successfully', request);
});
