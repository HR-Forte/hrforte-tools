import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import { mergeBranches } from '@/lib/github/github.service';
import { requireAdmin } from '@/lib/middlewares/auth';

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
  const { base, head, commit_message } = body || {};

  if (!base || !head) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'base and head branches are required',
    });
  }

  const data = await mergeBranches({
    owner,
    repo,
    base,
    head,
    commit_message,
  });

  return formatSuccessResponse(data, 'Branches merged successfully', request);
});
