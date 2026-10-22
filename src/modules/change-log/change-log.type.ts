import { HRForteApiResponse } from '@/lib/api/types';
import { AppRelease, AppReleaseStatus, ComponentRelease } from './change-log.model';

export type GetAllComponentReleasesParams = {
  q?: string;
  page?: number;
  take?: number;
  isSelectAll?: boolean;
  isDeleted?: boolean;
  repoName?: string;
  isIncludedInAppRelease?: boolean;
  sorts?: `${keyof ComponentRelease}.${'DESC' | 'ASC'}`[];
};

export type GetAllAppReleasesParams = {
  q?: string;
  page?: number;
  take?: number;
  isSelectAll?: boolean;
  isDeleted?: boolean;
  sorts?: `${keyof AppRelease}.${'DESC' | 'ASC'}`[];
};

export type GetAllComponentReleasesResponse = HRForteApiResponse<ComponentRelease>;

export type GetAllAppReleasesResponse = HRForteApiResponse<AppRelease>;

export type GetRecommendedAppVersionResponse = {
  latest: string;
  publishedLatest: string;
  stable: {
    patch: string;
    minor: string;
    major: string;
  };
  prerelease?: {
    patch?: {
      alpha: string;
      beta: string;
      rc: string;
    };
    minor?: {
      alpha: string;
      beta: string;
      rc: string;
    };
  };
  promoteComponentReleases: ComponentRelease[];
};

export type CreateAppReleaseBody = {
  releaseDate?: string;
  appVersion: string;
  componentReleaseIds: number[];
  photoUrl?: string;
  file?: File;
};

export type UpdateAppReleaseBody = {
  releaseDate?: string;
  file?: File;
  appVersion?: string;
  componentReleaseIds?: number[];
  photoUrl?: string;
  content?: string;
  status?: AppReleaseStatus;
  tags?: string;
};

export type CreateComponentReleaseBody = {
  repoName: string;
  repoVersion: string;
  releaseDate: string;
  content: string;
  file?: File;
  photoUrl?: string;
};

export type UpdateComponentReleaseBody = {
  repoName: string;
  repoVersion: string;
  releaseDate: string;
  content: string;
  file?: File;
  photoUrl?: string;
  encryptedSymmetricKey?: string;
  encryptedIv?: string;
  mobileMode?: 'yes' | 'no';
  appReleaseIds?: number[];
};

export type CreateAppReleaseByDateRangeBody = {
  startDate: string;
  endDate: string;
};

export type CreateAppReleaseByDateRangeResponse = any;

export type ReviewCreateAppReleaseByDateRangeResponse = {
  appVersion: string;
  componentReleases: ComponentRelease[];
  date: string;
}[];
