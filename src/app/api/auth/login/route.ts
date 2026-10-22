import { z } from 'zod';
import { authService } from '@/modules/auth/auth.service';
import { formatErrorResponse, formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

export const POST = apiErrorHandler(async request => {
  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return formatErrorResponse(ErrorService.createError({ type: 'EMAIL_PASSWORD_REQUIRED' }));
    }

    const result = await authService.login(parsed.data);

    return formatSuccessResponse({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      roles: result.roles,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
});
