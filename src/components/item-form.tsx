'use client';
import { notifyShoppingChanged } from '@/lib/use-shopping-count';
import dynamic from 'next/dynamic';
import { Button } from './ui/button';
import { ScanBarcode, Trash2, AlertTriangle } from 'lucide-react';
const BarcodeScanner = dynamic(() => import('./barcode-scanner').then(m => m.BarcodeScanner), { ssr: false });
import { toast } from 'sonner';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StockBatches } from './stock-batches';
import { CategoryIconPicker } from './category-icon-picker';
import type { CategoryIconKey } from '@/lib/category-icons';
import { ProductImagePicker } from './product-image-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { BottomSheet } from './bottom-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { Category, InventoryItem, Room, StockBatch, ItemStock } from '@/lib/types';
import { compressImage } from '@/lib/compress-image';
import { BatchFields, initialBatchDraft, parseBatches } from '@/components/batch-fields';
import { normalizeIntegerInput, parseIntegerInput } from '@/lib/number-input';

type Props = { houseId: string; categories: Category[]; rooms?: Room[]; defaultRoomId?: string; item?: InventoryItem & { batches?: StockBatch[] }; onClose: () => void; onSaved: () => void; onDeleted?: () => void };

export function ItemForm({ houseId, categories, rooms = [], defaultRoomId, item, onClose, onSaved, onDeleted }: Props) {
  const router = useRouter();
  const [stock, setStock] = useState(item);
  const [addingStock, setAddingStock] = useState(false);
  const [stockDraft, setStockDraft] = useState(initialBatchDraft);
  const [confirmDelete,setConfirmDelete] = useState(false);
  const [scanner,setScanner] = useState(false);
  const [barcode,setBarcode] = useState(item?.barcode ?? '');
  const [roomId, setRoomId] = useState(item?.roomId ?? defaultRoomId ?? '');
  const [location, setLocation] = useState(item?.location ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '');
  const [availableCategories, setAvailableCategories] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<CategoryIconKey>('help');
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [size, setSize] = useState(item?.size ?? '');
  const [variant, setVariant] = useState(item?.variant ?? '');
  const [batches, setBatches] = useState(initialBatchDraft);
  const [unit, setUnit] = useState(item?.unit ?? 'ชิ้น');
  const [minimum, setMinimum] = useState(String(item?.minimum ?? 2));
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const [error, setError] = useState('');

  function selectPhoto(file: File) {
    if (file.size > 8_000_000) { setError('รูปต้นฉบับต้องไม่เกิน 8 MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('รองรับ JPG, PNG และ WebP เท่านั้น'); return; }
    setError(''); setPhoto(file);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      let savedCategoryId = categoryId;
      if (categoryId === '__new__') {
        const response = await fetch(`/api/houses/${houseId}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategoryName, iconKey: newCategoryIcon, roomId: roomId || null }) });
        const category = await response.json();
        if (!response.ok) throw new Error(category.error || 'สร้างหมวดหมู่ไม่สำเร็จ');
        savedCategoryId = category.id; setCategoryId(category.id);
        setAvailableCategories(old => [...old, category]);
        notifyShoppingChanged(); toast.success('สร้างหมวดหมู่แล้ว');
      }
      let savedImageUrl = imageUrl;
      if (photo) {
        setUploading(true);
        const compressed = await compressImage(photo);
        const form = new FormData(); form.append('houseId', houseId); form.append('kind', 'product'); form.append('file', compressed);
        const response = await fetch('/api/upload', { method: 'POST', body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'อัปโหลดรูปไม่สำเร็จ');
        savedImageUrl = result.url; setImageUrl(result.url); setPhoto(null);
        setUploading(false);
      }
      const payload = { houseId, barcode: barcode || null, roomId: roomId || null, location: location || null, name, categoryId: savedCategoryId || null, brand: brand || null, size: size || null, variant: variant || null, imageUrl: savedImageUrl || null, unit, minimum: parseIntegerInput(minimum), ...(!item && { batches: parseBatches(batches) }) };
      const response = await fetch(item ? `/api/items/${item.id}` : '/api/items', { method: item ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      notifyShoppingChanged(); toast.success('บันทึกสินค้าแล้ว');
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setBusy(false); setUploading(false); }
  }

  async function changeStock(endpoint: 'quantity' | 'batches', method: 'POST' | 'PATCH', payload: unknown) {
    if (!item || busy) return false;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/items/${item.id}/${endpoint}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'บันทึกสต็อกไม่สำเร็จ');
      setStock(old => old ? { ...old, ...(data as ItemStock) } : old);
      notifyShoppingChanged(); toast.success('บันทึกสต็อกแล้ว'); router.refresh(); return true;
    } catch (reason) { const message = reason instanceof Error ? reason.message : 'บันทึกสต็อกไม่สำเร็จ'; setError(message); toast.error(message); return false; }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!item || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/items/${item.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      notifyShoppingChanged(); toast.success('ลบสินค้าแล้ว');
      (onDeleted ?? onSaved)();
    } catch (reason) { const message = reason instanceof Error ? reason.message : 'ลบสินค้าไม่สำเร็จ'; setError(message); toast.error(message); }
    finally { setBusy(false); }
  }

  return <><BottomSheet title={item ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'} subtitle="ข้อมูลสินค้า" onClose={onClose} onSubmit={save} busy={busy || uploading} submitLabel={item ? 'บันทึก' : 'เพิ่มสินค้า'} footer={item ? <><Button type="submit" disabled={busy || uploading}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</Button><Button type="button" variant="outline" size="icon" className="text-destructive" aria-label="ลบสินค้า" disabled={busy || uploading} onClick={() => setConfirmDelete(true)}><Trash2 size={20}/></Button></> : undefined}>
      <div className="space-y-1.5"><Label htmlFor="item-barcode">บาร์โค้ด (ถ้ามี)</Label><div className="flex items-center gap-2"><Input className="min-w-0 flex-1" id="item-barcode" inputMode="numeric" pattern="[0-9]{8,14}" title="เลขบาร์โค้ด 8–14 หลัก" maxLength={14} value={barcode} onChange={e=>setBarcode(e.target.value.replace(/\D/g,''))}/><Button type="button" variant="secondary" size="icon" className="size-[52px] shrink-0 rounded-full" aria-label="สแกนสินค้า" title="สแกนสินค้า" disabled={busy} onClick={()=>setScanner(true)}><ScanBarcode size={22}/></Button></div></div>
      {scanner&&<BarcodeScanner houseId={houseId} onClose={()=>setScanner(false)} onApply={product=>{setBarcode(product.code);if(product.name)setName(product.name);if(product.brand)setBrand(product.brand);if(product.size)setSize(product.size);if(product.unit)setUnit(product.unit);setScanner(false);notifyShoppingChanged(); toast.success('ใส่ข้อมูลแล้ว กรุณาตรวจสอบ');}}/>}
      <ProductImagePicker preview={preview || imageUrl} pending={!!photo} busy={busy || uploading} onSelect={selectPhoto} onRemove={() => { setPhoto(null); setImageUrl(''); }} />
        <div className="space-y-1.5"><Label htmlFor="item-name">ชื่อสินค้า *</Label><Input id="item-name" required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="เช่น นมโอ๊ต บาริสต้า" /></div>
        <div className="space-y-1.5"><Label htmlFor="item-room">ห้องที่เก็บ</Label><NativeSelect id="item-room" className="w-full" value={roomId} onChange={e => { setRoomId(e.target.value); setCategoryId(''); }}><NativeSelectOption value="">ยังไม่ระบุห้อง</NativeSelectOption>{rooms.map(room => <NativeSelectOption key={room.id} value={room.id}>{room.name}</NativeSelectOption>)}</NativeSelect></div>
        <div className="space-y-1.5"><Label htmlFor="item-location">ตำแหน่งในห้อง</Label><Input id="item-location" maxLength={120} value={location} onChange={e => setLocation(e.target.value)} placeholder="เช่น ตู้ใต้ซิงก์ / ลิ้นชักชั้น 2" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="item-category">หมวดหมู่</Label><NativeSelect id="item-category" className="w-full" value={categoryId} onChange={e => setCategoryId(e.target.value)}><NativeSelectOption value="">ไม่ระบุ</NativeSelectOption>{availableCategories.filter(c => (c.roomId ?? '') === roomId).map(c => <NativeSelectOption key={c.id} value={c.id}>{c.name}</NativeSelectOption>)}<NativeSelectOption value="__new__">อื่น ๆ — สร้างหมวดหมู่ใหม่</NativeSelectOption></NativeSelect></div>
          <div className="space-y-1.5"><Label htmlFor="item-brand">แบรนด์</Label><Input id="item-brand" value={brand} onChange={e => setBrand(e.target.value)} placeholder="เช่น Oatly" /></div>
        </div>
        {categoryId === '__new__' && <section className="space-y-4 rounded-2xl border bg-muted/30 p-3"><div className="space-y-1.5"><Label htmlFor="new-category-name">ชื่อหมวดหมู่ใหม่ *</Label><Input id="new-category-name" required maxLength={50} value={newCategoryName} onChange={event => setNewCategoryName(event.target.value)} placeholder="เช่น ของใช้สัตว์เลี้ยง" /></div><p className="text-sm font-medium">เลือกไอคอน</p><CategoryIconPicker value={newCategoryIcon} onChange={setNewCategoryIcon} disabled={busy} /></section>}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="item-size">ขนาด / น้ำหนัก</Label><Input id="item-size" value={size} onChange={e => setSize(e.target.value)} placeholder="เช่น 1 ลิตร" /></div>
          <div className="space-y-1.5"><Label htmlFor="item-variant">รสชาติ / กลิ่น</Label><Input id="item-variant" value={variant} onChange={e => setVariant(e.target.value)} placeholder="เช่น Original" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="item-unit">หน่วย *</Label><Input id="item-unit" required value={unit} onChange={e => setUnit(e.target.value)} placeholder="ชิ้น" /></div>
          <div className="space-y-1.5"><Label htmlFor="item-minimum">เตือนเมื่อ ≤</Label><Input id="item-minimum" type="number" inputMode="numeric" required min={0} max={999999} step={1} value={minimum} onChange={e => setMinimum(normalizeIntegerInput(e.target.value))} /></div>
        </div>
        {item && stock ? <section className="space-y-3 border-t pt-3">
          <div className="flex items-center justify-between gap-2"><p className="font-semibold">คงเหลือ {stock.quantity} {stock.unit}</p><Button type="button" variant="secondary" disabled={busy} onClick={() => setAddingStock(value => !value)}>{addingStock ? 'ยกเลิกเติมสต็อก' : 'เติมสต็อก'}</Button></div>
          {addingStock && <div className="space-y-3 rounded-xl border p-3"><BatchFields value={stockDraft} onChange={setStockDraft} minimum={1} disabled={busy}/><Button type="button" disabled={busy} onClick={async () => { try { if (await changeStock('batches', 'POST', { batches: parseBatches(stockDraft, 1) })) { setAddingStock(false); setStockDraft(initialBatchDraft()); } } catch (reason) { setError(reason instanceof Error ? reason.message : 'จำนวนไม่ถูกต้อง'); } }}>เติมสต็อก</Button></div>}
          <StockBatches batches={stock.batches ?? []} unit={stock.unit} busy={busy} archived={stock.archived} onConsume={batchId => void changeStock('quantity', 'POST', { delta: -1, batchId })} onDateSave={(batchId, expiryDate, quantity) => changeStock('batches', 'PATCH', { batchId, expiryDate, quantity })}/>
        </section> : <BatchFields value={batches} onChange={setBatches} disabled={busy} />}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </BottomSheet>
    <Dialog open={confirmDelete} onOpenChange={value => { if (!busy) setConfirmDelete(value); }}><DialogContent className="member-confirm-dialog" role="alertdialog" showCloseButton={false} onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onPointerDownOutside={e => { if (busy) e.preventDefault(); }}><span className="member-confirm-icon"><AlertTriangle/></span><DialogHeader><DialogTitle>ลบสินค้า?</DialogTitle><DialogDescription>ลบสินค้า สต็อก และประวัติถาวร</DialogDescription></DialogHeader><DialogFooter className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>ยกเลิก</Button><Button type="button" variant="destructive" disabled={busy} onClick={() => void remove()}>{busy ? 'กำลังลบ…' : 'ลบสินค้า'}</Button></DialogFooter></DialogContent></Dialog></>;
}
