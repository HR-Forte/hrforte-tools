// Client-safe configuration only. This module is bundled into the browser —
// never add secrets here; server-only values live in '@/config/server'.

// API
const url = process.env.NODE_ENV === 'production' ? 'https://tools.hrforte.com' : 'http://localhost:3000';

export const HRF_TOOL_API_URL = process.env.HRF_TOOL_API_URL || `${url}/api`;

// Local Storage
export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
