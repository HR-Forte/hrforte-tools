'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Search,
  Edit2,
  Save,
  X,
  Shield,
  User as UserIcon,
  UserPlus,
  RefreshCcwIcon,
  Plus,
  ArrowRightLeft,
  Loader2,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  useGetAllUsers,
  useUpdateUser,
  useAssignRole,
  useUnassignRole,
  useCreateUser,
  useArchiveUser,
  useUnarchiveUser,
} from '@/modules/user/user.query';
import { useGetAllRoles } from '@/modules/role/role.query';
import { UpdateUserInput, CreateUserInput } from '@/modules/user/user.type';
import { UserWithRoles } from '@/modules/user/user.model';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { validateEmail, validatePassword, validateName } from '@/modules/user/user.util';
import { format } from 'date-fns';
import { useUser } from '@/lib/contexts/UserContext';
import { QueryError } from '@/components/query-error';

const UsersPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [roleAssignmentSnapshot, setRoleAssignmentUser] = useState<UserWithRoles | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [userToArchive, setUserToArchive] = useState<UserWithRoles | null>(null);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [userToUnarchive, setUserToUnarchive] = useState<UserWithRoles | null>(null);
  const [isUnarchiveDialogOpen, setIsUnarchiveDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [unassigningRoleId, setUnassigningRoleId] = useState<string | null>(null);

  const { user: currentUser } = useUser();

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when switching between active/archived
  React.useEffect(() => {
    setPage(1);
  }, [showArchived]);

  const {
    data: usersData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllUsers({
    page,
    take: 10,
    q: searchQuery || undefined,
    archived: showArchived,
  });
  const { data: allRoles = [] } = useGetAllRoles();

  const users = usersData?.data || [];
  // Read the user from fresh query data so the roles dialog reflects assign/unassign immediately
  const roleAssignmentUser = users.find(u => u.id === roleAssignmentSnapshot?.id) ?? roleAssignmentSnapshot;
  const { mutateAsync: createUser, isPending: isCreatingUser } = useCreateUser();
  const { mutateAsync: updateUser, isPending: isUpdatingUser } = useUpdateUser();
  const { mutateAsync: assignRole, isPending: isAssigningRole } = useAssignRole();
  const { mutateAsync: unassignRole, isPending: isUnassigningRole } = useUnassignRole();
  const { mutateAsync: archiveUser, isPending: isArchivingUser } = useArchiveUser();
  const { mutateAsync: unarchiveUser, isPending: isUnarchivingUser } = useUnarchiveUser();

  const isRoleActionInProgress = isAssigningRole || isUnassigningRole;

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
    watch,
  } = useForm<UpdateUserInput & { confirmPassword: string }>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const editPassword = watch('password');
  const isEditingSelf = editingUser?.id === currentUser?.id;

  const {
    handleSubmit: handleCreateSubmit,
    register: registerCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
    watch: watchCreate,
  } = useForm<CreateUserInput & { confirmPassword: string }>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const createPassword = watchCreate('password');

  // No need for client-side filtering since we're doing server-side search

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditClick = (user: UserWithRoles) => {
    setEditingUser(user);
    reset({
      name: user.name || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleRoleAssignmentClick = (user: UserWithRoles) => {
    setRoleAssignmentUser(user);
    setIsRoleDialogOpen(true);
  };

  const handleArchiveClick = (user: UserWithRoles) => {
    setUserToArchive(user);
    setIsArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!userToArchive?.id) return;
    try {
      await archiveUser(userToArchive.id);
      setIsArchiveDialogOpen(false);
      setUserToArchive(null);
    } catch (error) {
      console.error('Error archiving user:', error);
    }
  };

  const handleUnarchiveClick = (user: UserWithRoles) => {
    setUserToUnarchive(user);
    setIsUnarchiveDialogOpen(true);
  };

  const handleUnarchiveConfirm = async () => {
    if (!userToUnarchive?.id) return;
    try {
      await unarchiveUser(userToUnarchive.id);
      setIsUnarchiveDialogOpen(false);
      setUserToUnarchive(null);
    } catch (error) {
      console.error('Error unarchiving user:', error);
    }
  };

  const onCreateSubmit = async (data: CreateUserInput & { confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!validatePassword(data.password)) {
      toast.error('Password must be at least 8 characters with at least one letter and one number');
      return;
    }

    if (!validateEmail(data.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!validateName(data.name)) {
      toast.error('Name must be between 2 and 100 characters');
      return;
    }

    try {
      await createUser({
        email: data.email,
        name: data.name,
        password: data.password,
      });
      setIsCreateDialogOpen(false);
      resetCreate();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const onSubmit = async ({ name, password }: UpdateUserInput & { confirmPassword: string }) => {
    if (!editingUser?.id) return;

    try {
      await updateUser({ id: editingUser.id, data: { name, ...(password ? { password } : {}) } });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast.success(password ? 'User updated and password reset successfully' : 'User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleAssignRole = async (roleId: string) => {
    if (!roleAssignmentUser?.id) return;

    const role = allRoles.find(r => r.id === roleId);

    try {
      await assignRole({
        userId: roleAssignmentUser.id,
        roleId,
        role: role ? { id: role.id, name: role.name, description: role.description } : undefined,
      });
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleUnassignRole = async (roleId: string) => {
    if (!roleAssignmentUser?.id) return;

    setUnassigningRoleId(roleId);
    try {
      await unassignRole({ userId: roleAssignmentUser.id, roleId });
    } catch (error) {
      console.error('Error unassigning role:', error);
    } finally {
      setUnassigningRoleId(null);
    }
  };

  const columns: ColumnDef<UserWithRoles>[] = [
    {
      header: 'User',
      accessorKey: 'name',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className='flex items-center gap-3'>
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name || 'Avatar'} className='h-10 w-10 rounded-full object-cover' />
            ) : (
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground'>
                {getInitials(user.name || user.email)}
              </div>
            )}
            <div>
              <div className='font-medium'>{user.name || 'No name'}</div>
              <div className='text-sm text-muted-foreground'>{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Roles',
      accessorKey: 'roles',
      cell: ({ row }) => {
        const roles = row.original.roles || [];
        return (
          <div className='flex flex-wrap gap-1.5'>
            {roles.length > 0 ? (
              roles.map(role => (
                <Badge key={role.id} variant='outline' className='gap-1'>
                  <Shield className='h-3 w-3' />
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className='text-sm text-muted-foreground'>No roles</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return (
          <div className='text-sm text-muted-foreground'>{date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A'}</div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = currentUser?.id === user.id;
        if (showArchived) {
          const isUnarchivingThisUser = isUnarchivingUser && userToUnarchive?.id === user.id;
          return (
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleUnarchiveClick(user)}
                disabled={isUnarchivingUser}
                className='gap-1.5'
                title='Restore user'
              >
                {isUnarchivingThisUser ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <ArchiveRestore className='h-4 w-4' />
                )}
                Restore
              </Button>
            </div>
          );
        }
        return (
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleEditClick(user)}
              className='h-8 w-8 p-0'
              aria-label={`Edit ${user.name || user.email}`}
              title='Edit user'
            >
              <Edit2 className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleRoleAssignmentClick(user)}
              className='h-8 w-8 p-0'
              aria-label={`Manage roles for ${user.name || user.email}`}
              title='Manage roles'
            >
              <Shield className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleArchiveClick(user)}
              disabled={isCurrentUser}
              className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive disabled:opacity-50'
              title={isCurrentUser ? 'Cannot archive yourself' : 'Archive user'}
              aria-label={`Archive ${user.name || user.email}`}
            >
              <Archive className='h-4 w-4' />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className='flex h-full flex-col overflow-y-auto bg-background p-6 md:p-8'>
      <div className='mx-auto w-full max-w-7xl space-y-6'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='flex items-center justify-between'
        >
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Users Management</h1>
            <p className='mt-2 text-muted-foreground'>
              {showArchived ? 'View and restore archived users' : 'Manage all users, assign roles, and update information'}
            </p>
          </div>
          {!showArchived && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className='gap-2'>
              <Plus className='h-4 w-4' />
              Add User
            </Button>
          )}
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className='flex flex-col gap-4'>
                <div className='flex items-center gap-2'>
                  <div
                    role='tablist'
                    aria-label='User status'
                    className='inline-flex items-center rounded-lg border bg-muted/30 p-1'
                  >
                    <button
                      type='button'
                      role='tab'
                      aria-selected={!showArchived}
                      onClick={() => setShowArchived(false)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        !showArchived
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Active
                    </button>
                    <button
                      type='button'
                      role='tab'
                      aria-selected={showArchived}
                      onClick={() => setShowArchived(true)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        showArchived
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Archived
                    </button>
                  </div>
                </div>
                <div className='flex items-center justify-between gap-4'>
                  <div className='flex-1 relative max-w-md'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      placeholder='Search users by name, email, or role...'
                      aria-label='Search users'
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      className='pl-9'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='text-sm text-muted-foreground'>
                      {usersData?.itemCount || 0} {usersData?.itemCount === 1 ? 'user' : 'users'}
                      {(usersData?.pageCount ?? 0) > 1 && ` • Page ${page} of ${usersData?.pageCount}`}
                    </div>
                    <Button
                      variant='outline'
                      size='icon'
                      onClick={() => refetch()}
                      disabled={isFetching}
                      aria-label='Refresh users'
                    >
                      <RefreshCcwIcon className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className='h-24 text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <QueryError error={error} onRetry={refetch} title="Couldn't load users" />
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className='hover:bg-muted/50'
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className='h-24 text-center'>
                        <div className='flex flex-col items-center gap-2'>
                          <UserIcon className='h-8 w-8 text-muted-foreground' />
                          <p className='text-sm text-muted-foreground'>No users found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {usersData && usersData.pageCount > 0 && (
              <div className='border-t px-6 py-4'>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => !isLoading && page > 1 && setPage(page - 1)}
                        className={
                          page <= 1 || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(usersData.pageCount, 10) }).map((_, index) => {
                      // Show page numbers around current page
                      let pageNum: number;
                      if (usersData.pageCount <= 10) {
                        pageNum = index + 1;
                      } else if (page <= 5) {
                        pageNum = index + 1;
                      } else if (page >= usersData.pageCount - 4) {
                        pageNum = usersData.pageCount - 9 + index;
                      } else {
                        pageNum = page - 5 + index;
                      }

                      return (
                        <PaginationItem key={index}>
                          <PaginationLink
                            onClick={() => !isLoading && setPage(pageNum)}
                            isActive={page === pageNum}
                            className={isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-accent'}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => !isLoading && page < usersData.pageCount && setPage(page + 1)}
                        className={
                          page >= usersData.pageCount || isLoading
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer hover:bg-accent'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <form onSubmit={handleCreateSubmit(onCreateSubmit)}>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the system</DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='create-name'>Full Name</Label>
                  <Input
                    id='create-name'
                    {...registerCreate('name', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      maxLength: { value: 100, message: 'Name must be at most 100 characters' },
                    })}
                    placeholder='Enter user name'
                    aria-invalid={createErrors.name ? 'true' : 'false'}
                  />
                  {createErrors.name && <p className='text-xs text-destructive'>{createErrors.name.message}</p>}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='create-email'>Email Address</Label>
                  <Input
                    id='create-email'
                    type='email'
                    {...registerCreate('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    placeholder='Enter email address'
                    aria-invalid={createErrors.email ? 'true' : 'false'}
                  />
                  {createErrors.email && <p className='text-xs text-destructive'>{createErrors.email.message}</p>}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='create-password'>Password</Label>
                  <Input
                    id='create-password'
                    type='password'
                    {...registerCreate('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      validate: value =>
                        validatePassword(value) || 'Password must contain at least one letter and one number',
                    })}
                    placeholder='Enter password'
                    aria-invalid={createErrors.password ? 'true' : 'false'}
                  />
                  {createErrors.password && <p className='text-xs text-destructive'>{createErrors.password.message}</p>}
                  <p className='text-xs text-muted-foreground'>
                    Password must be at least 8 characters with at least one letter and one number
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='create-confirm-password'>Confirm Password</Label>
                  <Input
                    id='create-confirm-password'
                    type='password'
                    {...registerCreate('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === createPassword || 'Passwords do not match',
                    })}
                    placeholder='Confirm password'
                    aria-invalid={createErrors.confirmPassword ? 'true' : 'false'}
                  />
                  {createErrors.confirmPassword && (
                    <p className='text-xs text-destructive'>{createErrors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetCreate();
                  }}
                  disabled={isCreatingUser}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isCreatingUser}>
                  <UserPlus className='mr-2 h-4 w-4' />
                  {isCreatingUser ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user information</DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Full Name</Label>
                  <Input
                    id='name'
                    {...register('name', {
                      required: 'Name is required',
                    })}
                    placeholder='Enter user name'
                    aria-invalid={errors.name ? 'true' : 'false'}
                  />
                  {errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email Address</Label>
                  <Input
                    id='email'
                    type='email'
                    {...register('email')}
                    placeholder='Enter email'
                    disabled
                    className='bg-muted'
                  />
                  <p className='text-xs text-muted-foreground'>Email cannot be changed</p>
                </div>
                {!isEditingSelf && (
                  <>
                    <div className='space-y-2'>
                      <Label htmlFor='edit-password'>New Password</Label>
                      <Input
                        id='edit-password'
                        type='password'
                        autoComplete='new-password'
                        {...register('password', {
                          validate: value =>
                            !value ||
                            validatePassword(value) ||
                            'Password must be at least 8 characters with at least one letter and one number',
                        })}
                        placeholder='Leave blank to keep current password'
                        aria-invalid={errors.password ? 'true' : 'false'}
                      />
                      {errors.password && <p className='text-xs text-destructive'>{errors.password.message}</p>}
                      <p className='text-xs text-muted-foreground'>
                        Set a new password for this user. Leave blank to keep the current one.
                      </p>
                    </div>
                    {editPassword && (
                      <div className='space-y-2'>
                        <Label htmlFor='edit-confirm-password'>Confirm New Password</Label>
                        <Input
                          id='edit-confirm-password'
                          type='password'
                          autoComplete='new-password'
                          {...register('confirmPassword', {
                            validate: value => value === editPassword || 'Passwords do not match',
                          })}
                          placeholder='Confirm new password'
                          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                        />
                        {errors.confirmPassword && (
                          <p className='text-xs text-destructive'>{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingUser(null);
                  }}
                  disabled={isUpdatingUser}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isUpdatingUser}>
                  <Save className='mr-2 h-4 w-4' />
                  {isUpdatingUser ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Role Assignment Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className='max-w-2xl gap-0 p-0 overflow-hidden'>
            <DialogHeader className='px-6 pt-6 pb-4 space-y-4'>
              <div className='flex items-start gap-4'>
                {roleAssignmentUser?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={roleAssignmentUser.avatar}
                    alt={roleAssignmentUser.name || 'Avatar'}
                    className='h-14 w-14 rounded-full object-cover ring-2 ring-border'
                  />
                ) : (
                  <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary ring-2 ring-border'>
                    {roleAssignmentUser
                      ? getInitials(roleAssignmentUser.name || roleAssignmentUser.email)
                      : '--'}
                  </div>
                )}
                <div className='min-w-0 flex-1 space-y-1'>
                  <DialogTitle className='text-xl'>Manage Roles</DialogTitle>
                  <DialogDescription className='text-base'>
                    <span className='font-medium text-foreground'>
                      {roleAssignmentUser?.name || 'No name'}
                    </span>
                    <span className="text-muted-foreground"> · {roleAssignmentUser?.email}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex border-t">
              {/* Current Roles */}
              <div className="flex flex-1 flex-col border-r">
                <div className='flex items-center gap-2 px-6 py-3 bg-muted/30'>
                  <Shield className='h-4 w-4 text-muted-foreground' />
                  <Label className='text-sm font-medium'>Assigned</Label>
                  {roleAssignmentUser?.roles && roleAssignmentUser.roles.length > 0 && (
                    <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                      {roleAssignmentUser.roles.length}
                    </span>
                  )}
                </div>
                <div className='max-h-[280px] overflow-y-auto p-4'>
                  {roleAssignmentUser?.roles && roleAssignmentUser.roles.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {roleAssignmentUser.roles.map(role => (
                        <div
                          key={role.id}
                          className='group flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-colors hover:border-destructive/50 hover:bg-destructive/5'
                        >
                          <Shield className='h-4 w-4 shrink-0 text-muted-foreground' />
                          <div className='min-w-0'>
                            <p className='font-medium text-sm'>{role.name}</p>
                            {role.description && (
                              <p className='truncate text-xs text-muted-foreground max-w-[180px]'>
                                {role.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 shrink-0 p-0 opacity-70 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive'
                            onClick={() => handleUnassignRole(role.id)}
                            disabled={isRoleActionInProgress}
                            title='Remove role'
                            aria-label={`Remove role ${role.name}`}
                          >
                            {unassigningRoleId === role.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <X className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center'>
                      <Shield className='mb-2 h-10 w-10 text-muted-foreground/50' />
                      <p className='text-sm font-medium text-muted-foreground'>No roles assigned</p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Add roles from the panel on the right
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Roles */}
              <div className='flex flex-1 flex-col'>
                <div className='flex items-center gap-2 px-6 py-3 bg-muted/30'>
                  <ArrowRightLeft className='h-4 w-4 text-muted-foreground' />
                  <Label className='text-sm font-medium'>Available to add</Label>
                </div>
                <div className='max-h-[280px] overflow-y-auto p-4'>
                  {(() => {
                    const availableRoles = allRoles.filter(
                      role => !roleAssignmentUser?.roles?.some(r => r.id === role.id),
                    );
                    return availableRoles.length > 0 ? (
                      <div className='space-y-2'>
                        {availableRoles.map(role => (
                          <button
                            key={role.id}
                            type='button'
                            onClick={() => handleAssignRole(role.id)}
                            disabled={isRoleActionInProgress}
                            className={cn(
                              'flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-all',
                              'hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              'disabled:pointer-events-none disabled:opacity-50',
                            )}
                          >
                            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10'>
                              <UserPlus className='h-4 w-4 text-primary' />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p className='font-medium text-sm'>{role.name}</p>
                              {role.description && (
                                <p className='mt-0.5 line-clamp-2 text-xs text-muted-foreground'>
                                  {role.description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center'>
                        <UserPlus className='mb-2 h-10 w-10 text-muted-foreground/50' />
                        <p className='text-sm font-medium text-muted-foreground'>
                          All roles assigned
                        </p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          Remove roles to make them available again
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <DialogFooter className='border-t px-6 py-4'>
              <Button variant='outline' onClick={() => setIsRoleDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive User Confirmation Dialog */}
        <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive User</DialogTitle>
              <DialogDescription>
                Are you sure you want to archive{' '}
                <span className='font-medium text-foreground'>
                  {userToArchive?.name || userToArchive?.email}
                </span>
                ? The user will no longer be able to sign in and will be hidden from the users list.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsArchiveDialogOpen(false);
                  setUserToArchive(null);
                }}
                disabled={isArchivingUser}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={handleArchiveConfirm}
                disabled={isArchivingUser}
              >
                {isArchivingUser ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Archiving...
                  </>
                ) : (
                  <>
                    <Archive className='mr-2 h-4 w-4' />
                    Archive User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unarchive User Confirmation Dialog */}
        <Dialog open={isUnarchiveDialogOpen} onOpenChange={setIsUnarchiveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore User</DialogTitle>
              <DialogDescription>
                Are you sure you want to restore{' '}
                <span className='font-medium text-foreground'>
                  {userToUnarchive?.name || userToUnarchive?.email}
                </span>
                ? The user will be able to sign in again and will appear in the active users list.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsUnarchiveDialogOpen(false);
                  setUserToUnarchive(null);
                }}
                disabled={isUnarchivingUser}
              >
                Cancel
              </Button>
              <Button onClick={handleUnarchiveConfirm} disabled={isUnarchivingUser}>
                {isUnarchivingUser ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Restoring...
                  </>
                ) : (
                  <>
                    <ArchiveRestore className='mr-2 h-4 w-4' />
                    Restore User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UsersPage;
