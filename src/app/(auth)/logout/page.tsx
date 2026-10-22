'use client';
import { removeAccessToken, removeRefreshToken } from '@/modules/auth/auth.util';
import { queryClient } from '@/lib/query/queryClient';
import { authQueries } from '@/modules/auth/auth.query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Clear tokens
    removeAccessToken();
    removeRefreshToken();

    // Clear all queries to ensure fresh data on next login
    queryClient.clear();

    // Invalidate auth query specifically
    queryClient.invalidateQueries({ queryKey: authQueries.detail.queryKey });

    // redirect() is for render/server code; inside an effect use the router
    router.replace('/sign-in');
  }, [router]);

  return (
    <div className='flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground' role='status'>
      <Loader2 className='h-4 w-4 animate-spin' />
      Signing out…
    </div>
  );
};

export default LogoutPage;
