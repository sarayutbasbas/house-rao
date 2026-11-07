'use client';
import { toast } from 'sonner';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { SearchInput } from './search-input';
import { NativeSelect, NativeSelectOption } from './ui/native-select';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { BottomSheet } from './bottom-sheet';
import { CategoryIcon } from './category-icon';
import { CategoryIconPicker } from './category-icon-picker';
import { categoryIconKey, type CategoryIconKey } from '@/lib/category-icons';
import type { Category, Room } from '@/lib/types';

// Detail header + search + add sheet follow bn-trip's master checklist page.
export function CategoryManager({ houseId, initialCategories, rooms, initialRoomId = '' }: { houseId: string; initialCategories: Category[]; rooms: Room[]; initialRoomId?: string }) {
  const router = useRouter();
  const [roomId, setRoomId] = useState(initialRoomId);
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState<CategoryIconKey>('package');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function openForm(category?: Category) {
    setEditing(category ?? null); setName(category?.name ?? ''); setIconKey(categoryIconKey(category?.emoji, category?.name));
    setError(''); setConfirmDelete(false); setOpen(true);
  }
  async function remove() {
    if (!editing || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/houses/${houseId}/categories/${editing.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCategories(old => old.filter(category => category.id !== editing.id));
      setOpen(false); setConfirmDelete(false); toast.success('ลบหมวดหมู่แล้ว'); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'ลบหมวดหมู่ไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy || confirmDelete) return; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/houses/${houseId}/categories${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, iconKey, roomId: editing ? editing.roomId : roomId || null }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      toast.success(editing ? 'แก้ไขหมวดหมู่แล้ว' : 'เพิ่มหมวดหมู่แล้ว');
      setCategories(old => editing ? old.map(category => category.id === editing.id ? data : category) : [...old, data]); setName(''); setIconKey('package'); setOpen(false); router.refresh();
    } catch(error) { setError(error instanceof Error ? error.message : 'เพิ่มหมวดหมู่ไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  const filtered = categories.filter(category => (category.roomId ?? '') === roomId && category.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <div className="category-detail space-y-5">
    <Link replace href={initialRoomId ? `/rooms/${initialRoomId}` : '/settings'} className="detail-back" aria-label="กลับ"><ArrowLeft size={22}/><span>{initialRoomId ? 'กลับไปห้อง' : 'ตั้งค่า'}</span></Link>
    <header className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">หมวดหมู่สินค้า</h1><p className="mt-1 text-sm text-muted-foreground">จัดกลุ่มสินค้า</p></div><Button className="tone-butter size-11 shrink-0 rounded-full" variant="secondary" size="icon" aria-label="เพิ่มหมวดหมู่" onClick={() => openForm()}><Plus size={22}/></Button></header>
    <div className="space-y-2"><Label htmlFor="category-room">หมวดหมู่ของห้อง</Label><NativeSelect id="category-room" className="w-full" value={roomId} onChange={e => { setRoomId(e.target.value); setSearch(''); }}><NativeSelectOption value="">ไม่ระบุห้อง</NativeSelectOption>{rooms.map(r => <NativeSelectOption key={r.id} value={r.id}>{r.name}</NativeSelectOption>)}</NativeSelect></div>
    <SearchInput aria-label="ค้นหาหมวดหมู่" placeholder="ค้นหาหมวดหมู่" value={search} onChange={e => setSearch(e.target.value)} />
    <div className="space-y-2">{filtered.map((category,index) => <button type="button" key={category.id} className="directory-link category-list-row w-full text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary" aria-label={`แก้ไขหมวดหมู่ ${category.name}`} onClick={() => openForm(category)}><span className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl tone-${['butter','blush','lilac','mauve'][index%4]}`}><CategoryIcon value={category.emoji} name={category.name}/></span><strong className="min-w-0 flex-1 break-words">{category.name}</strong><Pencil size={18} className="shrink-0 text-primary" aria-hidden="true"/></button>)}{!filtered.length && <p className="py-10 text-center text-muted-foreground">ไม่พบหมวดหมู่</p>}</div>
    {open && <BottomSheet title={editing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'} subtitle="ชื่อและไอคอน" onClose={() => setOpen(false)} onSubmit={save} busy={busy} submitLabel="บันทึก" footer={editing ? <>
      <Button type="submit" className="flex-1" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</Button>
      <Button type="button" variant="outline" size="icon" className="shrink-0 text-destructive" disabled={busy} aria-label="ลบหมวดหมู่" onClick={() => { setError(''); setConfirmDelete(true); }}><Trash2 size={20}/></Button>
    </> : undefined}><div className="space-y-2"><Label className="block leading-relaxed" htmlFor="category-name">ชื่อหมวดหมู่</Label><Input id="category-name" required maxLength={50} value={name} onChange={e => setName(e.target.value)} /></div><div className="space-y-3"><p className="text-sm font-medium">เลือกไอคอน</p><CategoryIconPicker value={iconKey} onChange={setIconKey} disabled={busy || confirmDelete}/></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</BottomSheet>}
    <Dialog open={confirmDelete} onOpenChange={value => { if (!busy) setConfirmDelete(value); }}><DialogContent className="member-confirm-dialog" role="alertdialog" showCloseButton={false} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onPointerDownOutside={event => { if (busy) event.preventDefault(); }}>
      <span className="member-confirm-icon"><AlertTriangle/></span><DialogHeader><DialogTitle>ลบหมวดหมู่?</DialogTitle><DialogDescription>สินค้าจะเป็น “ไม่ระบุหมวดหมู่”</DialogDescription></DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>ยกเลิก</Button><Button type="button" variant="destructive" disabled={busy} onClick={() => void remove()}>{busy ? 'กำลังลบ…' : 'ลบหมวดหมู่'}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
