import {
  getAccessToken,
  getRefreshToken,
  removeAccessToken,
  removeRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/modules/auth/auth.util';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiClientConfig, ApiResponse, EndpointConfig, EndpointName, RequestConfig } from './types';
import ErrorService from '@/lib/error/errorService';
import { VersionManager } from './version-manager';
import { ERROR } from '../error/constants';
import { joinUrl } from '../utils/joinUrl';
import { HRF_TOOL_API_URL } from '@/config';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshSubscriber {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

interface RefreshTokenResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

interface AuthError extends Error {
  response?: {
    status: number;
    data?: {
      error?: string;
    };
  };
}

interface NetworkError extends Error {
  code?: string;
}

export class ApiClient {
  private defaultEndpoint: string;
  private endpoints: Map<string, EndpointConfig>;
  private axiosInstances: Map<string, AxiosInstance>;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private useAxios: boolean;
  private versionManager: VersionManager;
  private isRefreshing: boolean = false;
  private refreshSubscribers: RefreshSubscriber[] = [];
  private axiosInstance!: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.endpoints = new Map();
    this.axiosInstances = new Map();

    // Initialize endpoints
    config.endpoints.forEach(endpoint => {
      this.endpoints.set(endpoint.name, endpoint);

      // Create axios instance for each endpoint if using axios
      if (config.useAxios) {
        this.axiosInstance = axios.create({
          baseURL: endpoint.baseURL,
          timeout: endpoint.timeout || config.timeout || 10000,
          headers: {
            'Content-Type': 'application/json',
            ...endpoint.headers,
          },
        });

        // Add request interceptor for authentication
        this.axiosInstance.interceptors.request.use(
          config => {
            const accessToken = getAccessToken();
            if (!config.headers.Authorization && accessToken) {
              config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
          },
          error => {
            return Promise.reject(error);
          }
        );

        // Add response interceptor for error handling
        this.axiosInstance.interceptors.response.use(
          response => response,
          async (error: AxiosError) => {
            return await this.handleAxiosError(error);
          }
        );

        this.axiosInstances.set(endpoint.name, this.axiosInstance);
      }
    });

    // Initialize version manager
    this.versionManager = new VersionManager();

    // Configure versioning for each endpoint
    config.endpoints.forEach(endpoint => {
      if (endpoint.versioning) {
        this.versionManager.setEndpointVersion(endpoint.name, endpoint.versioning);
      }
    });

    this.defaultEndpoint = config.defaultEndpoint || config.endpoints[0]?.name || '';
    this.timeout = config.timeout || 10000;
    this.retryAttempts = config.retryAttempts || 0;
    this.retryDelay = config.retryDelay || 1000;
    this.useAxios = config.useAxios !== false;
  }

  private addRefreshSubscriber(subscriber: RefreshSubscriber): void {
    this.refreshSubscribers.push(subscriber);
  }

  private notifyRefreshSubscribers(token: string): void {
    this.refreshSubscribers.forEach(subscriber => subscriber.resolve(token));
    this.refreshSubscribers = [];
  }

  private notifyRefreshError(error: Error): void {
    this.refreshSubscribers.forEach(subscriber => subscriber.reject(error));
    this.refreshSubscribers = [];
  }

  // Add a new endpoint
  public addEndpoint(config: EndpointConfig): void {
    this.endpoints.set(config.name, config);

    if (this.useAxios) {
      const axiosInstance = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout || this.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      });

      // Add interceptors
      axiosInstance.interceptors.request.use(
        config => {
          const accessToken = getAccessToken();
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
          return config;
        },
        error => {
          return Promise.reject(error);
        }
      );

      axiosInstance.interceptors.response.use(
        response => response,
        async (error: AxiosError) => {
          return await this.handleAxiosError(error);
        }
      );

      this.axiosInstances.set(config.name, axiosInstance);
    }
  }

  /**
   * Remove an endpoint
   */
  public removeEndpoint(name: string): void {
    this.endpoints.delete(name);
    this.axiosInstances.delete(name);
  }

  /**
   * Get endpoint configuration
   */
  public getEndpoint(name: EndpointName): EndpointConfig | undefined {
    return this.endpoints.get(name);
  }

  /**
   * List all endpoints
   */
  public listEndpoints(): EndpointName[] {
    return Array.from(this.endpoints.keys()) as EndpointName[];
  }

  /**
   * Set default endpoint
   */
  public setDefaultEndpoint(name: EndpointName): void {
    if (this.endpoints.has(name)) {
      this.defaultEndpoint = name;
    } else {
      throw new Error(`Endpoint '${name}' not found`);
    }
  }

  /**
   * Get current default endpoint
   */
  public getCurrentDefaultEndpoint(): EndpointName {
    return this.defaultEndpoint as EndpointName;
  }

  public async request<TResponse = unknown, TData = unknown>(config: RequestConfig<TData>): Promise<TResponse> {
    const endpointName = config.endpoint || this.defaultEndpoint;
    const endpoint = this.endpoints.get(endpointName);

    if (!endpoint) {
      throw ErrorService.createError({ type: 'CONFIGURATION_ERROR' });
    }

    // Apply versioning transformations
    if (config.version) {
      const versionedUrl = this.versionManager.buildVersionedUrl(
        endpoint.baseURL,
        config.url,
        endpointName,
        config.version
      );
      config.url = versionedUrl.replace(endpoint.baseURL, '');

      const versionedHeaders = this.versionManager.buildVersionedHeaders(
        config.headers || {},
        endpointName,
        config.version
      );
      config.headers = versionedHeaders;

      const versionedParams = this.versionManager.buildVersionedParams(
        config.queryParams || {},
        endpointName,
        config.version
      );
      config.queryParams = versionedParams;
    }

    // Create final config with versioned values
    const finalConfig: RequestConfig<TData> = config;

    // Use the useAxios flag from the config if provided, otherwise use the default
    const useAxios = typeof config.useAxios === 'boolean' ? config.useAxios : this.useAxios;

    if (useAxios) {
      return this.requestWithAxios<TResponse, TData>(finalConfig, endpointName);
    } else {
      return this.requestWithFetch<TResponse, TData>(finalConfig, endpointName);
    }
  }

  private async requestWithAxios<TResponse, TData = unknown>(
    config: RequestConfig<TData>,
    endpointName: string
  ): Promise<TResponse> {
    const axiosInstance = this.axiosInstances.get(endpointName);

    if (!axiosInstance) {
      throw ErrorService.createError({ type: 'CONFIGURATION_ERROR' });
    }

    // Join baseURL and configUrl with a slash
    const url = new URL(joinUrl(axiosInstance.defaults.baseURL, config.url));

    if (config.pathParams) {
      Object.entries(config.pathParams).forEach(([key, value]) => {
        url.pathname = url.pathname.replace(`:${key}`, String(value));
      });
    }

    const axiosConfig: AxiosRequestConfig = {
      method: config.method.toLowerCase(),
      url: url.toString(),
      data: config.data,
      params: config.queryParams,
      headers: config.headers,
      timeout: config.timeout || this.timeout,
      signal: config.signal,
    };

    try {
      const { data }: AxiosResponse<TResponse> = await axiosInstance.request(axiosConfig);
      return data;
    } catch (error) {
      throw await this.handleAxiosError(error as AxiosError);
    }
  }

  private async requestWithFetch<TResponse, TData = unknown>(
    config: RequestConfig<TData>,
    endpointName: string
  ): Promise<TResponse> {
    const endpoint = this.endpoints.get(endpointName);

    if (!endpoint) {
      throw ErrorService.createError({ type: 'CONFIGURATION_ERROR' });
    }

    const url = new URL(joinUrl(endpoint.baseURL, config.url));

    if (config.pathParams) {
      Object.entries(config.pathParams).forEach(([key, value]) => {
        url.pathname = url.pathname.replace(`:${key}`, String(value));
      });
    }

    // Add query parameters
    if (config.queryParams) {
      Object.entries(config.queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...endpoint.headers,
      ...config.headers,
    };

    const fetchConfig: RequestInit = {
      method: config.method,
      headers,
      signal: config.signal,
    };

    // Add body for non-GET requests
    if (config.method !== 'GET' && config.data) {
      fetchConfig.body = JSON.stringify(config.data);
    }

    try {
      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);

      const response = await fetch(url.toString(), {
        ...fetchConfig,
        signal: config.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.handleFetchError(response);
      }

      // Parse response body
      const data = await response.json();

      return data as TResponse;
    } catch (error) {
      throw this.handleFetchError(error);
    }
  }

  // Handle Axios errors
  private async handleAxiosError(error: AxiosError): Promise<AxiosResponse> {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Check if error is 401 and we haven't already tried to refresh
    if (
      error.response?.status === 401 &&
      error.request?.responseURL?.includes(HRF_TOOL_API_URL) &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        // this.handleAuthError('No refresh token available');
        throw new Error('No refresh token available');
      }

      // If already refreshing, wait for completion
      if (this.isRefreshing) {
        try {
          const token = await this.waitForTokenRefresh();
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return this.axiosInstance(originalRequest);
        } catch (refreshError) {
          throw refreshError;
        }
      }

      // Try to refresh the token
      // return await this.handleTokenRefresh(originalRequest, refreshToken);
    }

    // For non-401 errors or already retried requests
    throw error;
  }

  private waitForTokenRefresh(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.addRefreshSubscriber({ resolve, reject });
    });
  }

  // Handle token refresh logic
  private async handleTokenRefresh(
    originalRequest: ExtendedAxiosRequestConfig,
    refreshToken: string
  ): Promise<AxiosResponse> {
    this.isRefreshing = true;

    try {
      const dataRefresh = await this.refreshAccessToken(refreshToken);

      if (!dataRefresh?.data?.accessToken) {
        throw new Error('Invalid refresh response - no access token received');
      }

      // Update tokens
      setAccessToken(dataRefresh.data.accessToken);
      setRefreshToken(dataRefresh.data.refreshToken);

      // Update original request headers
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${dataRefresh.data.accessToken}`;
      }

      // Notify waiting requests
      this.notifyRefreshSubscribers(dataRefresh.data.accessToken);
      this.isRefreshing = false;

      // Retry original request
      return this.axiosInstance(originalRequest);
    } catch (refreshError) {
      this.isRefreshing = false;
      const error = refreshError as AuthError;
      this.notifyRefreshError(error);

      // Check if refresh token is expired/invalid
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.handleRefreshError(error);
      }

      throw refreshError;
    }
  }

  // Call refresh token API
  private async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Create a separate axios instance WITHOUT interceptors for refresh calls
      // This prevents the refresh API call from going through the same error handling
      const refreshAxiosInstance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { data: response } = await refreshAxiosInstance.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken,
      });

      return {
        data: {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Handle refresh token errors
  private handleRefreshError(error: AuthError): void {
    // Clear tokens and redirect if refresh token is expired
    if (
      error.response?.status === 403 ||
      error.response?.status === 401 ||
      error.response?.data?.error === 'refresh_token_expired'
    ) {
      removeAccessToken();
      removeRefreshToken();

      // Immediate redirect - don't wait
      this.redirectToSignIn();
    }
  }

  // Handle general authentication errors
  private handleAuthError(message: string): void {
    console.warn('Authentication error:', message);

    removeAccessToken();
    removeRefreshToken();

    // Immediate redirect - don't wait
    this.redirectToSignIn();
  }

  // Redirect to sign-in page
  private redirectToSignIn(): void {
    if (typeof window !== 'undefined') {
      // Clear any ongoing refresh state
      this.isRefreshing = false;
      this.refreshSubscribers = [];

      // Use replace to prevent back button issues
      window.location.replace('/sign-in');
    } else {
      console.warn('Window object not available for redirect');
    }
  }

  // Handle Fetch errors
  private handleFetchError(error: unknown): never {
    if (error instanceof Response) {
      // Handle Response object
      throw ErrorService.createError({ type: 'UNKNOWN_ERROR' });
    }

    if (error instanceof TypeError) {
      // Network errors are typically TypeErrors
      throw ErrorService.createError({ type: 'UNKNOWN_ERROR' });
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      // Timeout errors
      throw ErrorService.createError({ type: 'REQUEST_TIMEOUT' });
    }

    // Re-throw unknown errors
    throw error;
  }

  /**
   * Retry mechanism for failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    attempts: number = this.retryAttempts
  ): Promise<ApiResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempts > 0 && this.shouldRetry(error)) {
        await this.delay(this.retryDelay);
        return this.retryRequest(requestFn, attempts - 1);
      }
      throw error;
    }
  }

  // Determine if a request should be retried
  private shouldRetry(error: unknown): boolean {
    // Retry on network errors and 5xx server errors
    const networkError = error as NetworkError;
    if (networkError.code) {
      const retryableCodes = [
        ERROR.CONNECTION_REFUSED.CODE,
        ERROR.REQUEST_TIMEOUT.CODE,
        ERROR.SERVICE_UNAVAILABLE.CODE,
        ERROR.GATEWAY_TIMEOUT.CODE,
      ];
      return retryableCodes.includes(networkError.code);
    }
    return false;
  }

  // Delay utility for retry mechanism
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods for HTTP verbs
  public async get<TResponse = unknown>(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'url'>
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: 'GET', url });
  }

  public async post<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: Omit<RequestConfig, 'method' | 'url' | 'data'>
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: 'POST', url, data });
  }

  public async put<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: Omit<RequestConfig, 'method' | 'url' | 'data'>
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: 'PUT', url, data });
  }

  public async patch<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: Omit<RequestConfig, 'method' | 'url' | 'data'>
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: 'PATCH', url, data });
  }

  public async delete<TResponse = unknown>(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'url'>
  ): Promise<TResponse> {
    return this.request<TResponse>({ ...config, method: 'DELETE', url });
  }
}
