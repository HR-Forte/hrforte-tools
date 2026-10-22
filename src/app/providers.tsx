'use client';

import { QueryProvider } from '@/lib/query/QueryProvider';
import { ThemeProvider } from '@/components/theme-providers';
import { UserProvider } from '@/lib/contexts/UserContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='light'
      enableSystem={false}
      disableTransitionOnChange
      storageKey='hrforte-theme'
    >
      <QueryProvider>
        <UserProvider>{children}</UserProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
