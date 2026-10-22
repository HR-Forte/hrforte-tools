export interface Environment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  _count?: { variables: number };
}

export interface EnvironmentVariable {
  id: string;
  environmentId: string;
  key: string;
  value: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEnvironmentInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateEnvironmentInput {
  name?: string;
  slug?: string;
  description?: string;
}

export interface CreateVariableInput {
  key: string;
  value: string;
}

export interface BulkVariablesPayload {
  upsert?: { key: string; value: string }[];
  delete?: string[];
}

export interface BulkVariablesResult {
  created: number;
  updated: number;
  deleted: number;
}
