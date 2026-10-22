import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { Providers } from './providers';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: 'HR Forte', template: '%s · HR Forte' },
  description: 'HR Forte Tools for HR Professionals',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <Providers>
          <NextTopLoader
            color='#ff6600'
            height={3}
            crawlSpeed={200}
            showSpinner={true}
            shadow='0 0 10px rgba(0,0,0,0.2), 0 0 5px rgba(0,0,0,0.1)'
          />
          {children}
          <Toaster position='top-center' duration={3000} closeButton />
        </Providers>
      </body>
    </html>
  );
}
