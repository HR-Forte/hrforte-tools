import { User } from '@/lib/generated/prisma';
import prisma from '@/lib/prisma/prismaClient';
import { CreateUserInput, UpdateUserInput } from './user.type';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '@/config/server';
import ErrorService from '@/lib/error/errorService';

export class UserService {
  async createUser(data: CreateUserInput): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, Number(BCRYPT_SALT_ROUNDS));

      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          createdBy: data.createdBy,
        },
      });
      return user;
    } catch (error) {
      throw ErrorService.createError({ type: 'USER_CREATION_FAILED' });
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });
      return user;
    } catch (error) {
      throw ErrorService.createError({ type: 'QUERY_FAILED' });
    }
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw ErrorService.createError({ type: 'USER_NOT_FOUND' });
    }

    const updateData: UpdateUserInput = {};

    if (data.avatar) {
      updateData.avatar = data.avatar;
    }

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.email) {
      updateData.email = data.email;
    }

    if (data.password) {
      // If password is being changed, verify current password
      if (data.currentPassword) {
        const isPasswordValid = await bcrypt.compare(data.currentPassword, existingUser.password);
        if (!isPasswordValid) {
          throw ErrorService.createError({ type: 'INVALID_CREDENTIALS' });
        }
      }
      updateData.password = await bcrypt.hash(data.password, Number(BCRYPT_SALT_ROUNDS));
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return user;
  }

  async archiveUser(id: string, archivedBy: string): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw ErrorService.createError({ type: 'USER_NOT_FOUND' });
    }

    if (existingUser.isDeleted) {
      throw ErrorService.createError({
        type: 'INVALID_CHOICE',
        message: 'User is already archived',
      });
    }

    return prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedBy: archivedBy,
      },
    });
  }

  async unarchiveUser(id: string, unarchivedBy: string): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw ErrorService.createError({ type: 'USER_NOT_FOUND' });
    }

    if (!existingUser.isDeleted) {
      throw ErrorService.createError({
        type: 'INVALID_CHOICE',
        message: 'User is not archived',
      });
    }

    return prisma.user.update({
      where: { id },
      data: {
        isDeleted: false,
        updatedBy: unarchivedBy,
      },
    });
  }
}

// Export a singleton instance
export const userService = new UserService();
