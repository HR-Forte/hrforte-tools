import { createQueryKeys } from '@lukemorales/query-key-factory';
import { useCustomQuery } from '@/lib/hooks/useCustomQuery';
import { useCustomMutation } from '@/lib/hooks/useCustomMutation';
import { queryClient } from '@/lib/query/queryClient';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { AppError } from '@/lib/error/appError';
import { linkClient } from './link.client';
import { CreateLinkInput, UpdateLinkInput, CreateLinkGroupInput, UpdateLinkGroupInput } from './link.type';

function getErrorMessage(error: unknown): string {
  const err = error as AxiosError<AppError>;
  return err.response?.data?.message ?? err.message ?? 'Operation failed';
}

export const linkQueries = createQueryKeys('link', {
  grouped: () => ({
    queryKey: ['grouped'],
    queryFn: async () => (await linkClient.getLinksGrouped()).data,
  }),
  groups: () => ({
    queryKey: ['groups'],
    queryFn: async () => (await linkClient.getLinkGroups()).data,
  }),
});

function invalidateLinks() {
  queryClient.invalidateQueries({ queryKey: linkQueries.grouped().queryKey });
  queryClient.invalidateQueries({ queryKey: linkQueries.groups().queryKey });
}

export const useLinksGrouped = (options?: unknown) => {
  return useCustomQuery({
    topBarLoading: true,
    ...linkQueries.grouped(),
    ...(options || {}),
  });
};

export const useLinkGroups = (options?: unknown) => {
  return useCustomQuery({
    topBarLoading: false,
    ...linkQueries.groups(),
    ...(options || {}),
  });
};

export const useCreateLink = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (data: Omit<CreateLinkInput, 'createdBy'>) =>
      (await linkClient.createLink(data)).data,
    onSuccess: () => {
      invalidateLinks();
      toast.success('Link created');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useUpdateLink = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async ({ id, data }: { id: string; data: Omit<UpdateLinkInput, 'updatedBy'> }) =>
      (await linkClient.updateLink(id, data)).data,
    onSuccess: () => {
      invalidateLinks();
      toast.success('Link updated');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useDeleteLink = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (id: string) => {
      await linkClient.deleteLink(id);
    },
    onSuccess: () => {
      invalidateLinks();
      toast.success('Link deleted');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useCreateLinkGroup = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (data: Omit<CreateLinkGroupInput, 'createdBy'>) =>
      (await linkClient.createLinkGroup(data)).data,
    onSuccess: () => {
      invalidateLinks();
      toast.success('Group created');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useUpdateLinkGroup = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async ({ id, data }: { id: string; data: Omit<UpdateLinkGroupInput, 'updatedBy'> }) =>
      (await linkClient.updateLinkGroup(id, data)).data,
    onSuccess: () => {
      invalidateLinks();
      toast.success('Group updated');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};

export const useDeleteLinkGroup = (options?: unknown) => {
  return useCustomMutation({
    topBarLoading: true,
    mutationFn: async (id: string) => {
      await linkClient.deleteLinkGroup(id);
    },
    onSuccess: () => {
      invalidateLinks();
      toast.success('Group deleted');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
    ...(options || {}),
  });
};
