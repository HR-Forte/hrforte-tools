import prisma from '@/lib/prisma/prismaClient';
import ErrorService from '@/lib/error/errorService';
import { RoleAssignment } from './role-assignment.model';

class RoleAssignmentService {
  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string): Promise<RoleAssignment> {
    // Check user and role existence in parallel
    const [user, role] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId, isDeleted: false } }),
      prisma.role.findUnique({ where: { id: roleId, isDeleted: false } }),
    ]);

    if (!user) {
      throw ErrorService.createError({ type: 'USER_NOT_FOUND' });
    }
    if (!role) {
      throw ErrorService.createError({ type: 'ROLE_NOT_FOUND' });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.roleAssignment.findFirst({
      where: {
        userId,
        roleId,
        isDeleted: false,
      },
    });

    if (existingAssignment) {
      throw ErrorService.createError({
        type: 'DUPLICATE_VALUE',
        message: 'Role is already assigned to this user',
      });
    }

    // Create role assignment
    const assignment = await prisma.roleAssignment.create({
      data: {
        userId,
        roleId,
        assignedBy,
      },
    });

    return assignment;
  }

  async unassignRoleFromUser(userId: string, roleId: string): Promise<void> {
    // Check if assignment exists
    const assignment = await prisma.roleAssignment.findFirst({
      where: {
        userId,
        roleId,
        isDeleted: false,
      },
    });

    if (!assignment) {
      throw ErrorService.createError({
        type: 'NOT_FOUND',
        message: 'Role assignment not found',
      });
    }

    // Soft delete the assignment
    await prisma.roleAssignment.update({
      where: { id: assignment.id },
      data: { isDeleted: true },
    });
  }
}

export const roleAssignmentService = new RoleAssignmentService();
