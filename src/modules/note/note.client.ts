import { BaseClient } from '../_base/base.client';
import { ApiResponse } from '@/lib/api/types';
import { SafeNote, CreateNoteInput, UpdateNoteInput, NotesResult } from './note.type';

export class NoteClient extends BaseClient {
  private readonly basePath = 'notes';

  async getNotes() {
    return this.get<ApiResponse<NotesResult>>(`${this.basePath}`);
  }

  async getNoteById(id: string) {
    return this.get<ApiResponse<SafeNote>>(`${this.basePath}/${id}`);
  }

  async createNote(data: Omit<CreateNoteInput, 'userId' | 'createdBy'>) {
    return this.post<ApiResponse<SafeNote>>(`${this.basePath}`, data);
  }

  async updateNote(id: string, data: Omit<UpdateNoteInput, 'updatedBy'>) {
    return this.put<ApiResponse<SafeNote>>(`${this.basePath}/${id}`, data);
  }

  async deleteNote(id: string) {
    return this.delete<ApiResponse<null>>(`${this.basePath}/${id}`);
  }
}

export const noteClient = new NoteClient();
