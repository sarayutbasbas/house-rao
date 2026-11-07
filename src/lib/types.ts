import type { InferSelectModel } from 'drizzle-orm'; import { items, categories, itemBatches, rooms } from '@/db/schema';
export type Room = InferSelectModel<typeof rooms>;
export type RoomSummary = Room & { itemCount: number };
export type Category = InferSelectModel<typeof categories>;
export type InventoryItem = InferSelectModel<typeof items> & { category: Category | null; room: Room | null };
export type StockBatch = InferSelectModel<typeof itemBatches>;
export type ItemStock = InferSelectModel<typeof items> & { batches: StockBatch[] };
export function expiryState(value:string|null){if(!value)return null;const today=new Date();today.setHours(0,0,0,0);const day=new Date(`${value}T00:00:00`);const days=Math.ceil((day.getTime()-today.getTime())/86400000);return days<0?'expired':days<=7?'soon':null}

export function itemAddress(item: Pick<InventoryItem, 'room' | 'category' | 'location'>) {
  return [item.room?.name ?? 'ยังไม่ระบุห้อง', item.category?.name, item.location].filter(Boolean).join(' › ');
}
