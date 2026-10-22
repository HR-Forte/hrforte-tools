import { FeatureFlagName } from '../feature-flag/feature-flag.type';

export type CompanyWithESmartTimeAndAskGenie = {
  id: number;
  name: string;
  active: boolean;
  createdOn: string;
  isDeleted: boolean;
  companyMappings: {
    id: number;
    timeTrackerCompanyId: string;
  };
  hrfRagCompanyMapping: {
    id: number;
    hrfRagCompanyId: string;
    isActive: boolean;
    isDeleted: boolean;
  };
  featureFlags: {
    [key in FeatureFlagName]?: boolean;
  };
  employeeCount?: number;
  companyUserRoleCount?: number;
  code?: string;
};
