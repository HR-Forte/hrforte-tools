import { headers } from 'next/headers';

export async function getFullUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  try {
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    return `${protocol}://${host}`;
  } catch {
    return 'http://localhost:3000'; // fallback
  }
}
