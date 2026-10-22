import { ApiClient } from '@/lib/api/api-client';
import { ApiResponse, RequestConfig, ApiVersion } from '@/lib/api/types';
import { createApiClient } from '@/lib/api/api-client-factory';

/**
 * Abstract base client class that provides common API functionality
 */
export abstract class BaseClient {
  protected apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    // Use provided API client or create default one with 3 endpoints
    this.apiClient = apiClient || createApiClient();
  }

  // Get the API client instance
  protected getApiClient(): ApiClient {
    return this.apiClient;
  }

  // Set a new API client instance
  protected setApiClient(apiClient: ApiClient): void {
    this.apiClient = apiClient;
  }

  // Make a GET request
  protected async get<TResponse = unknown>(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'url'>
  ): Promise<TResponse> {
    return this.apiClient.get<TResponse>(url, config);
  }

  // Make a POST request
  protected async post<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: Omit<RequestConfig, 'method' | 'url' | 'data'>
  ): Promise<TResponse> {
    return this.apiClient.post<TResponse, TData>(url, data, config);
  }

  // Make a PUT request
  protected async put<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: Omit<RequestConfig, 'method' | 'url' | 'data'>
  ): Promise<TResponse> {
    return this.apiClient.put<TResponse, TData>(url, data, config);
  }

  // Make a PATCH request
  protected async patch<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    config?: Omit<RequestConfig, 'method' | 'url' | 'data'>
  ): Promise<TResponse> {
    return this.apiClient.patch<TResponse, TData>(url, data, config);
  }

  // Make a DELETE request
  protected async delete<TResponse = unknown>(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'url'> & { version?: ApiVersion }
  ): Promise<TResponse> {
    return this.apiClient.delete<TResponse>(url, config);
  }

  // Make a custom request
  protected async request<TResponse = unknown, TData = unknown>(
    config: RequestConfig<TData>
  ): Promise<TResponse> {
    return this.apiClient.request<TResponse, TData>(config);
  }
}

export default BaseClient;
