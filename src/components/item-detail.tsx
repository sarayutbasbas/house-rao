'use client';

import { useRouter } from 'next/navigation';
import { ItemForm } from './item-form';
import type { Category, InventoryItem, StockBatch, Room } from '@/lib/types';

export function ItemDetail({ houseId, initialItem, categories, rooms = [], onClose }: {
  houseId: string; initialItem: InventoryItem & { batches: StockBatch[] };
  categories: Category[]; rooms?: Room[]; onClose?: () => void;
}) {
  const router = useRouter();
  const close = onClose ?? (() => router.replace(initialItem.archived ? '/history' : '/inventory'));
  return <ItemForm houseId={houseId} item={initialItem} categories={categories} rooms={rooms}
    onClose={close} onSaved={() => { close(); router.refresh(); }} onDeleted={() => { close(); router.refresh(); }}/>
}
