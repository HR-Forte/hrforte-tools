import ErrorService from '@/lib/error/errorService';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';

// Public sign-up is disabled; admins create users via POST /api/users.
export const POST = apiErrorHandler(async request => {
  throw ErrorService.createError({
    type: 'INSUFFICIENT_PERMISSIONS',
    message: 'Registration is disabled. Ask an administrator for an account.',
    options: { request },
  });
});
