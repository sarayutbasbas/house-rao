'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from './date-picker';
import { Label } from '@/components/ui/label';
import { normalizeIntegerInput, parseIntegerInput } from '@/lib/number-input';

export type BatchDraft = { key: string; quantity: string; expiryDate: string };
export const initialBatchDraft = (): BatchDraft[] => [{ key: 'initial', quantity: '1', expiryDate: '' }];
export function parseBatches(drafts: BatchDraft[], minimum = 0) {
  const batches = drafts.map(draft => ({ quantity: parseIntegerInput(draft.quantity, minimum), expiryDate: draft.expiryDate || null }));
  if (batches.reduce((total, batch) => total + batch.quantity, 0) > 999999) throw new Error('จำนวนรวมต้องไม่เกิน 999,999');
  return batches;
}

export function BatchFields({ value, onChange, minimum = 0, disabled = false }: {
  value: BatchDraft[]; onChange: (value: BatchDraft[]) => void; minimum?: number; disabled?: boolean;
}) {
  function update(key: string, patch: Partial<BatchDraft>) {
    onChange(value.map(batch => batch.key === key ? { ...batch, ...patch } : batch));
  }
  return <fieldset disabled={disabled} className="min-w-0 space-y-3">
    <legend className="mb-2 text-sm font-semibold">จำนวนและวันหมดอายุ</legend>
    <p className="text-xs text-muted-foreground">แยกชุดเมื่อหมดอายุต่างวัน · เว้นวันที่ได้</p>
    {value.map((batch, index) => <div key={batch.key} className="rounded-xl border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">ชุดที่ {index + 1}</span>{value.length > 1 && <Button type="button" variant="ghost" size="icon-sm" aria-label={`ลบชุดที่ ${index + 1}`} onClick={() => onChange(value.filter(row => row.key !== batch.key))}><Trash2 size={14}/></Button>}</div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3">
        <div className="min-w-0 space-y-1.5"><Label htmlFor={`batch-quantity-${batch.key}`}>จำนวน *</Label><Input id={`batch-quantity-${batch.key}`} type="number" inputMode="numeric" required min={minimum} max={999999} step={1} value={batch.quantity} onChange={e => update(batch.key, { quantity: normalizeIntegerInput(e.target.value) })}/></div>
        <div className="min-w-0 space-y-1.5"><Label htmlFor={`batch-expiry-${batch.key}`}>วันหมดอายุ</Label><DatePicker id={`batch-expiry-${batch.key}`} value={batch.expiryDate} onChange={expiryDate => update(batch.key, { expiryDate })} disabled={disabled} label={`วันหมดอายุชุดที่ ${index + 1}`} /></div>
      </div>
    </div>)}
    <Button type="button" variant="outline" size="icon" aria-label="เพิ่มชุดวันหมดอายุ" title="เพิ่มชุดวันหมดอายุ" disabled={value.length >= 100} onClick={() => onChange([...value, { key: crypto.randomUUID(), quantity: '1', expiryDate: '' }])}><Plus size={20}/></Button>
  </fieldset>;
}
