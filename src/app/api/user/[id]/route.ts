import { formatSuccessResponse } from '@/lib/utils';
import { AuthenticatedRequest, getUserFromRequest, handleAuth, isAdmin, requireAdmin } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import { userService } from '@/modules/user/user.service';
import { UpdateUserInput } from '@/modules/user/user.type';
import { toSafeUser } from '@/modules/user/user.util';
import bcrypt from 'bcryptjs';

export const GET = apiErrorHandler(async (request, context) => {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const params = await context?.params;
  const { id } = params || {};

  if (!id) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'User ID is required',
    });
  }

  const user = await userService.getUserById(id);

  if (!user) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  return formatSuccessResponse(toSafeUser(user), 'Get User Successfully', request);
});

export const PUT = apiErrorHandler(async (request, context) => {
  const params = await context?.params;
  const { id } = params || {};

  if (!id) {
    throw ErrorService.createError({
      type: 'NOT_FOUND',
      message: 'User ID is required',
    });
  }

  const authResponse = await handleAuth(request);

  if (authResponse) {
    return authResponse;
  }

  // Users may only update themselves; admins (checked against the DB) may update anyone.
  const currentUser = getUserFromRequest(request as AuthenticatedRequest);
  const isSelf = currentUser.id === id;
  if (!isSelf) {
    const adminResponse = await requireAdmin(request);
    if (adminResponse) return adminResponse;
  }
  const actingAsAdmin = !isSelf || isAdmin(currentUser);

  const raw = (await request.json().catch(() => ({}))) as UpdateUserInput;
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
  const body: UpdateUserInput = {
    avatar: str(raw.avatar),
    name: str(raw.name),
    email: str(raw.email),
    password: str(raw.password),
    currentPassword: str(raw.currentPassword),
  };

  const user = await userService.getUserById(id);

  // The profile form re-sends the unchanged email; only an actual change is restricted.
  if (body.email && body.email !== user?.email && !actingAsAdmin) {
    throw ErrorService.createError({
      type: 'ADMIN_ONLY',
      message: 'Only administrators can change email',
      options: { request },
    });
  }

  // Changing your own password requires the current one; admins may reset other users' passwords.
  if (body.password && isSelf && !body.currentPassword) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'Current password is required',
    });
  }

  if (body.currentPassword) {
    const isPasswordValid = await bcrypt.compare(body.currentPassword, user?.password || '');

    if (!isPasswordValid) {
      throw ErrorService.createError({
        type: 'INVALID_CREDENTIALS',
        message: 'Current password is incorrect',
      });
    }
  }

  const updatedUser = await userService.updateUser(id, body);

  if (!updatedUser) {
    throw ErrorService.createError({
      type: 'USER_UPDATE_FAILED',
      options: { request },
    });
  }

  return formatSuccessResponse(toSafeUser(updatedUser), 'Profile updated successfully', request);
});
