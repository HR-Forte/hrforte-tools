import { NextRequest } from 'next/server';
import { authService } from '@/modules/auth/auth.service';
import prisma from '@/lib/prisma/prismaClient';
import ErrorService from '@/lib/error/errorService';
import { formatErrorResponse, getRequestId } from '../utils';
import { UserWithRoles } from '@/modules/user/user.model';
import { isAdmin, isSuperAdmin } from '@/modules/user/user.util';
import { ROLE } from '@/modules/role/role.model';

export interface AuthenticatedRequest extends NextRequest {
  user?: UserWithRoles; // User object from JWT payload
}

// Extract user from authenticated request
export function getUserFromRequest(request: AuthenticatedRequest): UserWithRoles {
  return request.user as UserWithRoles;
}

// Check if user is authenticated
export function isAuthenticated(request: AuthenticatedRequest): boolean {
  return !!request.user;
}

// Middleware to authenticate requests ================================================================================================================
export async function handleAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const requestId = getRequestId(request);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return formatErrorResponse(ErrorService.createError({ type: 'TOKEN_MISSING', options: { requestId } }), request);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Build user from JWT payload (no DB calls)
  const user = authService.getUserFromTokenLight(token);

  if (!user) {
    return formatErrorResponse(ErrorService.createError({ type: 'TOKEN_INVALID', options: { requestId } }), request);
  }

  // Add user to request for downstream handlers
  (request as AuthenticatedRequest).user = user;

  return undefined; // Continue to next handler
}

export { isAdmin, isSuperAdmin };

// Authenticate, then authorize against roles loaded from the DB (not the JWT),
// so archived users and revoked roles lose access immediately.
export async function requireRole(request: NextRequest, ...roles: string[]) {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  const user = getUserFromRequest(request as AuthenticatedRequest);
  const assignments = await prisma.roleAssignment.findMany({
    where: {
      userId: user.id,
      isDeleted: false,
      user: { is: { isDeleted: false } },
      role: { is: { isDeleted: false } },
    },
    select: { role: { select: { id: true, name: true, description: true } } },
  });
  user.roles = assignments.map(a => a.role);

  // Super Admin has full permissions and passes every role check
  if (!isSuperAdmin(user) && !user.roles.some(r => roles.includes(r.name))) {
    const type =
      roles.length === 1 && roles[0] === ROLE.ADMIN
        ? 'ADMIN_ONLY'
        : roles.length === 1 && roles[0] === ROLE.SUPER_ADMIN
          ? 'SUPER_ADMIN_ONLY'
          : 'INSUFFICIENT_PERMISSIONS';
    return formatErrorResponse(
      ErrorService.createError({ type, options: { requestId: getRequestId(request) } }),
      request
    );
  }

  return undefined;
}

export const requireAdmin = (request: NextRequest) => requireRole(request, ROLE.ADMIN);
export const requireSuperAdmin = (request: NextRequest) => requireRole(request, ROLE.SUPER_ADMIN);
