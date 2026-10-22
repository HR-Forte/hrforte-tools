import { apiErrorHandler } from '@/lib/error/apiErrorHandler';
import { formatSuccessResponse } from '@/lib/utils';
import ErrorService from '@/lib/error/errorService';
import {
  createOrUpdateRepoSecret,
  deleteRepoSecret,
  getRepoSecretsPublicKey,
} from '@/lib/github/github.service';
import { requireAdmin } from '@/lib/middlewares/auth';

type BulkSecretItem = { owner: string; repo: string; name: string; value?: string };

export const POST = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  const { items } = body as { items?: BulkSecretItem[] };

  if (!Array.isArray(items) || items.length === 0) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'items array with owner, repo, name, value is required',
    });
  }

  const results: { owner: string; repo: string; name: string; success: boolean; error?: string }[] = [];
  // One public-key lookup per repo instead of per secret (sequential writes: GitHub rate-limits parallel ones)
  const publicKeys = new Map<string, ReturnType<typeof getRepoSecretsPublicKey>>();

  for (const item of items) {
    const { owner, repo, name, value } = item;
    if (!owner || !repo || !name || value === undefined) {
      results.push({
        owner: owner ?? '',
        repo: repo ?? '',
        name: name ?? '',
        success: false,
        error: 'owner, repo, name, and value are required',
      });
      continue;
    }
    try {
      const repoKey = `${owner}/${repo}`;
      if (!publicKeys.has(repoKey)) publicKeys.set(repoKey, getRepoSecretsPublicKey(owner, repo));
      await createOrUpdateRepoSecret(owner, repo, name, value, await publicKeys.get(repoKey));
      results.push({ owner, repo, name, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      results.push({ owner, repo, name, success: false, error: message });
    }
  }

  return formatSuccessResponse(
    { results, total: items.length, succeeded: results.filter(r => r.success).length },
    'Bulk secrets operation completed',
    request
  );
});

export const DELETE = apiErrorHandler(async request => {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  const { items } = body as { items?: Omit<BulkSecretItem, 'value'>[] };

  if (!Array.isArray(items) || items.length === 0) {
    throw ErrorService.createError({
      type: 'REQUIRED_FIELD',
      message: 'items array with owner, repo, name is required',
    });
  }

  const results: { owner: string; repo: string; name: string; success: boolean; error?: string }[] = [];

  for (const item of items) {
    const { owner, repo, name } = item;
    if (!owner || !repo || !name) {
      results.push({
        owner: owner ?? '',
        repo: repo ?? '',
        name: name ?? '',
        success: false,
        error: 'Owner, Repo and Name are required',
      });
      continue;
    }
    try {
      await deleteRepoSecret(owner, repo, name);
      results.push({ owner, repo, name, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      results.push({ owner, repo, name, success: false, error: message });
    }
  }

  return formatSuccessResponse(
    { results, total: items.length, succeeded: results.filter(r => r.success).length },
    'Bulk delete secrets completed',
    request
  );
});
