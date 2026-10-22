import { HRForteApiResponse } from '@/lib/api/types';
import { CompanyWithESmartTimeAndAskGenie } from './company.model';

export type GetAllCompanyWithESmartTimeAndAskGenieParams = {
  page?: number;
  take?: number;
  q?: string;
  isDeleted?: boolean;
  isSelectedAll?: boolean;
  sort?: keyof CompanyWithESmartTimeAndAskGenie;
  order?: 'ASC' | 'DESC';
  isActive?: boolean;
  isSyncedHrfRag?: boolean;
  isSyncedESmartTime?: boolean;
};

export type GetAllCompanyWithESmartTimeAndAskGenieResponse = HRForteApiResponse<CompanyWithESmartTimeAndAskGenie>;
