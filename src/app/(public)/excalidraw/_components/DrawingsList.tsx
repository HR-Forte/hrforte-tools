'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/lib/contexts/UserContext';
import { useDeleteExcalidraw, useExcalidraws } from '@/modules/excalidraw/excalidraw.query';
import { ExcalidrawSummary } from '@/modules/excalidraw/excalidraw.type';
import { RefreshCcw, Trash2, FolderOpen, Calendar, Clock, FileText, Pencil, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DrawingsListProps {
  onSelectDrawing?: (drawing: ExcalidrawSummary) => void;
  onDeleted?: (id: string) => void;
}

export const DrawingsList = ({ onSelectDrawing, onDeleted }: DrawingsListProps) => {
  const { user } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { mutate: deleteExcalidraw, isPending: isDeleting } = useDeleteExcalidraw();
  const {
    data: excalidraws = [],
    isLoading: excalidrawLoading,
    error: excalidrawError,
    refetch,
  } = useExcalidraws(
    {
      limit: 20,
      userId: user?.id,
    },
    // Anonymous visitors can draw locally; the saved-drawings list needs a signed-in user.
    { enabled: !!user?.id }
  );

  const handleDelete = (id: string) => {
    deleteExcalidraw(id, { onSuccess: () => onDeleted?.(id) });
  };

  const handleSelectDrawing = (drawingData: ExcalidrawSummary) => {
    if (onSelectDrawing) {
      onSelectDrawing(drawingData);
    }
  };

  // Filter drawings based on search query
  const filteredDrawings = excalidraws?.filter(drawing =>
    drawing.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <Card className='shadow-none w-full h-full'>
        <CardContent className='flex flex-col items-center justify-center min-h-[400px] gap-4'>
          <FileText className='w-16 h-16 text-muted-foreground' />
          <CardTitle className='text-xl'>Authentication Required</CardTitle>
          <CardDescription>Please sign in to view and load your cloud drawings</CardDescription>
          <Button
            onClick={() => router.push(`/sign-in?redirect=${encodeURIComponent('/excalidraw')}`)}
          >
            Sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='shadow-none w-full h-full'>
      <CardHeader className='flex flex-col gap-5'>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='text-2xl font-bold'>My Drawings</CardTitle>
            <CardDescription className='mt-1'>Manage and organize your Excalidraw drawings</CardDescription>
          </div>
          <Badge variant='outline' className='text-sm'>
            {filteredDrawings?.length || 0} {filteredDrawings?.length === 1 ? 'Drawing' : 'Drawings'}
          </Badge>
        </div>

        <div className='flex items-center gap-3 w-full'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
            <Input
              placeholder='Search drawings by title...'
              aria-label='Search drawings'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>
          <Separator orientation='vertical' className='h-8' />
          <Button variant='outline' onClick={() => refetch()} disabled={excalidrawLoading} aria-label='Refresh drawings'>
            <RefreshCcw className={excalidrawLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {excalidrawLoading ? (
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='animate-pulse border rounded-lg p-4'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1 space-y-3'>
                    <div className='h-5 bg-muted rounded w-1/3'></div>
                    <div className='h-4 bg-muted rounded w-1/4'></div>
                    <div className='h-4 bg-muted rounded w-1/5'></div>
                  </div>
                  <div className='flex gap-2'>
                    <div className='h-9 w-20 bg-muted rounded'></div>
                    <div className='h-9 w-20 bg-muted rounded'></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : excalidrawError ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='rounded-full bg-destructive/10 p-3 mb-4'>
              <FileText className='w-8 h-8 text-destructive' />
            </div>
            <CardTitle className='text-lg mb-2 text-destructive'>Error Loading Drawings</CardTitle>
            <CardDescription className='mb-4 text-center max-w-md'>
              {excalidrawError.message || 'An unexpected error occurred while loading your drawings'}
            </CardDescription>
            <Button onClick={() => refetch()} variant='outline'>
              <RefreshCcw className='mr-2' />
              Try Again
            </Button>
          </div>
        ) : filteredDrawings?.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='rounded-full bg-muted p-4 mb-4'>
              <FileText className='w-12 h-12 text-muted-foreground' />
            </div>
            <CardTitle className='text-xl mb-2'>{searchQuery ? 'No Drawings Found' : 'No Drawings Yet'}</CardTitle>
            <CardDescription className='text-center max-w-md'>
              {searchQuery ? (
                <>No drawings match &ldquo;{searchQuery}&rdquo;. Try a different search term.</>
              ) : (
                <>Draw something on the canvas, then use the Save button in the toolbar to keep it here.</>
              )}
            </CardDescription>
            {searchQuery && (
              <Button variant='outline' className='mt-4' onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className='grid gap-3 grid-cols-1 max-h-[calc(100vh-200px)] overflow-y-auto'>
            {filteredDrawings?.map(drawing => (
              <Card
                key={drawing.id}
                className='border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-md'
              >
                <CardContent className='px-4'>
                  <div className='flex justify-between items-start gap-4'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Pencil className='w-4 h-4 text-primary flex-shrink-0' />
                        <h4 className='font-semibold text-lg truncate'>{drawing.title}</h4>
                      </div>

                      <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground'>
                        <div className='flex items-center gap-1.5 text-xs'>
                          <Calendar className='w-3.5 h-3.5' />
                          <span>Created {formatDistanceToNow(new Date(drawing.createdAt), { addSuffix: true })}</span>
                        </div>
                        <div className='flex items-center gap-1.5 text-xs'>
                          <Clock className='w-3.5 h-3.5' />
                          <span>Updated {formatDistanceToNow(new Date(drawing.updatedAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>

                    <div className='flex gap-2 flex-shrink-0'>
                      {onSelectDrawing && (
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => handleSelectDrawing(drawing)}
                          aria-label={`Open ${drawing.title}`}
                        >
                          <FolderOpen className='w-4 h-4' />
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant='destructive' size='sm' disabled={isDeleting} aria-label={`Delete ${drawing.title}`}>
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Drawing</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete{' '}
                              <span className='font-semibold text-foreground'>&ldquo;{drawing.title}&rdquo;</span>? This
                              action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant='outline'>Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button
                                variant='destructive'
                                onClick={() => handleDelete(drawing.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className='w-4 h-4 mr-2' />
                                Delete
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
