import { ApiClient } from './api-client';
import { ApiClientConfig, EndpointConfig } from './types';
import { HRF_TOOL_API_URL } from '@/config';

// Partner APIs go through our authenticated proxy (/api/proxy/[endpoint]) which attaches
// their API keys server-side. Never put credentials in this file: it ships to the browser.
const proxyURL = (name: string) => `${HRF_TOOL_API_URL}/proxy/${name}`;

const defaultEndpoints: EndpointConfig[] = [
  {
    name: 'HRFORTE',
    baseURL: HRF_TOOL_API_URL,
    timeout: 10000,
  },
  {
    name: 'DEV',
    baseURL: proxyURL('DEV'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2'],
    },
  },
  {
    name: 'MIA',
    baseURL: proxyURL('MIA'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2'],
    },
  },
  {
    name: 'EVA',
    baseURL: proxyURL('EVA'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2'],
    },
  },
  {
    name: 'MAP_STAGING',
    baseURL: proxyURL('MAP_STAGING'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2'],
    },
  },
  {
    name: 'MAP_PRODUCTION',
    baseURL: proxyURL('MAP_PRODUCTION'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2'],
    },
  },
  {
    name: 'E_SMART_TIME_DEV',
    baseURL: proxyURL('E_SMART_TIME_DEV'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2'],
    },
  },
  {
    name: 'E_SMART_TIME_STAGING',
    baseURL: proxyURL('E_SMART_TIME_STAGING'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2'],
    },
  },
  {
    name: 'E_SMART_TIME_PRODUCTION',
    baseURL: proxyURL('E_SMART_TIME_PRODUCTION'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2'],
    },
  },
  {
    name: 'EVA_NET_CORE',
    baseURL: proxyURL('EVA_NET_CORE'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2', 'v3'],
    },
  },
  {
    name: 'MIA_NET_CORE',
    baseURL: proxyURL('MIA_NET_CORE'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2', 'v3'],
    },
  },
  {
    name: 'DEV_NET_CORE',
    baseURL: proxyURL('DEV_NET_CORE'),
    timeout: 15000,
    versioning: {
      strategy: 'url-prefix',
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2', 'v3'],
    },
  },
];

export function createApiClient(config?: Partial<ApiClientConfig>): ApiClient {
  const defaultConfig: ApiClientConfig = {
    endpoints: defaultEndpoints,
    defaultEndpoint: defaultEndpoints[0].name,
    timeout: 120000,
    retryAttempts: 0,
    retryDelay: 1000,
    useAxios: true, // Default to axios
  };

  const finalConfig = { ...defaultConfig, ...config };
  return new ApiClient(finalConfig);
}

export function createCustomApiClient(endpoints: EndpointConfig[], config?: Partial<ApiClientConfig>): ApiClient {
  return new ApiClient({
    endpoints,
    defaultEndpoint: endpoints[0]?.name,
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    useAxios: true,
    ...config,
  });
}
