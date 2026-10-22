import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import { getPullRequest, updatePullRequest } from '@/lib/github/github.service';
import { requireAdmin } from '@/lib/middlewares/auth';

export const GET = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const { searchParams, pathname } = request.nextUrl;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const numberText = pathname.split('/').pop();
  const number = Number(numberText);

  if (!owner || !repo || !number) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'owner, repo, and number are required',
    });
  }

  const data = await getPullRequest({ owner, repo, number });
  return formatSuccessResponse(data, 'Get pull request successfully', request);
});

export const PATCH = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const { searchParams, pathname } = request.nextUrl;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const numberText = pathname.split('/').pop();
  const number = Number(numberText);
  const body = await request.json();

  if (!owner || !repo || !number) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'owner, repo, and number are required',
    });
  }

  const data = await updatePullRequest({
    owner,
    repo,
    number,
    title: body.title,
    body: body.body,
    state: body.state,
  });
  return formatSuccessResponse(data, 'Update pull request successfully', request);
});
