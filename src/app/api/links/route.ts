import { linkService } from '@/modules/link/link.service';
import { formatSuccessResponse } from '@/lib/utils';
import { AuthenticatedRequest, getUserFromRequest, handleAuth, requireAdmin } from '@/lib/middlewares/auth';
import { parseBody } from '@/lib/utils/parseBody';
import { createLinkSchema } from '@/modules/link/link.schema';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';

export const GET = apiErrorHandler(async request => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const result = await linkService.getLinksGrouped();
  return formatSuccessResponse(result, 'Links retrieved successfully', request);
});

export const POST = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);

  const body = await parseBody(request, createLinkSchema);

  const link = await linkService.createLink({ ...body, createdBy: user.id });
  return formatSuccessResponse(link, 'Link created successfully', request);
});
