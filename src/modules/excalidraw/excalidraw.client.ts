import {
  SafeExcalidraw,
  ExcalidrawListResult,
  ExcalidrawFilters,
  CreateExcalidrawInput,
  UpdateExcalidrawInput,
} from './excalidraw.type';
import { BaseClient } from '../_base/base.client';
import { ApiResponse } from '@/lib/api/types';

export class ExcalidrawClient extends BaseClient {
  private readonly basePath = 'excalidraw';

  constructor() {
    super();
  }

  async createExcalidraw(data: CreateExcalidrawInput) {
    const response = await this.post<ApiResponse<SafeExcalidraw>>(`${this.basePath}/`, data);
    return response;
  }

  async getExcalidrawById(id: string) {
    const response = await this.get<ApiResponse<SafeExcalidraw>>(`${this.basePath}/${id}`);
    return response;
  }

  async updateExcalidraw(id: string, data: UpdateExcalidrawInput) {
    const response = await this.put<ApiResponse<SafeExcalidraw>>(`${this.basePath}/${id}`, data);
    return response;
  }

  async deleteExcalidraw(id: string): Promise<void> {
    await this.delete(`${this.basePath}/${id}`);
  }

  async getExcalidraws(params?: ExcalidrawFilters) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.title) searchParams.append('title', params.title);
    if (params?.userId) searchParams.append('userId', params.userId);

    const response = await this.get<ApiResponse<ExcalidrawListResult>>(`${this.basePath}?${searchParams.toString()}`);
    return response;
  }
}

// Export a singleton instance
export const excalidrawClient = new ExcalidrawClient();
