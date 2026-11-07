'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, type ComponentProps } from 'react';
import { ItemDetail } from './item-detail';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Category, InventoryItem, StockBatch, Room } from '@/lib/types';

type DetailData = { item: InventoryItem & { batches: StockBatch[] }; categories: Category[]; rooms: Room[] };
const ItemSheetContext = createContext<((id: string) => void) | null>(null);

export function ItemSheetProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<DetailData | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const notice = toast.loading('กำลังเปิดสินค้า…');
    async function load() {
      try {
        const response = await fetch(`/api/items/${id}`, { signal: controller.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'โหลดสินค้าไม่สำเร็จ');
        if (!controller.signal.aborted) setData(result);
      } catch (reason) {
        if (!controller.signal.aborted) { toast.error(reason instanceof Error ? reason.message : 'โหลดสินค้าไม่สำเร็จ'); setId(null); }
      } finally { toast.dismiss(notice); }
    }
    void load();
    return () => { controller.abort(); toast.dismiss(notice); };
  }, [id]);
  function open(nextId: string) { setData(null); setId(nextId); }
  return <ItemSheetContext.Provider value={open}>{children}{id && data &&
    <ItemDetail key={id} onClose={() => setId(null)} houseId={data.item.houseId} initialItem={data.item} categories={data.categories} rooms={data.rooms}/>}
  </ItemSheetContext.Provider>;

}

export function ItemDetailLink({ href, children, onClick, ...props }: ComponentProps<typeof Link>) {
  const open = useContext(ItemSheetContext);
  return <Link {...props} href={href} prefetch={false} onClick={event => {
    onClick?.(event);
    const id = typeof href === 'string' ? href.match(/^\/[^/]+\/items\/([0-9a-f-]+)$/)?.[1] : undefined;
    if (!event.defaultPrevented && open && id && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault(); open(id);
    }
  }}>{children}</Link>;
}
