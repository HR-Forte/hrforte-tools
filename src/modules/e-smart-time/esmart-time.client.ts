import { BaseClient } from '@/modules/_base/base.client';
import { SyncESmartTimeResponse, UnsyncESmartTimeResponse } from './esmart-time.type';
import { EndpointName } from '@/lib/api/types';

export class ESmartTimeClient extends BaseClient {
  private readonly basePath = 'time-tracker';

  constructor() {
    super();
  }

  syncESmartTime = async (companyId: number, endpoint?: EndpointName) => {
    return await this.post<SyncESmartTimeResponse>(`/${this.basePath}/${companyId}/sync-company/api-key`, undefined, {
      endpoint,
      version: 'v1',
    });
  };

  unsyncESmartTime = async (companyId: number, endpoint?: EndpointName) => {
    return await this.delete<UnsyncESmartTimeResponse>(`/${this.basePath}/${companyId}/time-tracker-sync-removal`, {
      endpoint,
      version: 'v1',
    });
  };
}

export default new ESmartTimeClient();
