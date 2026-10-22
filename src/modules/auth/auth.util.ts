import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/config';

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

export const getAccessToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (accessToken: string): void => {
  if (!isBrowser) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  // Dispatch custom event for same-tab listeners
  window.dispatchEvent(new CustomEvent('tokenChanged', { detail: { token: accessToken } }));
};

export const removeAccessToken = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  // Dispatch custom event for same-tab listeners
  window.dispatchEvent(new CustomEvent('tokenChanged', { detail: { token: null } }));
};

export const getRefreshToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (refreshToken: string): void => {
  if (!isBrowser) return;
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const removeRefreshToken = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
