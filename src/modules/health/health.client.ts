import { BaseClient } from '@/modules/_base/base.client';
import { EndpointName } from '@/lib/api/types';

export class HealthClient extends BaseClient {
  private readonly basePath = 'health';

  constructor() {
    super();
  }

  async getVersion(endpoint: EndpointName) {
    return this.get<string>(`${this.basePath}/version`, { endpoint, version: null });
  }

  async getESmartTimeVersion(endpoint: EndpointName) {
    return this.get<string>(`/${this.basePath}/version`, {
      endpoint,
      version: 'v1',
    });
  }

  async getNETCoreVersion(endpoint: EndpointName) {
    return this.get<{ status: string }>(`/healthz/live`, {
      endpoint,
      version: null,
    });
  }
}

export default new HealthClient();
