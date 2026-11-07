import { z } from 'zod';
import { CATEGORY_ICON_KEYS, categoryIconKey } from './category-icons';

export const categoryInput = z.object({
  roomId: z.uuid().nullable().optional(),
  name: z.string().trim().min(1).max(50),
  iconKey: z.enum(CATEGORY_ICON_KEYS).optional(),
  // Accept forms opened before the icon picker deployment.
  emoji: z.string().max(8).optional(),
}).transform(({ name, iconKey, emoji, roomId }) => ({ name, roomId, emoji: iconKey ?? categoryIconKey(emoji, name) }));
