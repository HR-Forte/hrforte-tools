'use client';
import { cn } from '@/lib/utils';
import MainSidebar from '../MainSidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/modules/auth/auth.util';
import { useUser } from '@/lib/contexts/UserContext';
import { isAdmin } from '@/modules/user/user.util';

// Pages whose APIs are admin-only (keep in sync with MainSidebar permissions)
const ADMIN_ROUTES = ['/users', '/github'];

const MainContainer = ({ children, isPublic = false }: { children: React.ReactNode; isPublic?: boolean }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const isAdminRoute = ADMIN_ROUTES.some(route => pathname === route || pathname?.startsWith(`${route}/`));
  const isAllowed = !isAdminRoute || isAdmin(user);

  useEffect(() => {
    const token = !!getAccessToken();
    setHasToken(token);

    if (!token && !isPublic) {
      // Come back to the requested page after signing in
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname || '/')}`);
    }
  }, [isPublic, router, pathname]);

  useEffect(() => {
    if (user && isAdminRoute && !isAdmin(user)) router.replace('/dashboard');
  }, [user, isAdminRoute, router]);

  // Don't render protected pages (and fire their queries) before auth/role is known
  const canRender = isPublic || (hasToken && (!isAdminRoute || (user && isAllowed)));

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800',
        'h-screen'
      )}
    >
      <MainSidebar />

      <main className='flex-1 overflow-y-auto rounded-tl-2xl border border-neutral-200 dark:border-neutral-700'>
        {canRender ? children : null}
      </main>
    </div>
  );
};

export default MainContainer;
