import { BaseClient } from '@/modules/_base/base.client';
import { ApiResponse } from '@/lib/api/types';
import {
  Environment,
  EnvironmentVariable,
  CreateEnvironmentInput,
  UpdateEnvironmentInput,
  BulkVariablesPayload,
  BulkVariablesResult,
} from './environment-variable.type';

export class EnvironmentVariableClient extends BaseClient {
  private readonly basePath = '/environment-variables';

  constructor() {
    super();
  }

  async getEnvironments() {
    return await this.get<ApiResponse<Environment[]>>(`${this.basePath}/environments`);
  }

  async createEnvironment(data: CreateEnvironmentInput) {
    return await this.post<ApiResponse<Environment>>(`${this.basePath}/environments`, data);
  }

  async getEnvironment(id: string) {
    return await this.get<ApiResponse<Environment>>(`${this.basePath}/environments/${id}`);
  }

  async updateEnvironment(id: string, data: UpdateEnvironmentInput) {
    return await this.patch<ApiResponse<Environment>>(`${this.basePath}/environments/${id}`, data);
  }

  async deleteEnvironment(id: string) {
    return await this.delete<ApiResponse<{ success: boolean }>>(`${this.basePath}/environments/${id}`);
  }

  async getVariables(environmentId: string) {
    return await this.get<ApiResponse<EnvironmentVariable[]>>(
      `${this.basePath}/environments/${environmentId}/variables`
    );
  }

  async createVariable(environmentId: string, key: string, value: string) {
    return await this.post<ApiResponse<EnvironmentVariable>>(
      `${this.basePath}/environments/${environmentId}/variables`,
      { key, value }
    );
  }

  async updateVariable(environmentId: string, key: string, value: string) {
    return await this.put<ApiResponse<EnvironmentVariable>>(
      `${this.basePath}/environments/${environmentId}/variables/${encodeURIComponent(key)}`,
      { value }
    );
  }

  async deleteVariable(environmentId: string, key: string) {
    return await this.delete<ApiResponse<{ success: boolean }>>(
      `${this.basePath}/environments/${environmentId}/variables/${encodeURIComponent(key)}`
    );
  }

  async bulkVariables(environmentId: string, payload: BulkVariablesPayload) {
    return await this.post<ApiResponse<BulkVariablesResult>>(
      `${this.basePath}/environments/${environmentId}/variables/bulk`,
      payload
    );
  }
}

export const environmentVariableClient = new EnvironmentVariableClient();
