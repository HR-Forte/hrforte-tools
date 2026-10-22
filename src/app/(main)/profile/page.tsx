'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useUser } from '@/lib/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User, Mail, Edit2, Save, X, Shield, Calendar, Building2, Upload, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useUpdateUser } from '@/modules/user/user.query';
import { UpdateUserInput } from '@/modules/user/user.type';
import { queryClient } from '@/lib/query/queryClient';
import { authQueries } from '@/modules/auth/auth.query';
import { toast } from 'sonner';
import { validatePassword } from '@/modules/user/user.util';
import { format } from 'date-fns';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AVATAR_SIZE = 256;

// Avatars are stored inline as data URLs and sent with every user list/profile payload,
// so shrink them to a small square-bounded image before uploading.
async function resizeImageToDataUrl(file: File, maxSize: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/webp', 0.85);
}

const ProfilePage = () => {
  const { user, loading, refetch } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: updateUser, isPending: isUpdatingUser } = useUpdateUser();

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    handleSubmit: handlePasswordSubmit,
    register: registerPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
    watch,
  } = useForm<ChangePasswordForm>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateUserInput) => {
    if (!user?.id) return;

    try {
      await updateUser({ id: user.id, data });
      // Invalidate auth profile query to refetch updated user data
      queryClient.invalidateQueries({ queryKey: authQueries.detail.queryKey });
      // Refetch user profile
      await refetch();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      // useUpdateUser already toasts the error
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handleChangePassword = async (data: ChangePasswordForm) => {
    if (!user?.id) return;

    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (!validatePassword(data.newPassword)) {
      toast.error('Password must be at least 8 characters with at least one letter and one number');
      return;
    }

    try {
      await updateUser({
        id: user.id,
        data: {
          password: data.newPassword,
          currentPassword: data.currentPassword,
        },
      });

      await refetch();
      setIsChangePasswordOpen(false);
      resetPassword();
      toast.success('Password changed successfully');
    } catch {
      // useUpdateUser already toasts the error
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const avatar = await resizeImageToDataUrl(file, AVATAR_SIZE);
      await updateUser({ id: user.id, data: { avatar } });
      queryClient.invalidateQueries({ queryKey: authQueries.detail.queryKey });
      await refetch();
      toast.success('Avatar updated successfully');
    } catch (error) {
      // API errors are already toasted by useUpdateUser; only report local image failures here
      if (!(error instanceof Error && 'isAxiosError' in error)) toast.error('Failed to process image');
      console.error('Error updating avatar:', error);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = ''; // allow picking the same file again
    }
  };

  if (loading && !user) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-muted-foreground'>Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-muted-foreground'>No user data available</div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='flex h-full flex-col overflow-y-auto bg-background p-6 md:p-8'>
      <div className='mx-auto w-full max-w-4xl space-y-6'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='space-y-4'
        >
          <div className='flex items-center justify-between'>
            <h1 className='text-3xl font-bold tracking-tight'>Profile</h1>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant='outline' size='sm'>
                <Edit2 className='mr-2 h-4 w-4' />
                Edit Profile
              </Button>
            )}
          </div>
        </motion.div>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className='overflow-hidden border-2 p-0'>
            <div className='bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8'>
              <div className='flex flex-col items-center gap-6 md:flex-row md:items-start'>
                {/* Avatar */}
                <motion.button
                  type='button'
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className='relative group cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed'
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  aria-label='Change avatar'
                >
                  {(user as { avatar?: string }).avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(user as { avatar?: string }).avatar}
                      alt={user.name || 'Avatar'}
                      className='h-24 w-24 rounded-full object-cover shadow-lg ring-4 ring-background md:h-32 md:w-32'
                    />
                  ) : (
                    <div className='flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg ring-4 ring-background md:h-32 md:w-32 md:text-3xl'>
                      {getInitials(user.name || '--')}
                    </div>
                  )}
                  <div className='absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-background ring-2 ring-background group-hover:bg-primary group-hover:text-primary-foreground transition-colors'>
                    {isUploadingAvatar ? (
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    ) : (
                      <Upload className='h-4 w-4 text-primary group-hover:text-primary-foreground' />
                    )}
                  </div>
                </motion.button>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleAvatarChange}
                  className='hidden'
                />

                {/* User Info */}
                <div className='flex-1 text-center md:text-left'>
                  <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>{user.name || '--'}</h2>
                  <p className='mt-2 flex items-center justify-center gap-2 text-muted-foreground md:justify-start'>
                    <Mail className='h-4 w-4' />
                    {user.email}
                  </p>
                  <div className='mt-4 flex flex-wrap items-center justify-center gap-4 md:justify-start'>
                    <div className='flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm'>
                      <Shield className='h-4 w-4 text-muted-foreground' />
                      <span className='text-muted-foreground'>{user.roles?.map(role => role.name).join(', ') || 'Not provided'}</span>
                    </div>
                    <div className='flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm'>
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                      <span className='text-muted-foreground'>
                        {user.createdAt ? `Joined ${format(new Date(user.createdAt), 'MMM d, yyyy')}` : 'Joined Recently'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Profile Details */}
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Personal Information
                </CardTitle>
                <CardDescription>Your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='name'>Full Name</Label>
                      <Input
                        id='name'
                        {...register('name', {
                          required: 'Name is required',
                        })}
                        placeholder='Enter your name'
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
                        placeholder='Enter your email'
                        disabled
                        className='bg-muted'
                      />
                      <p className='text-xs text-muted-foreground'>Email cannot be changed</p>
                    </div>
                    <div className='flex gap-2 pt-2'>
                      <Button type='submit' size='sm' className='flex-1' disabled={isUpdatingUser}>
                        <Save className='mr-2 h-4 w-4' />
                        {isUpdatingUser ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type='button'
                        onClick={handleCancel}
                        variant='outline'
                        size='sm'
                        className='flex-1'
                        disabled={isUpdatingUser}
                      >
                        <X className='mr-2 h-4 w-4' />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className='space-y-1'>
                      <Label className='text-xs text-muted-foreground'>User ID</Label>
                      <p className='text-sm font-mono text-muted-foreground'>{user.id || 'Not available'}</p>
                    </div>
                    <Separator />
                    <div className='space-y-1'>
                      <Label className='text-xs text-muted-foreground'>Email Address</Label>
                      <p className='text-sm font-medium'>{user.email || 'Not provided'}</p>
                    </div>
                    <Separator />
                    <div className='space-y-1'>
                      <Label className='text-xs text-muted-foreground'>Full Name</Label>
                      <p className='text-sm font-medium'>{user.name || 'Not provided'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  Account Information
                </CardTitle>
                <CardDescription>Your account settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-1'>
                  <Label className='text-xs text-muted-foreground'>Account Status</Label>
                  <div className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full bg-green-500'></div>
                    <p className='text-sm font-medium'>Active</p>
                  </div>
                </div>
                <Separator />
                <div className='space-y-1'>
                  <Label className='text-xs text-muted-foreground'>Role</Label>
                  <p className='text-sm font-medium'>{user.roles?.map(role => role.name).join(', ') || 'Not provided'}</p>
                </div>
                <Separator />
                <div className='space-y-1'>
                  <Label className='text-xs text-muted-foreground'>Last Updated</Label>
                  <p className='text-sm text-muted-foreground'>
                    {user.updatedAt ? format(new Date(user.updatedAt), 'MMM d, yyyy') : '--'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common profile-related actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-3'>
                <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <Lock className='mr-2 h-4 w-4' />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handlePasswordSubmit(handleChangePassword)}>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new password. Make sure it&apos;s at least 8
                          characters with at least one letter and one number.
                        </DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4 py-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='currentPassword'>Current Password</Label>
                          <Input
                            id='currentPassword'
                            type='password'
                            autoComplete='current-password'
                            {...registerPassword('currentPassword', {
                              required: 'Current password is required',
                            })}
                            placeholder='Enter current password'
                            aria-invalid={passwordErrors.currentPassword ? 'true' : 'false'}
                          />
                          {passwordErrors.currentPassword && (
                            <p className='text-xs text-destructive'>{passwordErrors.currentPassword.message}</p>
                          )}
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='newPassword'>New Password</Label>
                          <Input
                            id='newPassword'
                            type='password'
                            autoComplete='new-password'
                            {...registerPassword('newPassword', {
                              required: 'New password is required',
                              validate: value =>
                                validatePassword(value) ||
                                'Password must be at least 8 characters with at least one letter and one number',
                            })}
                            placeholder='Enter new password'
                            aria-invalid={passwordErrors.newPassword ? 'true' : 'false'}
                          />
                          {passwordErrors.newPassword && (
                            <p className='text-xs text-destructive'>{passwordErrors.newPassword.message}</p>
                          )}
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                          <Input
                            id='confirmPassword'
                            type='password'
                            autoComplete='new-password'
                            {...registerPassword('confirmPassword', {
                              required: 'Please confirm your new password',
                              validate: value => value === newPassword || 'Passwords do not match',
                            })}
                            placeholder='Confirm new password'
                            aria-invalid={passwordErrors.confirmPassword ? 'true' : 'false'}
                          />
                          {passwordErrors.confirmPassword && (
                            <p className='text-xs text-destructive'>{passwordErrors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => {
                            setIsChangePasswordOpen(false);
                            resetPassword();
                          }}
                          disabled={isUpdatingUser}
                        >
                          Cancel
                        </Button>
                        <Button type='submit' disabled={isUpdatingUser}>
                          {isUpdatingUser ? 'Changing...' : 'Change Password'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
