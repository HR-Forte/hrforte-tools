/* eslint-disable @next/next/no-img-element */
'use client';
import {
  IconBrandGithub,
  IconBrain,
  IconClock,
  IconFlag,
  IconHome,
  IconLogout,
  IconPencil,
  IconUsers,
  IconVersions,
  IconLogin,
  IconLock,
  IconLink,
  IconNote,
} from '@tabler/icons-react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useState } from 'react';
import Logo from '@/app/logo.svg';
import Image from 'next/image';
import { useUser } from '@/lib/contexts/UserContext';
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler';

const links = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <IconHome className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin', 'User'],
  },
  {
    label: 'Excalidraw',
    href: '/excalidraw',
    icon: <IconPencil className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
  },
  {
    label: 'App Versions',
    href: '/app-versions',
    icon: <IconVersions className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin', 'User'],
  },
  {
    label: 'E-Smart Time',
    href: '/esmart-time',
    icon: <IconClock className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin', 'User'],
  },
  {
    label: 'AskGenie',
    href: '/askgenie',
    icon: <IconBrain className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin', 'User'],
  },
  {
    label: 'Feature Flags',
    href: '/feature-flags',
    icon: <IconFlag className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin', 'User'],
  },
  {
    label: 'Github',
    href: '/github',
    icon: <IconBrandGithub className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin'],
  },
  {
    label: 'Environment Variables',
    href: '/environment-variables',
    icon: <IconLock className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin', 'User'],
  },
  {
    label: 'Links',
    href: '/links',
    icon: <IconLink className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin', 'User'],
  },
  {
    label: 'Notes',
    href: '/notes',
    icon: <IconNote className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin', 'User'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: <IconUsers className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
    permissions: ['Admin'],
  },
];

// export const Logo = () => {
//   return (
//     <a href='#' className='relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black'>
//       <div className='h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white' />
//       <motion.span
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         className='font-medium whitespace-pre text-black dark:text-white'
//       >
//         HR Forte
//       </motion.span>
//     </a>
//   );
// };

const MainSidebar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useUser();

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className='justify-between gap-10'>
        <div className='flex flex-1 flex-col overflow-x-hidden overflow-y-auto'>
          <div className='flex items-center justify-start gap-4'>
            <Image src={Logo} alt='Logo' className='w-10 h-10' />
            {open && <span className='text-xl font-bold'>HR Forte</span>}
          </div>

          <div className='mt-8 flex flex-col gap-2'>
            {links
              .filter(link => {
                if (!link.permissions || link.permissions?.length === 0) {
                  return true;
                }

                return user?.roles?.some(role => link.permissions?.includes(role.name) || role.name === 'Admin');
              })
              .map((link, idx) => (
                <SidebarLink link={link} key={link.href} />
              ))}

            {!user ? (
              <SidebarLink
                className='w-8 h-8'
                link={{
                  label: 'Login',
                  href: '/sign-in',
                  icon: <IconLogin className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
                }}
              />
            ) : (
              <SidebarLink
                className='w-8 h-8'
                link={{
                  label: 'Logout',
                  href: '/logout',
                  icon: <IconLogout className='h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200' />,
                }}
                prefetch={false}
              />
            )}
          </div>
        </div>

        <div className='flex flex-col items-start gap-2'>
          <div className='flex items-center gap-2'>
            <ThemeTogglerButton
              className='w-8 h-8 object-cover rounded'
              variant='outline'
              direction='ltr'
              modes={['light', 'dark']}
            />
          </div>

          {user && (
            <SidebarLink
              className='w-8 h-8'
              link={{
                label: user?.name || 'User',
                href: '/profile',
                icon: user?.avatar ? (
                  <img src={user.avatar} alt='' className='w-8 h-8 object-cover rounded' />
                ) : (
                  <Image src={Logo} alt='' className='w-8 h-8 object-cover rounded' />
                ),
              }}
            />
          )}
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

export default MainSidebar;
