import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import { createPullRequest } from '@/lib/github/github.service';
import { requireAdmin } from '@/lib/middlewares/auth';

export const POST = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  const { owner, repo, title, head, base, draft, prBody } = body;

  if (!owner || !repo || !title || !head || !base) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'owner, repo, title, head, and base are required',
    });
  }

  const data = await createPullRequest({
    owner,
    repo,
    title,
    head,
    base,
    body: prBody,
    draft,
  });

  return formatSuccessResponse(data, 'Create pull request successfully', request);
});
