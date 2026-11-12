import { BaseClient } from '@/modules/_base/base.client';
import { EndpointName } from '@/lib/api/types';
import { DeployWindowAnalysis, DeployWindowParams, DeployWindowReadiness } from './deploy-window.type';

export class DeployWindowClient extends BaseClient {
  private readonly basePath = 'server-management/deploy-window';

  constructor() {
    super();
  }

  public async getAnalysis(params: DeployWindowParams, endpoint: EndpointName) {
    return await this.get<DeployWindowAnalysis>(`${this.basePath}/analysis`, {
      endpoint,
      version: 'v1',
      queryParams: params,
    });
  }

  public async getReadiness(params: DeployWindowParams, endpoint: EndpointName) {
    return await this.get<DeployWindowReadiness>(`${this.basePath}/readiness`, {
      endpoint,
      version: 'v1',
      queryParams: params,
    });
  }
}

export default new DeployWindowClient();
