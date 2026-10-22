export enum AppReleaseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export interface ComponentRelease {
  // appReleaseId: number;
  content: string;
  id: number;
  isDeleted?: boolean;
  photoUrl: string;
  releaseDate: string;
  repoName: string;
  repoVersion: string;
  appReleases?: AppRelease[];
  createdOn?: string;
  updatedOn?: string;
}

export type AppRelease = {
  id: number;
  isDeleted: boolean;
  releaseDate: string;
  appVersion: string;
  content: string;
  status: AppReleaseStatus;
  photoUrl: string;
  tags: string;
  createdOn?: string;
  componentReleases?: ComponentRelease[];
  updatedOn?: string;
};
