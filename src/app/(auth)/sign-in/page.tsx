'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/modules/auth/auth.query';
import { getAccessToken, setAccessToken, setRefreshToken } from '@/modules/auth/auth.util';
import { queryClient } from '@/lib/query/queryClient';
import { authQueries } from '@/modules/auth/auth.query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import hrForteLogo from '@/app/favicon.ico';
import { Spinner } from '@/components/ui/spinner';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInForm = z.infer<typeof signInSchema>;

const SignInContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Only allow same-origin relative paths (blocks open redirects like ?redirect=https://evil.com or //evil.com)
  const redirectParam = searchParams.get('redirect') || '';
  const redirectTo = /^\/(?![\/\\])/.test(redirectParam) ? redirectParam : '/';

  const { mutateAsync: login } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  useEffect(() => {
    const accessToken = getAccessToken();

    if (accessToken) {
      router.push(redirectTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectTo]);

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);
    try {
      const response = await login({ email: data.email, password: data.password });

      if (response.status === 200) {
        setAccessToken(response.data.accessToken);
        setRefreshToken(response.data.refreshToken);

        // Invalidate auth query to trigger refetch with new token
        queryClient.invalidateQueries({ queryKey: authQueries.detail.queryKey });

        router.push(redirectTo);
        toast.success('Sign in successfully');
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-white dark:bg-slate-700 min-h-screen flex items-center justify-center relative'>
      <div
        className='absolute inset-0 bg-cover bg-center bg-no-repeat blur-lg'
        style={{
          backgroundImage: 'url(/assets/images/hrforte-team-bg.jpg)',
        }}
      />

      {/* Sign In Card */}
      <Card className='shadow-xl border-0 backdrop-blur-sm w-full max-w-md py-8'>
        <CardHeader className='space-y-1'>
          <CardTitle className='flex flex-col items-center justify-center gap-5'>
            <Image src={hrForteLogo} alt='HR Forte' width={50} height={50} />
            <h1 className='text-2xl font-bold'>HR Forte</h1>
          </CardTitle>
        </CardHeader>

        <CardContent className='space-y-4'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            {/* Email Field */}
            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium'>
                Email
              </Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  id='email'
                  type='email'
                  autoComplete='email'
                  placeholder='Enter your email'
                  className='pl-10 h-11 border-input focus:border-blue-500 focus:ring-blue-500'
                  {...register('email')}
                />
              </div>
              {errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className='space-y-2'>
              <Label htmlFor='password' className='text-sm font-medium text-foreground'>
                Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  placeholder='Enter your password'
                  className='pl-10 pr-10 h-11 border-input focus:border-blue-500 focus:ring-blue-500'
                  {...register('password')}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground'
                >
                  {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>
              {errors.password && <p className='text-sm text-red-600'>{errors.password.message}</p>}
            </div>

            {/* Sign In Button */}
            <Button type='submit' className='w-full h-11 font-medium transition-colors' disabled={isLoading}>
              {isLoading ? (
                <div className='flex items-center'>
                  <Spinner className='w-4 h-4 mr-2' />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const SignInPage = () => (
  <Suspense fallback={<div className='min-h-screen flex items-center justify-center'>Loading...</div>}>
    <SignInContent />
  </Suspense>
);

export default SignInPage;
