import { z } from 'zod';
import { itemInput } from './validation';
export const roomInput = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).nullable().optional(),
  imageUrl: itemInput.shape.imageUrl,
});
