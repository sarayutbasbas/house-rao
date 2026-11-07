'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';
import { BottomSheet } from './bottom-sheet';
import { ProductImagePicker } from './product-image-picker';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { compressImage } from '@/lib/compress-image';
import type { Room } from '@/lib/types';

export function RoomForm({ houseId, room, onClose, onSaved }: { houseId: string; room?: Room; onClose: () => void; onSaved: (room: Room | null) => void }) {
  const [name, setName] = useState(room?.name ?? '');
  const [description, setDescription] = useState(room?.description ?? '');
  const [imageUrl, setImageUrl] = useState(room?.imageUrl ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (!photo) { setPreview(''); return; } const url = URL.createObjectURL(photo); setPreview(url); return () => URL.revokeObjectURL(url); }, [photo]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      let savedImage = imageUrl;
      if (photo) {
        const form = new FormData(); form.set('houseId', houseId); form.set('kind', 'room'); form.set('file', await compressImage(photo, false));
        const upload = await fetch('/api/upload', { method: 'POST', body: form }); const result = await upload.json();
        if (!upload.ok) throw new Error(result.error || 'อัปโหลดรูปไม่สำเร็จ');
        savedImage = result.url; setImageUrl(savedImage); setPhoto(null);
      }
      const response = await fetch(`/api/houses/${houseId}/rooms${room ? `/${room.id}` : ''}`, { method: room ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: description || null, imageUrl: savedImage || null }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      toast.success(room ? 'บันทึกแล้ว' : 'เพิ่มห้องแล้ว'); onSaved(result);
    } catch (e) { const message = e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'; setError(message); toast.error(message); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!room || busy) return; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/houses/${houseId}/rooms/${room.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: true }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      toast.success('ลบห้องแล้ว สินค้ายังอยู่ในรายการที่ไม่ระบุห้อง'); onSaved(null);
    } catch (e) { const message = e instanceof Error ? e.message : 'ลบห้องไม่สำเร็จ'; setError(message); toast.error(message); }
    finally { setBusy(false); }
  }
  return <>
    <BottomSheet title={room ? 'แก้ไขห้อง' : 'เพิ่มห้อง'} subtitle="ข้อมูลห้อง" busy={busy} onClose={onClose} onSubmit={save} footer={<><Button type="submit" className="flex-1" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</Button>{room && <Button type="button" variant="outline" size="icon" className="text-destructive" disabled={busy} aria-label="ลบห้อง" onClick={() => setConfirm(true)}><Trash2 size={20}/></Button>}</>}>
      <ProductImagePicker portrait={false} subject="ห้อง" preview={preview || imageUrl} pending={!!photo} busy={busy} onSelect={setPhoto} onRemove={() => { setPhoto(null); setImageUrl(''); }}/>
      <div className="space-y-2"><Label htmlFor="room-name">ชื่อห้อง *</Label><Input id="room-name" value={name} maxLength={80} required onChange={e => setName(e.target.value)} placeholder="เช่น ห้องครัว"/></div>
      {!room && <div className="flex flex-wrap gap-2">{['ห้องครัว', 'ห้องนั่งเล่น', 'ห้องนอน', 'ห้องน้ำ'].map(label => <Button key={label} type="button" variant="secondary" size="sm" onClick={() => setName(label)}>{label}</Button>)}</div>}
      <div className="space-y-2"><Label htmlFor="room-description">รายละเอียดห้อง</Label><Input id="room-description" maxLength={240} value={description} onChange={e => setDescription(e.target.value)} placeholder="เช่น ชั้น 2 ฝั่งระเบียง"/></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </BottomSheet>
    <Dialog open={confirm} onOpenChange={value => { if (!busy) setConfirm(value); }}><DialogContent className="member-confirm-dialog" role="alertdialog" showCloseButton={false} onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onPointerDownOutside={e => { if (busy) e.preventDefault(); }}>
      <span className="member-confirm-icon"><AlertTriangle/></span><DialogHeader><DialogTitle>ลบห้องนี้?</DialogTitle><DialogDescription>ลบห้องและหมวดหมู่ สินค้าย้ายไป “ไม่ระบุห้อง”</DialogDescription></DialogHeader>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <DialogFooter className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm(false)}>ยกเลิก</Button><Button type="button" variant="destructive" disabled={busy} onClick={() => void remove()}>{busy ? 'กำลังลบ…' : 'ลบห้อง'}</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
