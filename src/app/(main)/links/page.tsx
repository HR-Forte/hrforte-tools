'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { RefreshCcw, Plus, Link2, FolderPlus } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import {
  useLinksGrouped,
  useCreateLink,
  useUpdateLink,
  useDeleteLink,
  useCreateLinkGroup,
  useUpdateLinkGroup,
  useDeleteLinkGroup,
} from '@/modules/link/link.query';
import { SafeLink, SafeLinkGroup } from '@/modules/link/link.type';
import { LinkGroupSection } from './_components/link-group-section';
import { LinkCard } from './_components/link-card';
import { CreateOrEditLinkModal } from './_components/create-or-edit-link-modal';
import { CreateOrEditGroupModal } from './_components/create-or-edit-group-modal';
import { ConfirmDialog as DeleteConfirmationDialog } from '@/components/confirm-dialog';
import { QueryError } from '@/components/query-error';

const LinksPage = () => {
  const { user } = useUser();
  const isAdmin = user?.roles?.some(r => r.name === 'Admin') ?? false;

  const { data, isPending, isError, error, isFetching, refetch } = useLinksGrouped();
  const groups = (data?.groups ?? []) as SafeLinkGroup[];
  const ungrouped = (data?.ungrouped ?? []) as SafeLink[];

  const createLink = useCreateLink();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const createGroup = useCreateLinkGroup();
  const updateGroup = useUpdateLinkGroup();
  const deleteGroup = useDeleteLinkGroup();

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SafeLink | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SafeLinkGroup | null>(null);
  const [deletingLink, setDeletingLink] = useState<SafeLink | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<SafeLinkGroup | null>(null);

  const allGroups = groups.map(g => ({ ...g, links: g.links ?? [] }));

  const handleEditLink = (link: SafeLink) => {
    setEditingLink(link);
    setLinkModalOpen(true);
  };

  const handleEditGroup = (group: SafeLinkGroup) => {
    setEditingGroup(group);
    setGroupModalOpen(true);
  };

  const totalLinks = groups.reduce((sum, g) => sum + (g.links?.length ?? 0), 0) + ungrouped.length;

  return (
    <TooltipProvider>
      <div className='space-y-8 p-8'>
        <header className='space-y-2'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight'>Links</h1>
              <p className='mt-1.5 flex items-center gap-2 text-sm text-muted-foreground'>
                <Link2 className='h-4 w-4 shrink-0 text-muted-foreground/70' />
                Useful links shared across the team.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {isAdmin && (
                <>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }}
                  >
                    <FolderPlus className='mr-2 h-4 w-4' />
                    New Group
                  </Button>
                  <Button
                    size='sm'
                    onClick={() => { setEditingLink(null); setLinkModalOpen(true); }}
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    Add Link
                  </Button>
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size='sm' variant='outline' onClick={() => refetch()} disabled={isFetching} aria-label='Refresh links'>
                    <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {isPending ? (
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-24 animate-pulse rounded-xl bg-muted/50' />
            ))}
          </div>
        ) : isError ? (
          <QueryError error={error} onRetry={refetch} title="Couldn't load links" />
        ) : totalLinks === 0 && groups.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/5 py-16 px-6 text-center'>
            <div className='rounded-full bg-muted/50 p-4'>
              <Link2 className='h-10 w-10 text-muted-foreground/60' />
            </div>
            <p className='mt-4 text-sm font-medium text-foreground'>No links yet</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {isAdmin ? 'Start by adding useful links for the team.' : 'Links will appear here once an admin adds them.'}
            </p>
            {isAdmin && (
              <Button className='mt-4' size='sm' onClick={() => { setEditingLink(null); setLinkModalOpen(true); }}>
                <Plus className='mr-2 h-4 w-4' />
                Add Link
              </Button>
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            {allGroups.map(group => (
              <LinkGroupSection
                key={group.id}
                group={group}
                isAdmin={isAdmin}
                onEditLink={handleEditLink}
                onDeleteLink={setDeletingLink}
                onEditGroup={handleEditGroup}
                onDeleteGroup={setDeletingGroup}
              />
            ))}

            {ungrouped.length > 0 && (
              <div className='space-y-2'>
                {groups.length > 0 && <h3 className='text-sm font-semibold text-muted-foreground px-1'>Ungrouped</h3>}
                {ungrouped.map(link => (
                  <LinkCard key={link.id} link={link} isAdmin={isAdmin} onEdit={handleEditLink} onDelete={setDeletingLink} />
                ))}
              </div>
            )}
          </div>
        )}

        <CreateOrEditLinkModal
          open={linkModalOpen}
          onOpenChange={setLinkModalOpen}
          existing={editingLink}
          groups={allGroups}
          onSubmit={async data => {
            if (editingLink) {
              await updateLink.mutateAsync({ id: editingLink.id, data });
            } else {
              await createLink.mutateAsync(data);
            }
          }}
        />

        <CreateOrEditGroupModal
          open={groupModalOpen}
          onOpenChange={setGroupModalOpen}
          existing={editingGroup}
          onSubmit={async data => {
            if (editingGroup) {
              await updateGroup.mutateAsync({ id: editingGroup.id, data });
            } else {
              await createGroup.mutateAsync(data);
            }
          }}
        />

        <DeleteConfirmationDialog
          open={!!deletingLink}
          onOpenChange={open => { if (!open) setDeletingLink(null); }}
          title='Delete Link'
          description={`Are you sure you want to delete "${deletingLink?.title}"? This action cannot be undone.`}
          onConfirm={async () => {
            if (deletingLink) await deleteLink.mutateAsync(deletingLink.id);
            setDeletingLink(null);
          }}
        />

        <DeleteConfirmationDialog
          open={!!deletingGroup}
          onOpenChange={open => { if (!open) setDeletingGroup(null); }}
          title='Delete Group'
          description={`Are you sure you want to delete the group "${deletingGroup?.name}"? Links in this group will become ungrouped.`}
          onConfirm={async () => {
            if (deletingGroup) await deleteGroup.mutateAsync(deletingGroup.id);
            setDeletingGroup(null);
          }}
        />
      </div>
    </TooltipProvider>
  );
};

export default LinksPage;
