export interface SafeNote {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  userId: string;
  userName?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  isPublic?: boolean;
  userId?: string;
  createdBy?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  isPublic?: boolean;
  updatedBy?: string;
}

export interface NoteFilters {
  tab?: 'my' | 'shared';
}

export interface NotesResult {
  myNotes: SafeNote[];
  sharedNotes: SafeNote[];
}
