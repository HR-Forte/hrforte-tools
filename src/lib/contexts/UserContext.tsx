'use client';
import { useGetProfile } from '@/modules/auth/auth.query';
import { getAccessToken } from '@/modules/auth/auth.util';
import { UserWithRoles } from '@/modules/user/user.model';
import { QueryObserverResult } from '@tanstack/react-query';
import { queryClient } from '@/lib/query/queryClient';
import { authQueries } from '@/modules/auth/auth.query';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ACCESS_TOKEN_KEY } from '@/config';

interface UserContextType {
  user?: UserWithRoles;
  loading: boolean;
  refetch: () => Promise<QueryObserverResult>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());

  // Listen for access token changes: custom event (same tab) and storage event (other tabs)
  useEffect(() => {
    const checkToken = () => setAccessToken(getAccessToken());

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_KEY || e.key === null) checkToken();
    };

    window.addEventListener('tokenChanged', checkToken);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('tokenChanged', checkToken);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Refetch the profile whenever the token changes (skip the initial mount; the query fetches itself)
  const previousToken = useRef(accessToken);
  useEffect(() => {
    if (previousToken.current === accessToken) return;
    previousToken.current = accessToken;
    queryClient.invalidateQueries({ queryKey: authQueries.detail.queryKey });
  }, [accessToken]);

  const { data, isFetching, refetch } = useGetProfile({
    options: {
      enabled: !!accessToken,
    },
  });

  const value = useMemo(() => ({ user: data, loading: isFetching, refetch }), [data, isFetching, refetch]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
