import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import {
  createOrUpdateRepoSecret,
  deleteRepoSecret,
} from '@/lib/github/github.service';
import { requireAdmin } from '@/lib/middlewares/auth';

export const PUT = apiErrorHandler(async (request, context) => {
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
  const { value } = body as { value?: string };

  if (!value) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'Value is required',
    });
  }

  await createOrUpdateRepoSecret(owner, repo, decodeURIComponent(name), value);
  return formatSuccessResponse(
    { name: decodeURIComponent(name) },
    'Secret created or updated successfully',
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

  await deleteRepoSecret(owner, repo, decodeURIComponent(name));
  return formatSuccessResponse(null, 'Secret deleted successfully', request);
});
