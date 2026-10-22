import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import { listOrgRepos } from '@/lib/github/github.service';
import { GITHUB_ORG, GITHUB_QUICK_MERGE_RULES } from '@/config/server';
import { requireAdmin } from '@/lib/middlewares/auth';

export const GET = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') || 1);
  const perPage = Number(searchParams.get('perPage') || 50);
  const org = searchParams.get('org') || GITHUB_ORG;

  const data = await listOrgRepos({ org, page, perPage });

  return formatSuccessResponse(
    {
      data,
      page,
      perPage,
      hasNextPage: Array.isArray(data) && data.length === perPage,
      rules: GITHUB_QUICK_MERGE_RULES || null,
    },
    'Get GitHub repositories successfully',
    request
  );
});
