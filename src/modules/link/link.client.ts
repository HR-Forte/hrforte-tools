import { BaseClient } from '../_base/base.client';
import { ApiResponse } from '@/lib/api/types';
import {
  SafeLink,
  SafeLinkGroup,
  CreateLinkInput,
  UpdateLinkInput,
  CreateLinkGroupInput,
  UpdateLinkGroupInput,
  LinksGroupedResult,
} from './link.type';

export class LinkClient extends BaseClient {
  private readonly basePath = 'links';

  async getLinksGrouped() {
    return this.get<ApiResponse<LinksGroupedResult>>(`${this.basePath}`);
  }

  async createLink(data: Omit<CreateLinkInput, 'createdBy'>) {
    return this.post<ApiResponse<SafeLink>>(`${this.basePath}`, data);
  }

  async updateLink(id: string, data: Omit<UpdateLinkInput, 'updatedBy'>) {
    return this.put<ApiResponse<SafeLink>>(`${this.basePath}/${id}`, data);
  }

  async deleteLink(id: string) {
    return this.delete<ApiResponse<null>>(`${this.basePath}/${id}`);
  }

  async getLinkGroups() {
    return this.get<ApiResponse<SafeLinkGroup[]>>(`${this.basePath}/groups`);
  }

  async createLinkGroup(data: Omit<CreateLinkGroupInput, 'createdBy'>) {
    return this.post<ApiResponse<SafeLinkGroup>>(`${this.basePath}/groups`, data);
  }

  async updateLinkGroup(id: string, data: Omit<UpdateLinkGroupInput, 'updatedBy'>) {
    return this.put<ApiResponse<SafeLinkGroup>>(`${this.basePath}/groups/${id}`, data);
  }

  async deleteLinkGroup(id: string) {
    return this.delete<ApiResponse<null>>(`${this.basePath}/groups/${id}`);
  }
}

export const linkClient = new LinkClient();
