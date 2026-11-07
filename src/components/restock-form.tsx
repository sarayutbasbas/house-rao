'use client';
import { notifyShoppingChanged } from '@/lib/use-shopping-count';
import { toast } from 'sonner';

import { useState } from 'react';
import { BottomSheet } from './bottom-sheet';
import { BatchFields, initialBatchDraft, parseBatches } from '@/components/batch-fields';
import type { InventoryItem, ItemStock } from '@/lib/types';

export function RestockForm({ item, onClose, onSaved }: {
  item: InventoryItem; onClose: () => void; onSaved: (stock: ItemStock) => void;
}) {
  const [batches, setBatches] = useState(initialBatchDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`/api/items/${item.id}/batches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batches: parseBatches(batches, 1) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      notifyShoppingChanged(); toast.success('เติมสต็อกแล้ว');
      onSaved(data);
    } catch (error) { setError(error instanceof Error ? error.message : 'เติมสต็อกไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  return <BottomSheet title={`เติมสต็อก ${item.name}`} subtitle={`จำนวน (${item.unit}) และวันหมดอายุ`} onClose={onClose} onSubmit={save} busy={busy} submitLabel="เติมสต็อก">
    <BatchFields value={batches} onChange={setBatches} minimum={1} disabled={busy}/>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </BottomSheet>;
}
