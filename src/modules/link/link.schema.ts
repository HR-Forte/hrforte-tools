import { z } from 'zod';

// Whitelisted fields for link writes (prevents mass assignment of isDeleted/createdBy/etc.)
const safeUrl = z
  .string()
  .trim()
  .min(1)
  .refine(
    url => !/^(javascript|data|vbscript):/i.test(url.replace(/[\s\u0000-\u001f]/g, '')),
    'Unsupported URL scheme'
  );

export const createLinkSchema = z.object({
  title: z.string().trim().min(1),
  url: safeUrl,
  description: z.string().optional(),
  favicon: z.string().optional(),
  groupId: z.string().nullish(),
  order: z.number().int().optional(),
});

export const updateLinkSchema = createLinkSchema.partial();

export const createLinkGroupSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export const updateLinkGroupSchema = createLinkGroupSchema.partial();
