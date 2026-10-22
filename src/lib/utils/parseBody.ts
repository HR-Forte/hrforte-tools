import { NextRequest } from 'next/server';
import { z } from 'zod';
import ErrorService from '@/lib/error/errorService';

// Parse and whitelist a JSON body; unknown keys are stripped, invalid input is a 400.
export async function parseBody<T extends z.ZodType>(request: NextRequest, schema: T): Promise<z.infer<T>> {
  const result = schema.safeParse(await request.json().catch(() => null));
  if (!result.success) {
    const issue = result.error.issues[0];
    throw ErrorService.createError({
      type: 'INVALID_FORMAT',
      message: issue ? `${issue.path.join('.') || 'body'}: ${issue.message}` : 'Invalid request body',
      options: { request },
    });
  }
  return result.data;
}
