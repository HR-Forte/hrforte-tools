import prisma from '@/lib/prisma/prismaClient';
import { encryptEnvValue, decryptEnvValue } from '@/lib/crypto/env-value-cipher';
import ErrorService from '@/lib/error/errorService';
import {
  CreateEnvironmentInput,
  UpdateEnvironmentInput,
  CreateVariableInput,
  BulkVariablesPayload,
  BulkVariablesResult,
  Environment,
  EnvironmentVariable,
} from './environment-variable.type';

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export class EnvironmentVariableService {
  async listEnvironments(): Promise<(Environment & { _count: { variables: number } })[]> {
    const list = await prisma.environment.findMany({
      where: { isDeleted: false },
      include: { _count: { select: { variables: true } } },
      orderBy: { name: 'asc' },
    });
    return list as (Environment & { _count: { variables: number } })[];
  }

  async createEnvironment(data: CreateEnvironmentInput, createdBy?: string): Promise<Environment> {
    const slug = (data.slug ?? slugify(data.name)).trim() || slugify(data.name);
    const existing = await prisma.environment.findFirst({
      where: { slug, isDeleted: false },
    });
    if (existing) {
      throw ErrorService.createError({
        type: 'DUPLICATE_VALUE',
        message: `Environment with slug "${slug}" already exists`,
      });
    }
    const env = await prisma.environment.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() ?? null,
        createdBy,
      },
    });
    return env as Environment;
  }

  async getEnvironmentById(id: string): Promise<Environment | null> {
    const env = await prisma.environment.findFirst({
      where: { id, isDeleted: false },
      include: { _count: { select: { variables: true } } },
    });
    return env as Environment | null;
  }

  async updateEnvironment(
    id: string,
    data: UpdateEnvironmentInput,
    updatedBy?: string
  ): Promise<Environment> {
    const existing = await this.getEnvironmentById(id);
    if (!existing) {
      throw ErrorService.createError({ type: 'RECORD_NOT_FOUND', message: 'Environment not found' });
    }
    const slug = data.slug !== undefined ? (data.slug || slugify(existing.name)).trim() : existing.slug;
    if (slug !== existing.slug) {
      const duplicate = await prisma.environment.findFirst({
        where: { slug, isDeleted: false, id: { not: id } },
      });
      if (duplicate) {
        throw ErrorService.createError({
          type: 'DUPLICATE_VALUE',
          message: `Environment with slug "${slug}" already exists`,
        });
      }
    }
    const env = await prisma.environment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.slug !== undefined && { slug }),
        ...(data.description !== undefined && { description: data.description?.trim() ?? null }),
        updatedBy,
      },
    });
    return env as Environment;
  }

  async deleteEnvironment(id: string, updatedBy?: string): Promise<void> {
    const existing = await this.getEnvironmentById(id);
    if (!existing) {
      throw ErrorService.createError({ type: 'RECORD_NOT_FOUND', message: 'Environment not found' });
    }
    await prisma.environment.update({
      where: { id },
      data: { isDeleted: true, updatedBy },
    });
  }

  async listVariables(environmentId: string): Promise<EnvironmentVariable[]> {
    const env = await this.getEnvironmentById(environmentId);
    if (!env) {
      throw ErrorService.createError({ type: 'RECORD_NOT_FOUND', message: 'Environment not found' });
    }
    const rows = await prisma.environmentVariable.findMany({
      where: { environmentId, isDeleted: false },
      orderBy: { key: 'asc' },
    });
    return rows.map(row => ({
      id: row.id,
      environmentId: row.environmentId,
      key: row.key,
      value: decryptEnvValue(row.valueEncrypted),
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async createVariable(
    environmentId: string,
    data: CreateVariableInput,
    _createdBy?: string
  ): Promise<EnvironmentVariable> {
    const env = await this.getEnvironmentById(environmentId);
    if (!env) {
      throw ErrorService.createError({ type: 'RECORD_NOT_FOUND', message: 'Environment not found' });
    }
    const key = data.key.trim();
    if (!key) {
      throw ErrorService.createError({ type: 'REQUIRED_FIELD', message: 'Variable key is required' });
    }
    const existing = await prisma.environmentVariable.findFirst({
      where: { environmentId, key, isDeleted: false },
    });
    if (existing) {
      throw ErrorService.createError({
        type: 'DUPLICATE_VALUE',
        message: `Variable "${key}" already exists in this environment`,
      });
    }
    const valueEncrypted = encryptEnvValue(data.value ?? '');
    const row = await prisma.environmentVariable.create({
      data: { environmentId, key, valueEncrypted },
    });
    return {
      id: row.id,
      environmentId: row.environmentId,
      key: row.key,
      value: data.value ?? '',
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateVariable(
    environmentId: string,
    key: string,
    value: string,
    _updatedBy?: string
  ): Promise<EnvironmentVariable> {
    const env = await this.getEnvironmentById(environmentId);
    if (!env) {
      throw ErrorService.createError({ type: 'RECORD_NOT_FOUND', message: 'Environment not found' });
    }
    const existing = await prisma.environmentVariable.findFirst({
      where: { environmentId, key: key.trim(), isDeleted: false },
    });
    if (!existing) {
      throw ErrorService.createError({ type: 'RECORD_NOT_FOUND', message: 'Variable not found' });
    }
    const valueEncrypted = encryptEnvValue(value);
    const row = await prisma.environmentVariable.update({
      where: { id: existing.id },
      data: { valueEncrypted },
    });
    return {
      id: row.id,
      environmentId: row.environmentId,
      key: row.key,
      value,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async deleteVariable(environmentId: string, key: string, _updatedBy?: string): Promise<void> {
    const existing = await prisma.environmentVariable.findFirst({
      where: { environmentId, key: key.trim(), isDeleted: false },
    });
    if (!existing) return;
    await prisma.environmentVariable.update({
      where: { id: existing.id },
      data: { isDeleted: true },
    });
  }

  async bulkVariables(environmentId: string, payload: BulkVariablesPayload): Promise<BulkVariablesResult> {
    const env = await this.getEnvironmentById(environmentId);
    if (!env) {
      throw ErrorService.createError({ type: 'RECORD_NOT_FOUND', message: 'Environment not found' });
    }
    // Last value wins for duplicate keys (same as the previous sequential behaviour)
    const upserts = new Map<string, string>();
    for (const item of payload.upsert ?? []) {
      const key = item.key?.trim();
      if (key) upserts.set(key, item.value ?? '');
    }
    const deleteKeys = [...new Set((payload.delete ?? []).map(k => k?.trim()).filter(Boolean))] as string[];

    // One lookup for all upsert keys instead of a query per key
    const existing = upserts.size
      ? await prisma.environmentVariable.findMany({
          where: { environmentId, key: { in: [...upserts.keys()] }, isDeleted: false },
          select: { id: true, key: true },
        })
      : [];
    const existingIdByKey = new Map(existing.map(v => [v.key, v.id]));

    const toCreate = [...upserts]
      .filter(([key]) => !existingIdByKey.has(key))
      .map(([key, value]) => ({ environmentId, key, valueEncrypted: encryptEnvValue(value) }));
    const toUpdate = [...upserts]
      .filter(([key]) => existingIdByKey.has(key))
      .map(([key, value]) =>
        prisma.environmentVariable.update({
          where: { id: existingIdByKey.get(key)! },
          data: { valueEncrypted: encryptEnvValue(value) },
        })
      );

    const writes = [...toUpdate, ...(toCreate.length ? [prisma.environmentVariable.createMany({ data: toCreate })] : [])];
    if (writes.length) await prisma.$transaction(writes);

    // Deletes run after upserts, so a key in both lists ends up deleted (as before)
    const { count: deleted } = deleteKeys.length
      ? await prisma.environmentVariable.updateMany({
          where: { environmentId, key: { in: deleteKeys }, isDeleted: false },
          data: { isDeleted: true },
        })
      : { count: 0 };

    const created = toCreate.length;
    const updated = toUpdate.length;

    return { created, updated, deleted };
  }
}

export const environmentVariableService = new EnvironmentVariableService();
