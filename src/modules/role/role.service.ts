import prisma from '@/lib/prisma/prismaClient';
import { Role } from './role.model';
import ErrorService from '@/lib/error/errorService';

class RoleService {
  async getAllRoles(): Promise<Role[]> {
    const roles = await prisma.role.findMany({
      where: { isDeleted: false },
    });
    return roles;
  }

  async createRole(role: Role): Promise<Role> {
    const existingRole = await prisma.role.findUnique({
      where: {
        name: role.name,
      },
    });

    if (existingRole) {
      throw ErrorService.createError({ type: 'ROLE_ALREADY_EXISTS' });
    }

    const newRole = await prisma.role.create({
      data: role,
    });

    return newRole;
  }

  async getRoleById(id: string): Promise<Role> {
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw ErrorService.createError({ type: 'ROLE_NOT_FOUND' });
    }

    return role;
  }

  async getRoleByName(name: string): Promise<Role> {
    const role = await prisma.role.findUnique({
      where: { name },
    });

    if (!role) {
      throw ErrorService.createError({ type: 'ROLE_NOT_FOUND' });
    }

    return role;
  }

  async getRoles(): Promise<Role[]> {
    const roles = await prisma.role.findMany();
    return roles;
  }
}

export const roleService = new RoleService();
