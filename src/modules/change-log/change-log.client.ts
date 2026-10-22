import { BaseClient } from '@/modules/_base/base.client';
import {
  GetAllAppReleasesParams,
  GetAllAppReleasesResponse,
  GetAllComponentReleasesParams,
  GetAllComponentReleasesResponse,
  GetRecommendedAppVersionResponse,
  CreateAppReleaseBody,
  CreateComponentReleaseBody,
  UpdateAppReleaseBody,
  UpdateComponentReleaseBody,
  CreateAppReleaseByDateRangeBody,
  CreateAppReleaseByDateRangeResponse,
  ReviewCreateAppReleaseByDateRangeResponse,
} from './change-log.type';
import { AppRelease, ComponentRelease } from './change-log.model';
import { EndpointName } from '@/lib/api/types';

export class ChangeLogClient extends BaseClient {
  private readonly basePath = 'changelog';

  constructor() {
    super();
  }

  getAllComponentReleases = async (params?: GetAllComponentReleasesParams, endpoint?: EndpointName) => {
    return await this.get<GetAllComponentReleasesResponse>(`/${this.basePath}/component-releases`, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
      queryParams: params,
    });
  };

  getAllAppReleases = async (params?: GetAllAppReleasesParams, endpoint?: EndpointName) => {
    return await this.get<GetAllAppReleasesResponse>(`/${this.basePath}/app-releases`, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
      queryParams: params,
    });
  };

  getRecommendedAppVersion = async (endpoint?: EndpointName) => {
    return await this.get<GetRecommendedAppVersionResponse>(`/${this.basePath}/app-version`, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
    });
  };

  createAppRelease = async (body?: CreateAppReleaseBody, endpoint?: EndpointName) => {
    return await this.post<AppRelease>(`/${this.basePath}/app-release`, body, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
    });
  };

  updateAppRelease = async (
    id: number,
    body?: UpdateAppReleaseBody,
    generateContent?: boolean,
    endpoint?: EndpointName
  ) => {
    return await this.patch<AppRelease>(`/${this.basePath}/app-release/${id}`, body, {
      queryParams: {
        generateContent,
      },
      version: 'v1',
      endpoint: endpoint || 'MIA',
    });
  };

  deleteAppRelease = async (id: number, endpoint?: EndpointName) => {
    return await this.delete<AppRelease>(`/${this.basePath}/app-release/${id}`, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
    });
  };

  createComponentRelease = async (body?: CreateComponentReleaseBody, endpoint?: EndpointName) => {
    return await this.post<ComponentRelease>(`/${this.basePath}/component-release`, body, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
    });
  };

  updateComponentRelease = async (id: number, body?: UpdateComponentReleaseBody, endpoint?: EndpointName) => {
    return await this.patch<ComponentRelease>(`/${this.basePath}/component-release/${id}`, body, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
    });
  };

  deleteComponentRelease = async (id: number, endpoint?: EndpointName) => {
    return await this.delete<ComponentRelease>(`/${this.basePath}/component-release/${id}`, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
    });
  };

  createAppReleaseByDateRange = async (body?: CreateAppReleaseByDateRangeBody, endpoint?: EndpointName) => {
    return await this.post<CreateAppReleaseByDateRangeResponse>(`/${this.basePath}/app-release/by-date-range`, body, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
    });
  };

  reviewCreateAppReleaseByDateRange = async (body?: CreateAppReleaseByDateRangeBody, endpoint?: EndpointName) => {
    return await this.post<ReviewCreateAppReleaseByDateRangeResponse>(`/${this.basePath}/app-release/review-by-date-range`, body, {
      version: 'v1',
      endpoint: endpoint || 'MIA',
    });
  };
}

export default new ChangeLogClient();
