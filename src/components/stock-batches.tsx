'use client';

import { useState } from 'react';
import { Minus, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from './date-picker';
import { Label } from '@/components/ui/label';
import { expiryState, type StockBatch } from '@/lib/types';
import { normalizeIntegerInput, parseIntegerInput } from '@/lib/number-input';

export function StockBatches({ batches, unit, busy, archived, onConsume, onDateSave }: {
  batches: StockBatch[]; unit: string; busy: boolean; archived: boolean;
  onConsume: (batchId: string) => void;
  onDateSave: (batchId: string, expiryDate: string | null, quantity: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const live = batches.filter(batch => batch.quantity > 0);
  return <section className="space-y-2" aria-label="สต็อกแต่ละชุด">
    <div><h2 className="font-bold">สต็อกแต่ละชุด</h2><p className="mt-1 text-xs text-muted-foreground">เลือกชุดที่ต้องการใช้</p></div>
    {!live.length && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">สต็อกหมดแล้ว</p>}
    {live.map(batch => {
      const state = expiryState(batch.expiryDate);
      return <div key={batch.id} className="rounded-xl border p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1"><p className="text-sm font-semibold">{batch.quantity} {unit}</p><p className="text-sm text-muted-foreground">{batch.expiryDate ? `หมดอายุ ${batch.expiryDate}` : 'ไม่ระบุวันหมดอายุ'}</p>{state && <Badge variant={state === 'expired' ? 'destructive' : 'secondary'}>{state === 'expired' ? 'หมดอายุแล้ว' : 'ใกล้หมดอายุ'}</Badge>}</div>
          <div className="flex gap-1"><Button type="button" variant="ghost" size="icon-sm" disabled={busy} aria-label={`แก้วันหมดอายุชุด ${batch.expiryDate ?? 'ไม่ระบุวันที่'}`} onClick={() => { setEditing(batch.id); setDate(batch.expiryDate ?? ''); setQuantity(String(batch.quantity)); setError(''); }}><Pencil size={15}/></Button>{!archived && <Button type="button" variant="outline" size="icon" aria-label={`ใช้ 1 ${unit} จากชุด ${batch.expiryDate ?? 'ไม่ระบุวันที่'}`} title={`ใช้ 1 ${unit}`} disabled={busy} onClick={() => onConsume(batch.id)}><Minus size={18}/></Button>}</div>
        </div>
        {editing === batch.id && <div className="mt-3 space-y-2">
          <Label htmlFor={`edit-quantity-${batch.id}`}>จำนวนที่ใช้วันหมดอายุนี้</Label><Input id={`edit-quantity-${batch.id}`} type="number" inputMode="numeric" required min={1} max={batch.quantity} step={1} value={quantity} onChange={event => setQuantity(normalizeIntegerInput(event.target.value))} disabled={busy}/>
          <Label htmlFor={`edit-expiry-${batch.id}`}>วันหมดอายุของชุดนี้</Label><DatePicker id={`edit-expiry-${batch.id}`} value={date} onChange={setDate} disabled={busy} />
          <p className="text-xs text-muted-foreground">ระบุบางส่วนเพื่อแยกชุด</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2"><Button type="button" size="sm" disabled={busy} onClick={async () => { setError(''); try { const amount = parseIntegerInput(quantity, 1); if (amount > batch.quantity) throw new Error('จำนวนต้องไม่เกินสต็อกที่เหลือ'); if (await onDateSave(batch.id, date || null, amount)) setEditing(null); } catch (reason) { setError(reason instanceof Error ? reason.message : 'จำนวนไม่ถูกต้อง'); } }}>บันทึกวันที่</Button><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setEditing(null)}>ยกเลิก</Button></div>
        </div>}
      </div>;
    })}

  </section>;
}
