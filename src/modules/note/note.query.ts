import { createQueryKeys } from '@lukemorales/query-key-factory';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { queryClient } from '@/lib/query/queryClient';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { AppError } from '@/lib/error/appError';
import { noteClient } from './note.client';
import { CreateNoteInput, UpdateNoteInput } from './note.type';

function getErrorMessage(error: unknown): string {
  const err = error as AxiosError<AppError>;
  return err.response?.data?.message ?? err.message ?? 'Operation failed';
}

export const noteQueries = createQueryKeys('note', {
  list: () => ({
    queryKey: ['list'],
    queryFn: async () => (await noteClient.getNotes()).data,
  }),
  detail: (id: string) => ({
    queryKey: ['detail', id],
    queryFn: async () => (await noteClient.getNoteById(id)).data,
  }),
});

function invalidateNotes() {
  queryClient.invalidateQueries({ queryKey: noteQueries.list().queryKey });
}

export const useNotes = (options?: unknown) => {
  return useCustomQuery({
    topBarLoading: true,
    ...noteQueries.list(),
    ...(options || {}),
  });
};

export const useNote = (id: string | null, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: false,
    ...noteQueries.detail(id ?? ''),
    enabled: Boolean(id),
    ...(options || {}),
  });
};

export const useCreateNote = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (data: Omit<CreateNoteInput, 'userId' | 'createdBy'>) =>
      (await noteClient.createNote(data)).data,
    onSuccess: () => {
      invalidateNotes();
      toast.success('Note created');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useUpdateNote = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async ({ id, data }: { id: string; data: Omit<UpdateNoteInput, 'updatedBy'> }) =>
      (await noteClient.updateNote(id, data)).data,
    onSuccess: () => {
      invalidateNotes();
      toast.success('Note updated');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useDeleteNote = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (id: string) => {
      await noteClient.deleteNote(id);
    },
    onSuccess: () => {
      invalidateNotes();
      toast.success('Note deleted');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};
