import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import { mergePullRequest } from '@/lib/github/github.service';
import { requireAdmin } from '@/lib/middlewares/auth';

export const POST = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const { pathname } = request.nextUrl;
  const numberText = pathname.split('/').slice(-2)[0];
  const number = Number(numberText);
  const body = await request.json();
  const { owner, repo, merge_method, commit_title, commit_message } = body || {};

  if (!owner || !repo || !number) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'owner, repo, and number are required',
    });
  }

  const data = await mergePullRequest({
    owner,
    repo,
    number,
    merge_method,
    commit_title,
    commit_message,
  });

  return formatSuccessResponse(data, 'Merge pull request successfully', request);
});
