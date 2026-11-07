import { z } from 'zod';
export const itemInput = z.object({
  barcode: z.string().regex(/^\d{8,14}$/).nullable().optional(),
  roomId: z.uuid().nullable().optional(), location: z.string().trim().max(120).nullable().optional(),
  houseId: z.uuid(), name: z.string().trim().min(1).max(120), categoryId: z.uuid().nullable().optional(),
  brand: z.string().trim().max(100).nullable().optional(), size: z.string().trim().max(100).nullable().optional(),
  variant: z.string().trim().max(100).nullable().optional(), imageUrl: z.union([z.url(), z.string().regex(/^\/api\/images\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/)]).nullable().optional(),
  unit: z.string().trim().min(1).max(30),
  minimum: z.number().int().min(0).max(999999),
  checked: z.boolean().optional(), archived: z.boolean().optional(),
});
export const batchInput = z.object({
  quantity: z.number().int().min(0).max(999999),
  expiryDate: z.iso.date().nullable(),
});
export const createItemInput = itemInput.extend({
  batches: z.array(batchInput).min(1).max(100).optional(),
  // Accept forms opened before the batch update as one initial batch.
  quantity: z.number().int().min(0).max(999999).optional(),
  expiryDate: z.iso.date().nullable().optional(),
}).refine(value => value.batches !== undefined || value.quantity !== undefined)
  .refine(value => (value.batches?.reduce((sum, batch) => sum + batch.quantity, 0) ?? value.quantity ?? 0) <= 999999);
export const restockInput = z.object({
  batches: z.array(batchInput.extend({ quantity: z.number().int().min(1).max(999999) })).min(1).max(100),
}).refine(value => value.batches.reduce((sum, batch) => sum + batch.quantity, 0) <= 999999);
export const errorResponse = (error: unknown) => Response.json({ error: error instanceof Error ? error.message : 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
