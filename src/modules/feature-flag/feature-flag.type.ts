import { HRForteApiResponse } from '@/lib/api/types';

export const FeatureFlagNameEnum = {
  ASK_GENIE: 'askGenie',
  WORKFLOW: 'workflow',
  CHANGE_LOG: 'changelog',
  MY_DOCUMENT: 'myDocument',
  PAYSLIP_REPORT: 'payslipReport',
  E_SIGN: 'eSign',
  HRIQ: 'hriq',
  DYNAMIC_IMPORT: 'dynamicImport',
  DYNAMIC_IMPORT_TRANSACTIONS: 'dynamicImportTransactions',
  IMPORT_TIME_ENTRY: 'importTimeEntry',
  HONO_SSO_BUTTON: 'honoSsoButton',
  STREAMLINED_IMPORT: 'streamlinedImport',
} as const;

export type FeatureFlagName = (typeof FeatureFlagNameEnum)[keyof typeof FeatureFlagNameEnum];

export const FeatureFlagHeaderMap = {
  [FeatureFlagNameEnum.ASK_GENIE]: 'AskGenie',
  [FeatureFlagNameEnum.WORKFLOW]: 'Workflow',
  [FeatureFlagNameEnum.CHANGE_LOG]: 'Change Log',
  [FeatureFlagNameEnum.MY_DOCUMENT]: 'My Document',
  [FeatureFlagNameEnum.PAYSLIP_REPORT]: 'Payslip Report',
  [FeatureFlagNameEnum.E_SIGN]: 'E-Sign',
  [FeatureFlagNameEnum.HRIQ]: 'HRIQ',
  [FeatureFlagNameEnum.DYNAMIC_IMPORT]: 'Dynamic Import',
  [FeatureFlagNameEnum.DYNAMIC_IMPORT_TRANSACTIONS]: 'Dynamic Import Transactions',
  [FeatureFlagNameEnum.IMPORT_TIME_ENTRY]: 'Import Time Entry',
  [FeatureFlagNameEnum.HONO_SSO_BUTTON]: 'HONO SSO Button',
  [FeatureFlagNameEnum.STREAMLINED_IMPORT]: 'Streamlined Import',
} as const;

export interface CompanyFeatureFlag {
  id: number;
  companyId: number;
  flags: Record<FeatureFlagName, boolean>;
  createdOn: string;
  updatedOn: string;
  company?: {
    id: number;
    name: string;
    code: string;
    active: boolean;
  };
}

// ======================================
export type FeatureFlagDefaultResponse = {
  [key in FeatureFlagName]: boolean;
};

export type FeatureFlagCompanyOverridesType = {
  id: number;
  createdOn: string;
  updatedOn: string;
  companyId?: number;
  flags: {
    [key in FeatureFlagName]: boolean;
  };
  company: {
    id: number;
    name: string;
    code: string;
    active: boolean;
  };
};

export type GetFeatureFlagCompanyOverridesParams = {
  page?: number;
  take?: number;
  q?: string;
  sort?: keyof FeatureFlagCompanyOverridesType;
  order?: 'ASC' | 'DESC';
};

export type FeatureFlagCompanyOverridesResponse = HRForteApiResponse<FeatureFlagCompanyOverridesType>;

export type CreateCompanyFeatureFlagBody = {
  flags: {
    [key in FeatureFlagName]: boolean;
  };
};

export type UpdateCompanyFeatureFlagBody = {
  flags: {
    [key in FeatureFlagName]?: boolean;
  };
};
