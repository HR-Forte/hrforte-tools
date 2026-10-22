import { BaseClient } from '@/modules/_base/base.client';
import { SyncAskGenieResponse, UnsyncAskGenieResponse } from './askgenie.type';
import { EndpointName } from '@/lib/api/types';

export class AskGenieClient extends BaseClient {
  private readonly basePath = 'hrf-rag';

  constructor() {
    super();
  }

  syncAskGenie = async (companyId: number, endpoint: EndpointName) => {
    return await this.post<SyncAskGenieResponse>(`/${companyId}/${this.basePath}/sync-company`, undefined, {
      endpoint: endpoint,
      version: 'v1',
    });
  };

  unsyncAskGenie = async (companyId: number, endpoint: EndpointName) => {
    return await this.post<UnsyncAskGenieResponse>(`/${companyId}/${this.basePath}/unsync-company`, undefined, {
      endpoint: endpoint,
      version: 'v1',
    });
  };

  syncAllAskGenie = async (endpoint: EndpointName) => {
    return await this.post<any>(`/${this.basePath}/sync-company/all`, undefined, {
      endpoint,
      version: 'v1',
    });
  };

  unsyncAllAskGenie = async (endpoint: EndpointName) => {
    return await this.post<any>(`/${this.basePath}/unsync-company/all`, undefined, {
      endpoint,
      version: 'v1',
    });
  };
}

export default new AskGenieClient();
