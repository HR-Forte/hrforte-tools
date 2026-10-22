import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import { listRepoPulls } from '@/lib/github/github.service';
import { requireAdmin } from '@/lib/middlewares/auth';

export const GET = apiErrorHandler(async (request, context) => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const params = (await context?.params) ?? {};
  const owner = (params as { owner?: string }).owner;
  const repo = (params as { repo?: string }).repo;
  const { searchParams } = new URL(request.url);
  const state = (searchParams.get('state') as 'open' | 'closed' | 'all') || 'open';
  const perPage = Number(searchParams.get('perPage') || 30);
  const page = Number(searchParams.get('page') || 1);

  if (!owner || !repo) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'owner and repo are required',
    });
  }

  const data = await listRepoPulls({ owner, repo, state, perPage, page });
  return formatSuccessResponse(data, 'Get pull requests successfully', request);
});
