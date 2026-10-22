import { BaseClient } from '@/modules/_base/base.client';
import {
  GetAllCompanyWithESmartTimeAndAskGenieParams,
  GetAllCompanyWithESmartTimeAndAskGenieResponse,
} from './company.type';
import { EndpointName } from '@/lib/api/types';

export class CompanyClient extends BaseClient {
  private readonly basePath = 'company';

  constructor() {
    super();
  }

  getAllCompanyWithESmartTimeAndAskGenie = async (
    params?: GetAllCompanyWithESmartTimeAndAskGenieParams,
    endpoint?: EndpointName
  ) => {
    return await this.get<GetAllCompanyWithESmartTimeAndAskGenieResponse>(`/${this.basePath}`, {
      endpoint,
      queryParams: params,
    });
  };
}

export default new CompanyClient();
