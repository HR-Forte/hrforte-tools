// ===== HTTP METHODS =====
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ===== ENDPOINT NAMES =====
export type EndpointName =
  | 'HRFORTE'
  | 'DEV'
  | 'MIA'
  | 'EVA'
  | 'MAP_STAGING'
  | 'MAP_PRODUCTION'
  | 'E_SMART_TIME_DEV'
  | 'E_SMART_TIME_STAGING'
  | 'E_SMART_TIME_PRODUCTION'
  | 'EVA_NET_CORE'
  | 'MIA_NET_CORE'
  | 'DEV_NET_CORE';

// ===== VERSIONING TYPES =====
export type ApiVersion = string; // e.g., 'v1', 'v2', '1.0', '2.1'

export type VersioningStrategy =
  | 'url-prefix' // /v1/auth/login
  | 'url-suffix' // /auth/v1/login
  | 'header' // API-Version: v1
  | 'query' // /auth/login?version=v1
  | 'accept-header'; // Accept: application/vnd.api.v1+json

export interface VersionConfig {
  strategy: VersioningStrategy;
  defaultVersion?: ApiVersion;
  supportedVersions?: ApiVersion[];
  headerName?: string; // for header strategy
  queryParamName?: string; // for query strategy
  mediaType?: string; // for accept-header strategy
}

// ===== REQUEST CONFIGURATION =====
export interface RequestConfig<TData = unknown> {
  method: HttpMethod;
  url: string;
  data?: TData;
  pathParams?: Record<string, unknown>;
  queryParams?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  useAxios?: boolean;
  endpoint?: EndpointName;
  version?: ApiVersion | null;
}

// ===== API RESPONSE =====
export interface ApiResponse<TResponse = unknown> {
  data: TResponse;
  status: number;
  headers: Record<string, string>;
  message?: string;
}

// ===== ENDPOINT CONFIGURATION =====
export interface EndpointConfig {
  name: EndpointName;
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  versioning?: VersionConfig; // Version configuration per endpoint
}

// ===== CLIENT CONFIGURATION =====
export interface ApiClientConfig {
  endpoints: EndpointConfig[];
  defaultEndpoint?: EndpointName;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  useAxios?: boolean; // true for axios, false for fetch
}

export interface HRForteApiResponse<TResponse = unknown> {
  data: TResponse[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemCount: number;
  page: number;
  pageCount: number;
  take: number;
}
