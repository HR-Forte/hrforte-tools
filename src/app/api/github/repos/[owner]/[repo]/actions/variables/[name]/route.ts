import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import { updateRepoVariable, deleteRepoVariable } from '@/lib/github/github.service';
import { requireAdmin } from '@/lib/middlewares/auth';

export const PATCH = apiErrorHandler(async (request, context) => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const params = (await context?.params) ?? {};
  const owner = (params as { owner?: string }).owner;
  const repo = (params as { repo?: string }).repo;
  const name = (params as { name?: string }).name;

  if (!owner || !repo || !name) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'Owner, Repo and Name are required',
    });
  }

  const body = await request.json();
  const { value, newName } = body as { value?: string; newName?: string };

  if (value === undefined && newName === undefined) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'value or newName is required',
    });
  }

  await updateRepoVariable(
    owner,
    repo,
    decodeURIComponent(name),
    value ?? '',
    newName
  );
  return formatSuccessResponse(
    { name: newName ?? decodeURIComponent(name) },
    'Variable updated successfully',
    request
  );
});

export const DELETE = apiErrorHandler(async (request, context) => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const params = (await context?.params) ?? {};
  const owner = (params as { owner?: string }).owner;
  const repo = (params as { repo?: string }).repo;
  const name = (params as { name?: string }).name;

  if (!owner || !repo || !name) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'Owner, Repo and Name are required',
    });
  }

  await deleteRepoVariable(owner, repo, decodeURIComponent(name));
  return formatSuccessResponse(null, 'Variable deleted successfully', request);
});
