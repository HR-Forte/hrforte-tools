'use client';
import { cn } from '@/lib/utils';
import React, { useState, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconMenu2, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>{children}</SidebarContext.Provider>;
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  );
};

export const DesktopSidebar = ({ className, children, ...props }: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          'h-full px-4 py-4 hidden  md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] shrink-0',
          className
        )}
        animate={{
          width: animate ? (open ? '300px' : '60px') : '300px',
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          'h-10 px-4 py-4 flex flex-row md:hidden  items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full'
        )}
        {...props}
      >
        <div className='flex justify-end z-20 w-full'>
          <button
            type='button'
            aria-label='Open navigation menu'
            aria-expanded={open}
            className='rounded p-1 text-neutral-800 dark:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            onClick={() => setOpen(!open)}
          >
            <IconMenu2 />
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              className={cn(
                'fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between',
                className
              )}
            >
              <button
                type='button'
                aria-label='Close navigation menu'
                className='absolute right-10 top-10 z-50 rounded p-1 text-neutral-800 dark:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </button>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  prefetch,
  ...props
}: { link: Links; className?: string; prefetch?: boolean } & Omit<React.ComponentProps<'a'>, 'href'>) => {
  const { open, animate, setOpen } = useSidebar();
  const pathname = usePathname();
  const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setOpen(false);
    }
    onClick?.(e);
  };

  // Real links: prefetching, middle-click/new tab, keyboard focus. The label is hidden when the
  // desktop sidebar is collapsed, so expose it as the accessible name.
  return (
    <Link
      href={link.href}
      prefetch={prefetch}
      aria-label={link.label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center justify-start gap-2 group/sidebar py-2 hover:cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'font-semibold',
        className
      )}
      onClick={handleClick}
      onFocus={() => setOpen(true)}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className='text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0'
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
