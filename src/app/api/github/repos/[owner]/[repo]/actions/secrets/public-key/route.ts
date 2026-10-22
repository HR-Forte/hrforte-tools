import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import { getRepoSecretsPublicKey } from '@/lib/github/github.service';
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

  const data = await getRepoSecretsPublicKey(owner, repo);
  return formatSuccessResponse(data, 'Get repository secrets public key successfully', request);
});
