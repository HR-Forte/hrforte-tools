import { Excalidraw } from '@/lib/generated/prisma';
import prisma from '@/lib/prisma/prismaClient';
import { CreateExcalidrawInput, UpdateExcalidrawInput, ExcalidrawFilters } from './excalidraw.type';
import ErrorService from '@/lib/error/errorService';

export class ExcalidrawService {
  async createExcalidraw(data: CreateExcalidrawInput): Promise<Excalidraw> {
    try {
      const excalidraw = await prisma.excalidraw.create({
        data: {
          title: data.title,
          elements: data.elements,
          appState: data.appState,
          metadata: data.metadata,
          userId: data.userId,
          createdBy: data.createdBy,
        },
      });
      return excalidraw;
    } catch (error) {
      throw ErrorService.createError({ type: 'QUERY_FAILED' });
    }
  }

  async getExcalidrawById(id: string): Promise<Excalidraw | null> {
    const excalidraw = await prisma.excalidraw.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    return excalidraw;
  }

  async updateExcalidraw(id: string, data: UpdateExcalidrawInput): Promise<Excalidraw | null> {
    const excalidraw = await prisma.excalidraw.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return excalidraw;
  }

  async deleteExcalidraw(id: string, deletedBy?: string): Promise<Excalidraw | null> {
    const excalidraw = await prisma.excalidraw.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedBy: deletedBy,
        updatedAt: new Date(),
      },
    });
    return excalidraw;
  }

  async getExcalidraws(filters: ExcalidrawFilters, skip: number, limit: number) {
    const where: Record<string, unknown> = {
      isDeleted: false,
    };

    if (filters.title) {
      where.title = { contains: filters.title, mode: 'insensitive' };
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    // The list never needs scene data (can be large); open a drawing via getExcalidrawById
    const excalidraws = await prisma.excalidraw.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      omit: { elements: true, appState: true, metadata: true },
    });

    return excalidraws;
  }

  async getExcalidrawsCount(filters: ExcalidrawFilters): Promise<number> {
    const where: Record<string, unknown> = {
      isDeleted: false,
    };

    if (filters.title) {
      where.title = { contains: filters.title, mode: 'insensitive' };
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    const count = await prisma.excalidraw.count({ where });
    return count;
  }
}

// Export a singleton instance
export const excalidrawService = new ExcalidrawService();
