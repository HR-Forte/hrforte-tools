import { BaseClient } from '@/modules/_base/base.client';
import { EndpointName } from '@/lib/api/types';
import {
  CompanyFeatureFlag,
  CreateCompanyFeatureFlagBody,
  FeatureFlagCompanyOverridesResponse,
  FeatureFlagDefaultResponse,
  GetFeatureFlagCompanyOverridesParams,
  UpdateCompanyFeatureFlagBody,
  UpdateDefaultFeatureFlagBody,
} from './feature-flag.type';

export class FeatureFlagClient extends BaseClient {
  private readonly basePath = 'feature-flag';

  constructor() {
    super();
  }

  public async getFeatureFlagCompanyOverrides(params?: GetFeatureFlagCompanyOverridesParams, endpoint?: EndpointName) {
    return await this.get<FeatureFlagCompanyOverridesResponse>(`${this.basePath}`, {
      endpoint: endpoint || 'MIA',
      version: 'v1',
      queryParams: params,
    });
  }

  public async getDefaultFeatureFlag(endpoint?: EndpointName) {
    return await this.get<FeatureFlagDefaultResponse>(`${this.basePath}/default`, {
      endpoint: endpoint || 'MIA',
      version: 'v1',
    });
  }

  public async updateDefaultFeatureFlag(body: UpdateCompanyFeatureFlagBody, endpoint?: EndpointName) {
    return await this.put<FeatureFlagDefaultResponse>(`${this.basePath}/default`, body, {
      endpoint: endpoint || 'MIA',
      version: 'v1',
    });
  }

  public async createCompanyFeatureFlag(
    companyId: number,
    body: CreateCompanyFeatureFlagBody,
    endpoint?: EndpointName
  ) {
    return await this.post<CompanyFeatureFlag>(`${this.basePath}/${companyId}`, body, {
      endpoint: endpoint || 'MIA',
      version: 'v1',
    });
  }

  public async updateCompanyFeatureFlag(
    companyId: number,
    body: UpdateCompanyFeatureFlagBody,
    endpoint?: EndpointName
  ) {
    return await this.put<CompanyFeatureFlag>(`${this.basePath}/${companyId}`, body, {
      endpoint: endpoint || 'MIA',
      version: 'v1',
    });
  }

  public async deleteCompanyFeatureFlag(companyId: number, endpoint?: EndpointName) {
    return await this.delete<CompanyFeatureFlag>(`${this.basePath}/${companyId}`, {
      endpoint: endpoint || 'MIA',
      version: 'v1',
    });
  }
}

export default new FeatureFlagClient();
