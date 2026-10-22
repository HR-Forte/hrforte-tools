'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { RefreshCcw, Plus, StickyNote, Users, LayoutGrid, List, Search, X } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/modules/note/note.query';
import { SafeNote } from '@/modules/note/note.type';
import { NoteCard, ViewMode } from './_components/note-card';
import { CreateOrEditNoteModal } from './_components/create-or-edit-note-modal';
import { ConfirmDialog as DeleteConfirmationDialog } from '@/components/confirm-dialog';
import { QueryError } from '@/components/query-error';

const NotesPage = () => {
  const { user } = useUser();
  const { data, isPending, isError, error, refetch } = useNotes();
  const myNotes = (data?.myNotes ?? []) as SafeNote[];
  const sharedNotes = (data?.sharedNotes ?? []) as SafeNote[];

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [tab, setTab] = useState<'my' | 'shared'>('my');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<SafeNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<SafeNote | null>(null);

  const handleEdit = useCallback((note: SafeNote) => {
    setEditingNote(note);
    setModalOpen(true);
  }, []);

  // Defer filtering so typing stays responsive with many markdown cards
  const deferredSearch = useDeferredValue(search);
  const activeNotes = tab === 'my' ? myNotes : sharedNotes;
  const filteredNotes = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return q ? activeNotes.filter(note => note.title.toLowerCase().includes(q)) : activeNotes;
  }, [activeNotes, deferredSearch]);

  return (
    <TooltipProvider>
      <div className='space-y-8 p-8'>
        <header className='space-y-2'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight'>Notes</h1>
              <p className='mt-1.5 flex items-center gap-2 text-sm text-muted-foreground'>
                <StickyNote className='h-4 w-4 shrink-0 text-muted-foreground/70' />
                Your personal and shared notes with markdown support.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center rounded-lg border border-border/60 p-0.5'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      aria-label='Grid view'
                    >
                      <LayoutGrid className='h-4 w-4' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Grid view</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      aria-label='List view'
                    >
                      <List className='h-4 w-4' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>List view</TooltipContent>
                </Tooltip>
              </div>
              <Button
                size='sm'
                onClick={() => { setEditingNote(null); setModalOpen(true); }}
              >
                <Plus className='mr-2 h-4 w-4' />
                New Note
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size='sm' variant='outline' onClick={() => refetch()} aria-label='Refresh notes'>
                    <RefreshCcw className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div role='tablist' aria-label='Notes' className='flex gap-1 rounded-lg bg-muted/50 p-1 w-fit'>
            <button
              type='button'
              role='tab'
              aria-selected={tab === 'my'}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                tab === 'my' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab('my')}
            >
              <span className='flex items-center gap-1.5'>
                <StickyNote className='h-3.5 w-3.5' />
                My Notes
                {myNotes.length > 0 && <span className='text-xs text-muted-foreground'>({myNotes.length})</span>}
              </span>
            </button>
            <button
              type='button'
              role='tab'
              aria-selected={tab === 'shared'}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                tab === 'shared' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTab('shared')}
            >
              <span className='flex items-center gap-1.5'>
                <Users className='h-3.5 w-3.5' />
                Shared Notes
                {sharedNotes.length > 0 && <span className='text-xs text-muted-foreground'>({sharedNotes.length})</span>}
              </span>
            </button>
          </div>

          <div className='relative w-full max-w-sm'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search note by name...'
              aria-label='Search notes'
              className='h-9 pl-9 pr-8'
            />
            {search && (
              <button
                type='button'
                onClick={() => setSearch('')}
                className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer'
                aria-label='Clear search'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            )}
          </div>
        </div>

        {isPending ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`animate-pulse rounded-xl bg-muted/50 ${viewMode === 'grid' ? 'h-36' : 'h-20'}`} />
            ))}
          </div>
        ) : isError ? (
          <QueryError error={error} onRetry={refetch} title="Couldn't load notes" />
        ) : filteredNotes.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/5 py-16 px-6 text-center'>
            <div className='rounded-full bg-muted/50 p-4'>
              {tab === 'my' ? <StickyNote className='h-10 w-10 text-muted-foreground/60' /> : <Users className='h-10 w-10 text-muted-foreground/60' />}
            </div>
            <p className='mt-4 text-sm font-medium text-foreground'>
              {search ? 'No matching notes' : tab === 'my' ? 'No notes yet' : 'No shared notes'}
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {search
                ? 'Try another title keyword.'
                : tab === 'my'
                ? 'Create your first note to get started.'
                : 'Public notes from other team members will appear here.'}
            </p>
            {tab === 'my' && !search && (
              <Button className='mt-4' size='sm' onClick={() => { setEditingNote(null); setModalOpen(true); }}>
                <Plus className='mr-2 h-4 w-4' />
                Create Note
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3'}>
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isOwner={note.userId === user?.id}
                isSharedTab={tab === 'shared'}
                viewMode={viewMode}
                onEdit={handleEdit}
                onDelete={setDeletingNote}
              />
            ))}
          </div>
        )}

        <CreateOrEditNoteModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          existing={editingNote}
          readOnly={!!editingNote && editingNote.userId !== user?.id}
          onSubmit={async data => {
            if (editingNote) {
              await updateNote.mutateAsync({ id: editingNote.id, data });
            } else {
              await createNote.mutateAsync(data);
            }
          }}
        />

        <DeleteConfirmationDialog
          open={!!deletingNote}
          onOpenChange={open => { if (!open) setDeletingNote(null); }}
          title='Delete Note'
          description={`Are you sure you want to delete "${deletingNote?.title}"? This action cannot be undone.`}
          onConfirm={async () => {
            if (deletingNote) await deleteNote.mutateAsync(deletingNote.id);
            setDeletingNote(null);
          }}
        />
      </div>
    </TooltipProvider>
  );
};

export default NotesPage;
