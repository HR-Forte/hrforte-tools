import { formatSuccessResponse } from '@/lib/utils';
import { requireAdmin, getUserFromRequest, AuthenticatedRequest } from '@/lib/middlewares/auth';
import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import ErrorService from '@/lib/error/errorService';
import prisma from '@/lib/prisma/prismaClient';
import { UserWithRoles } from '@/modules/user/user.model';
import { CustomRole } from '@/modules/role/role.model';
import { GetAllUsersResponse } from '@/modules/user/user.type';
import { userService } from '@/modules/user/user.service';

export const GET = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);

  if (authResponse) {
    return authResponse;
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get('take') || '20') || 20));
  const searchQuery = searchParams.get('q') || '';
  const archived = searchParams.get('archived') === 'true';

  const skip = (page - 1) * take;

  // Build where clause
  const where: {
    isDeleted: boolean;
    OR?: Array<
      | { name: { contains: string; mode: 'insensitive' } }
      | { email: { contains: string; mode: 'insensitive' } }
    >;
  } = {
    isDeleted: archived,
  };

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { email: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Run count and findMany in parallel; fetch users with roles in a single query via include
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        roleAssignments: {
          where: { isDeleted: false },
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    }),
  ]);

  // Map users with their roles
  const usersWithRoles: UserWithRoles[] = users.map(user => {
    const roles: CustomRole[] = (user.roleAssignments || []).map(ra => ({
      id: ra.role.id,
      name: ra.role.name,
      description: ra.role.description,
    }));
    const { roleAssignments: _ra, ...userData } = user;
    return {
      ...userData,
      roles,
    } as UserWithRoles;
  });

  // Build paginated response
  const pageCount = Math.ceil(total / take);
  const response: GetAllUsersResponse = {
    data: usersWithRoles,
    hasNextPage: page < pageCount,
    hasPreviousPage: page > 1,
    itemCount: total,
    page,
    pageCount,
    take,
  };

  return formatSuccessResponse(response, 'Get users successfully', request);
});

export const POST = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);

  if (authResponse) {
    return authResponse;
  }

  const body = await request.json();
  const { email, name, password } = body;

  if (!email || !name || !password) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'Email, name, and password are required',
    });
  }

  const user = getUserFromRequest(request as AuthenticatedRequest);
  const newUser = await userService.createUser({
    email,
    name,
    password,
    createdBy: user.id,
  });

  // Convert to safe user (remove password)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...safeUser } = newUser;

  return formatSuccessResponse(safeUser, 'User created successfully', request);
});
