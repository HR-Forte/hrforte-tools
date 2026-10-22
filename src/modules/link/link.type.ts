export interface SafeLink {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  favicon?: string | null;
  groupId?: string | null;
  order: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface SafeLinkGroup {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  links: SafeLink[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface CreateLinkInput {
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  groupId?: string | null;
  order?: number;
  createdBy?: string;
}

export interface UpdateLinkInput {
  title?: string;
  url?: string;
  description?: string;
  favicon?: string;
  groupId?: string | null;
  order?: number;
  updatedBy?: string;
}

export interface CreateLinkGroupInput {
  name: string;
  description?: string;
  order?: number;
  createdBy?: string;
}

export interface UpdateLinkGroupInput {
  name?: string;
  description?: string;
  order?: number;
  updatedBy?: string;
}

export interface LinksGroupedResult {
  groups: SafeLinkGroup[];
  ungrouped: SafeLink[];
}
