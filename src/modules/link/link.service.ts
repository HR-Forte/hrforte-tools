import prisma from '@/lib/prisma/prismaClient';
import ErrorService from '@/lib/error/errorService';
import { CreateLinkInput, UpdateLinkInput, CreateLinkGroupInput, UpdateLinkGroupInput } from './link.type';

export class LinkService {
  async getLinksGrouped() {
    const groups = await prisma.linkGroup.findMany({
      where: { isDeleted: false },
      include: {
        links: {
          where: { isDeleted: false },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    const ungrouped = await prisma.link.findMany({
      where: { isDeleted: false, groupId: null },
      orderBy: { order: 'asc' },
    });

    return { groups, ungrouped };
  }

  async getLinkGroups() {
    return prisma.linkGroup.findMany({
      where: { isDeleted: false },
      orderBy: { order: 'asc' },
    });
  }

  async createLink(data: CreateLinkInput) {
    try {
      return await prisma.link.create({
        data: {
          title: data.title,
          url: data.url,
          description: data.description,
          favicon: data.favicon,
          groupId: data.groupId ?? undefined,
          order: data.order ?? 0,
          createdBy: data.createdBy,
        },
      });
    } catch {
      throw ErrorService.createError({ type: 'QUERY_FAILED' });
    }
  }

  async updateLink(id: string, data: UpdateLinkInput) {
    const existing = await prisma.link.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Link not found' });
    }
    return prisma.link.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async deleteLink(id: string, deletedBy?: string) {
    const existing = await prisma.link.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Link not found' });
    }
    return prisma.link.update({
      where: { id },
      data: { isDeleted: true, updatedBy: deletedBy, updatedAt: new Date() },
    });
  }

  async createLinkGroup(data: CreateLinkGroupInput) {
    try {
      return await prisma.linkGroup.create({
        data: {
          name: data.name,
          description: data.description,
          order: data.order ?? 0,
          createdBy: data.createdBy,
        },
      });
    } catch {
      throw ErrorService.createError({ type: 'QUERY_FAILED' });
    }
  }

  async updateLinkGroup(id: string, data: UpdateLinkGroupInput) {
    const existing = await prisma.linkGroup.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Link group not found' });
    }
    return prisma.linkGroup.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async deleteLinkGroup(id: string, deletedBy?: string) {
    const existing = await prisma.linkGroup.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Link group not found' });
    }

    // Ungroup all links in this group
    await prisma.link.updateMany({
      where: { groupId: id, isDeleted: false },
      data: { groupId: null },
    });

    return prisma.linkGroup.update({
      where: { id },
      data: { isDeleted: true, updatedBy: deletedBy, updatedAt: new Date() },
    });
  }
}

export const linkService = new LinkService();
