// Server-only configuration. Never import this from client components.
// Secrets have no fallbacks: an unset secret is an empty string and consumers fail closed at use time.

const env = (name: string, fallback = '') => process.env[name] || fallback;

// GitHub
export const GITHUB_API_URL = env('GITHUB_API_URL', 'https://api.github.com');
export const GITHUB_ORG = env('GITHUB_ORG', 'HR-Forte');
export const GITHUB_TOKEN = env('GITHUB_TOKEN');
export const GITHUB_QUICK_MERGE_RULES = env('GITHUB_QUICK_MERGE_RULES');

// Database
export const DATABASE_URL = env('DATABASE_URL');
export const DATABASE_URI = env('DATABASE_URI');
export const DATABASE_NAME = env('DATABASE_NAME');

// JWT
export const JWT_SECRET = env('JWT_SECRET');
export const JWT_EXPIRES_IN = env('JWT_EXPIRES_IN', '7d');
export const REFRESH_TOKEN_EXPIRES_IN = env('REFRESH_TOKEN_EXPIRES_IN', '30d');

// Bcrypt
export const BCRYPT_SALT_ROUNDS = Number(env('BCRYPT_SALT_ROUNDS', '10')) || 10;

// Environment variables encryption (32-byte hex, e.g. openssl rand -hex 32)
export const ENV_VARS_ENCRYPTION_KEY = env('ENV_VARS_ENCRYPTION_KEY');

// Partner APIs reached through /api/proxy/[endpoint]. Keys stay on the server.
type ProxyTarget = { baseURL: string; apiKey?: string };

const apiKey = (name: string) => (process.env[name] ? `ApiKey ${process.env[name]}` : undefined);

export const PROXY_TARGETS: Record<string, ProxyTarget> = {
  DEV: { baseURL: env('DEV_API_URL', 'https://dev-api-p.hrforte.com'), apiKey: apiKey('DEV_API_KEY') },
  MIA: { baseURL: env('MIA_API_URL', 'https://mia-api-p.hrforte.com'), apiKey: apiKey('MIA_API_KEY') },
  EVA: { baseURL: env('EVA_API_URL', 'https://eva-api-p.hrforte.com'), apiKey: apiKey('EVA_API_KEY') },
  MAP_STAGING: {
    baseURL: env('MAP_STAGING_API_URL', 'https://map-stag-api.hrforte.com'),
    apiKey: apiKey('MAP_STAGING_API_KEY'),
  },
  MAP_PRODUCTION: {
    baseURL: env('MAP_PRODUCTION_API_URL', 'https://map-prod-api.hrforte.com'),
    apiKey: apiKey('MAP_PRODUCTION_API_KEY'),
  },
  E_SMART_TIME_DEV: { baseURL: env('E_SMART_TIME_DEV_API_URL', 'https://esmart-api.dev.hrforte.com') },
  E_SMART_TIME_STAGING: { baseURL: env('E_SMART_TIME_STAGING_API_URL', 'https://est-mia.hrforte.info') },
  E_SMART_TIME_PRODUCTION: { baseURL: env('E_SMART_TIME_PRODUCTION_API_URL', 'https://esmart-api.eva.hrforte.com') },
  EVA_NET_CORE: { baseURL: env('EVA_NET_CORE_API_URL', 'https://eva-netcore-p.hrforte.com') },
  MIA_NET_CORE: { baseURL: env('MIA_NET_CORE_API_URL', 'https://mia-netcore-p.hrforte.com') },
  DEV_NET_CORE: { baseURL: env('DEV_NET_CORE_API_URL', 'https://dev-netcore-p.hrforte.com') },
};
