import { excalidrawClient } from './excalidraw.client';
import { CreateExcalidrawInput, ExcalidrawFilters } from './excalidraw.type';
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { queryClient } from '@/lib/query/queryClient';

export const excalidrawQueries = createQueryKeys('excalidraw', {
  all: null,
  list: (params: ExcalidrawFilters) => ({
    queryKey: [{ params }],
    queryFn: async () => (await excalidrawClient.getExcalidraws(params)).data.excalidraws,
  }),
  detail: (id: string) => ({
    queryKey: [{ id }],
    queryFn: async () => (await excalidrawClient.getExcalidrawById(id)).data,
  }),
});

export const useExcalidraws = (params: ExcalidrawFilters, options?: unknown) => {
  return useCustomQuery({
    topBarLoading: true,
    ...excalidrawQueries.list(params),
    ...(options || {}),
  });
};

export const useCreateExcalidraw = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: (data: CreateExcalidrawInput) => {
      return excalidrawClient.createExcalidraw(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: excalidrawQueries.list._def });
    },
    ...(options || {}),
  });
};

export const useDeleteExcalidraw = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: (id: string) => {
      return excalidrawClient.deleteExcalidraw(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: excalidrawQueries.list._def });
    },
    ...(options || {}),
  });
};
