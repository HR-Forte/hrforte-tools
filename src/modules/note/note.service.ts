import prisma from '@/lib/prisma/prismaClient';
import ErrorService from '@/lib/error/errorService';
import { CreateNoteInput, UpdateNoteInput, SafeNote } from './note.type';

export class NoteService {
  async getNotes(userId: string) {
    const [myNotes, sharedNotes] = await Promise.all([
      prisma.note.findMany({
        where: { userId, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.note.findMany({
        where: { isPublic: true, isDeleted: false, NOT: { userId } },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const userIds = [...new Set(sharedNotes.map(n => n.userId))];
    const users = userIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userMap = new Map(users.map(u => [u.id, u.name ?? 'Unknown']));

    const mapNote = (note: typeof myNotes[number], name?: string): SafeNote => ({
      id: note.id,
      title: note.title,
      content: note.content,
      isPublic: note.isPublic,
      userId: note.userId,
      userName: name,
      isDeleted: note.isDeleted,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      createdBy: note.createdBy,
      updatedBy: note.updatedBy,
    });

    return {
      myNotes: myNotes.map(n => mapNote(n)),
      sharedNotes: sharedNotes.map(n => mapNote(n, userMap.get(n.userId))),
    };
  }

  async getNoteById(id: string) {
    return prisma.note.findFirst({ where: { id, isDeleted: false } });
  }

  async createNote(data: CreateNoteInput) {
    try {
      return await prisma.note.create({
        data: {
          title: data.title,
          content: data.content,
          isPublic: data.isPublic ?? false,
          userId: data.userId!,
          createdBy: data.createdBy,
        },
      });
    } catch {
      throw ErrorService.createError({ type: 'QUERY_FAILED' });
    }
  }

  async updateNote(id: string, data: UpdateNoteInput) {
    const existing = await prisma.note.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Note not found' });
    }
    return prisma.note.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async deleteNote(id: string, deletedBy?: string) {
    const existing = await prisma.note.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      throw ErrorService.createError({ type: 'NOT_FOUND', message: 'Note not found' });
    }
    return prisma.note.update({
      where: { id },
      data: { isDeleted: true, updatedBy: deletedBy, updatedAt: new Date() },
    });
  }
}

export const noteService = new NoteService();
