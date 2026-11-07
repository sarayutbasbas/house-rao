'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DoorOpen, Plus, Pencil, ArrowLeft, Layers, Package } from 'lucide-react';
import { Button } from './ui/button';
import { RoomForm } from './room-form';
import type { Room, RoomSummary } from '@/lib/types';

export function RoomBoard({ houseId, initialRooms, management = false }: { houseId: string; initialRooms: RoomSummary[]; management?: boolean }) {
  const router = useRouter();
  const [rooms, setRooms] = useState(initialRooms);
  const [editor, setEditor] = useState<Room | 'new' | null>(null);
  useEffect(() => setRooms(initialRooms), [initialRooms]);
  return <section className="room-section space-y-4">
    {management && <Link href="/settings" replace className="detail-back"><ArrowLeft size={22}/>ตั้งค่า</Link>}
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">ห้องในบ้าน</h2><p className="mt-1 text-sm text-muted-foreground">{rooms.length ? `${rooms.length} ห้อง` : 'เพิ่มห้องเพื่อจัดของ'}</p></div><Button type="button" size="icon" variant="secondary" className="tone-butter" aria-label="เพิ่มห้อง" onClick={() => setEditor('new')}><Plus size={22}/></Button></div>
    {rooms.length ? <div className="room-masonry">{rooms.map((room, index) => <article className="room-card" key={room.id}>
      <Link href={`/rooms/${room.id}`} className="block" aria-label={`เปิดห้อง ${room.name}`}>
        <div className={`room-cover tone-${['butter', 'blush', 'lilac', 'mauve'][index % 4]}`}>{room.imageUrl ? <img src={room.imageUrl} alt={room.name} loading="lazy" decoding="async"/> : <DoorOpen size={48} strokeWidth={1.4}/>}<span className="room-count-badge"><Package size={12}/><span>{room.itemCount} รายการ</span></span></div>
        <div className="room-card-copy"><h3>{room.name}</h3>{room.description && <p>{room.description}</p>}</div>
      </Link>
      {management && <Button type="button" variant="outline" size="icon-sm" className="room-card-edit" aria-label={`แก้ไขห้อง ${room.name}`} onClick={() => setEditor(room)}><Pencil size={16}/></Button>}
    </article>)}</div> : <button type="button" className="room-empty" onClick={() => setEditor('new')}><DoorOpen size={36}/><strong>เพิ่มห้อง</strong><span>เริ่มจัดของในบ้าน</span></button>}
    {editor && <RoomForm houseId={houseId} room={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSaved={saved => { setRooms(old => saved ? old.some(r => r.id === saved.id) ? old.map(r => r.id === saved.id ? { ...r, ...saved } : r) : [...old, { ...saved, itemCount: 0 }] : old.filter(r => r.id !== (editor === 'new' ? '' : editor.id))); setEditor(null); router.refresh(); }}/>}
  </section>;
}
// Cover layout follows bn-trip's TripDetailHeader: full bleed image and overlaid controls.
export function RoomCover({ room }: { room: Room }) {
  const router = useRouter(); const [editing, setEditing] = useState(false);
  return <>
    <header className="room-detail-cover">
      {room.imageUrl ? <img src={room.imageUrl} alt={`รูปปก ${room.name}`} className="room-detail-cover-image" fetchPriority="high"/> : <div className="room-detail-cover-placeholder"><DoorOpen size={96} strokeWidth={1}/></div>}
      <Button asChild variant="ghost" size="icon" className="room-cover-back"><Link href="/home" replace aria-label="กลับไปห้องในบ้าน"><ArrowLeft size={21}/></Link></Button>
      <div className="room-cover-actions"><Button asChild variant="ghost" size="icon"><Link href={`/settings/categories?room=${room.id}`} aria-label="หมวดหมู่ในห้อง"><Layers size={20}/></Link></Button><Button variant="ghost" size="icon" aria-label="แก้ไขห้อง" onClick={() => setEditing(true)}><Pencil size={20}/></Button></div>
      <div className="room-cover-copy"><p>ห้องในบ้าน</p><h1>{room.name}</h1><p>{room.description || 'สินค้าในห้อง'}</p></div>
    </header>
    {editing && <RoomForm houseId={room.houseId} room={room} onClose={() => setEditing(false)} onSaved={saved => { setEditing(false); if (!saved) router.replace('/home'); router.refresh(); }}/>}</>;
}
