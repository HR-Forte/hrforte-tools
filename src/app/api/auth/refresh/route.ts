import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { formatErrorResponse, formatSuccessResponse } from '@/lib/utils';
import { authService } from '@/modules/auth/auth.service';

// The refresh token itself is the credential here (the access token may already be expired).
export const POST = apiErrorHandler(async request => {
  try {
    const body = await request.json().catch(() => null);
    const refreshToken = body?.refreshToken;

    if (typeof refreshToken !== 'string' || !refreshToken) {
      return formatErrorResponse(ErrorService.createError({ type: 'INVALID_REFRESH_TOKEN' }), request);
    }

    const result = await authService.refreshToken(refreshToken);

    return formatSuccessResponse({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
});
