'use client';
import { notifyShoppingChanged } from '@/lib/use-shopping-count';
import { CategoryIcon } from './category-icon';

import { ItemDetailLink } from './item-sheet-provider';
import { toast } from 'sonner';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Settings2, RotateCcw, X, CalendarClock, Minus, Package, Plus, ShoppingBasket } from 'lucide-react';
import { BottomSheet } from './bottom-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchInput } from './search-input';
import { SectionHeading } from './section-heading';
import { PageIntro } from './page-intro';
import { SegmentedFilter } from './segmented-filter';
import { EmptyState } from './empty-state';
import { ItemForm } from './item-form';
import { RestockForm } from './restock-form';
import { expiryState, type Category, type InventoryItem, type Room, itemAddress } from '@/lib/types';

type Props = { houseId: string; initialItems: InventoryItem[]; categories: Category[]; rooms: Room[]; fixedRoomId?: string };

export function Inventory({ houseId, initialItems, categories, rooms, fixedRoomId }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const expiredOnly = !fixedRoomId && params.get('status') === 'expired';
  const [list, setList] = useState(initialItems);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [room, setRoom] = useState(fixedRoomId ?? 'all');
  const [draftRoom, setDraftRoom] = useState(fixedRoomId ?? 'all');
  const [draftCategory, setDraftCategory] = useState('all');
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState<'all' | 'low' | 'expiring'>('all');
  const [form, setForm] = useState(false);
  const [restocking, setRestocking] = useState<InventoryItem | null>(null);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  useEffect(() => setList(initialItems), [initialItems]);
  const scopeItems = list.filter(item => !fixedRoomId || item.roomId === fixedRoomId);
  const currentItems = scopeItems.filter(item => !item.archived);
  const low = currentItems.filter(item => item.quantity <= item.minimum);
  const expiring = currentItems.filter(item => expiryState(item.expiryDate));
  const filtered = useMemo(() => list.filter(item => {
    const q = search.trim().toLocaleLowerCase();
    return (q || !item.archived) && (!q || `${item.name} ${item.barcode ?? ''} ${item.brand ?? ''} ${item.size ?? ''} ${item.variant ?? ''} ${item.unit} ${itemAddress(item)}`.toLocaleLowerCase().includes(q))
      && (room === 'all' || (room === 'none' ? !item.roomId : item.roomId === room))
      && (category === 'all' || item.categoryId === category)
      && (!expiredOnly || (item.quantity > 0 && expiryState(item.expiryDate) === 'expired'))
      && (filter === 'all' || (filter === 'low' ? item.quantity <= item.minimum : !!expiryState(item.expiryDate)));
  }), [list, search, category, filter, room, expiredOnly]);

  async function refresh() {
    const response = await fetch(`/api/items?houseId=${houseId}&scope=all`, { cache: 'no-store' });
    if (response.ok) setList(await response.json());
    router.refresh();
  }
  async function quantity(item: InventoryItem, delta: number) {
    if (busyId) return;
    if (delta > 0) { setRestocking(item); return; }
    setBusyId(item.id); setError('');
    try {
      const response = await fetch(`/api/items/${item.id}/quantity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delta }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      notifyShoppingChanged(); toast.success('บันทึกสินค้าแล้ว');
      setList(old => old.map(row => row.id === item.id ? { ...row, ...data } : row));
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'แก้จำนวนไม่สำเร็จ'); }
    finally { setBusyId(''); }
  }

  return <div className="fade-in">
    {!fixedRoomId && <PageIntro title="สินค้าทั้งหมด" subtitle="สินค้าในบ้าน" />}
    {expiredOnly && <div className="mt-3 flex items-center justify-between text-sm"><span>รายการหมดอายุ</span><Button variant="ghost" size="sm" onClick={() => router.replace('/inventory')}>ดูทั้งหมด</Button></div>}
    <div className="inventory-toolbar mt-3">
      <form role="search" className="min-w-0 flex-1" onSubmit={e => e.preventDefault()}><SearchInput aria-label="ค้นหาสินค้า" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาสินค้า" /></form>
      <Button className="tone-blush" variant="secondary" size="icon" aria-label="กรองประเภทสินค้า" aria-expanded={filtersOpen} onClick={() => { setDraftRoom(room); setDraftCategory(category); setFiltersOpen(true); }}><Settings2 size={20}/>{(category !== 'all' || room !== (fixedRoomId ?? 'all')) && <span className="filter-dot"/>}</Button>
      <Button className="tone-butter" variant="secondary" size="icon" aria-label="เพิ่มสินค้า" onClick={() => setForm(true)}><Plus size={22}/></Button>
    </div>
    <SegmentedFilter value={filter} onChange={setFilter} ariaLabel="กรองสถานะสินค้า" countLabel="รายการ" className="mt-3" options={[
      { value: 'all', label: 'ทั้งหมด', Icon: Package, count: currentItems.length, tone: 'all' },
      { value: 'low', label: 'ใกล้หมด', Icon: ShoppingBasket, count: low.length, tone: 'upcoming' },
      { value: 'expiring', label: 'วันหมดอายุ', Icon: CalendarClock, count: expiring.length, tone: 'past' },
    ]}/>

    <SectionHeading className="my-3" title={category === 'all' ? (room === 'all' ? 'ของในบ้าน' : room === 'none' ? 'ยังไม่ระบุห้อง' : rooms.find(r => r.id === room)?.name ?? 'สินค้า') : categories.find(c => c.id === category)?.name ?? 'สินค้า'} subtitle={`${filtered.length} รายการ`} actions={category !== 'all' || room !== (fixedRoomId ?? 'all') ? <Button variant="ghost" size="sm" onClick={() => { setCategory('all'); setRoom(fixedRoomId ?? 'all'); }}><X size={15}/>ล้างตัวกรอง</Button> : undefined} />
    {filtersOpen && <BottomSheet title="กรองสินค้า" subtitle="ห้องและหมวดหมู่" onClose={() => setFiltersOpen(false)} footer={<><Button type="button" className="flex-1" onClick={() => { setRoom(draftRoom); setCategory(draftCategory); setFiltersOpen(false); }}>แสดงสินค้า</Button><Button type="button" variant="outline" size="icon" aria-label="ล้างตัวกรอง" title="ล้างตัวกรอง" onClick={() => { setDraftRoom(fixedRoomId ?? 'all'); setDraftCategory('all'); }}><RotateCcw size={20}/></Button></>}><>{!fixedRoomId && <div className="space-y-2"><p className="font-medium">ห้อง</p><div className="flex flex-wrap gap-2">{[{ id: 'all', name: 'ทุกห้อง' }, { id: 'none', name: 'ยังไม่ระบุห้อง' }, ...rooms].map(r => <Button key={r.id} type="button" variant="secondary" aria-pressed={draftRoom === r.id} className={draftRoom === r.id ? 'tone-lilac' : ''} onClick={() => { setDraftRoom(r.id); setDraftCategory('all'); }}>{r.name}</Button>)}</div></div>}<p className="font-medium">หมวดหมู่</p><div className="grid grid-cols-2 gap-2"><Button type="button" variant="secondary" className={draftCategory === 'all' ? 'tone-lilac' : ''} aria-pressed={draftCategory === 'all'} onClick={() => setDraftCategory('all')}>ทั้งหมด</Button>{categories.filter(cat => draftRoom === 'all' || (draftRoom === 'none' ? !cat.roomId : cat.roomId === draftRoom)).map(cat => <Button type="button" key={cat.id} variant="secondary" className={draftCategory === cat.id ? 'tone-lilac' : ''} aria-pressed={draftCategory === cat.id} onClick={() => setDraftCategory(cat.id)}><CategoryIcon value={cat.emoji} name={cat.name} size={18}/> {cat.name}{draftRoom === 'all' && cat.roomId ? ` · ${rooms.find(r => r.id === cat.roomId)?.name ?? ''}` : ''}</Button>)}</div></></BottomSheet>}
    {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
    {filtered.length > 0 ? <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">{filtered.map(item => <ItemCard key={item.id} item={item} href={`/${houseId}/items/${item.id}`} busy={busyId === item.id} onQuantity={delta => void quantity(item, delta)} />)}</div> : <EmptyState icon={<Package size={30}/>} title={scopeItems.length || search ? 'ไม่พบสินค้า' : 'ยังไม่มีสินค้า'} description={scopeItems.length || search ? 'ลองเปลี่ยนคำค้นหรือตัวกรอง' : 'เพิ่มสินค้าชิ้นแรก'} action={scopeItems.length || search ? 'ล้างตัวกรอง' : 'เพิ่มสินค้า'} onClick={() => { if (scopeItems.length || search) { setSearch(''); setCategory('all'); setRoom(fixedRoomId ?? 'all'); setFilter('all'); } else setForm(true); }} />}

    {form && <ItemForm houseId={houseId} categories={categories} rooms={rooms} defaultRoomId={fixedRoomId} onClose={() => setForm(false)} onSaved={() => { setForm(false); void refresh(); }} />}
    {restocking && <RestockForm item={restocking} onClose={() => setRestocking(null)} onSaved={stock => { setList(old => old.map(row => row.id === stock.id ? { ...row, ...stock } : row)); setRestocking(null); router.refresh(); }} />}
  </div>;
}

function ItemCard({ item, href, busy, onQuantity }: { item: InventoryItem; href: string; busy: boolean; onQuantity: (delta: number) => void }) {
  const low = !item.archived && item.quantity <= item.minimum;
  const expiry = expiryState(item.expiryDate);
  return <Card className="inventory-card">
    <ItemDetailLink href={href} aria-label={`ดูรายละเอียด ${item.name}`} className="inventory-card-open"/>
    <div className="inventory-card-image">
      {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async"/> : <CategoryIcon value={item.category?.emoji} name={item.category?.name} size={28}/>}
    </div>
    <div className="inventory-card-copy">
      <div className="min-w-0 truncate font-semibold" title={item.name}>{item.name}</div>
      <p className="truncate text-[11px] text-muted-foreground">{[item.brand, item.size, item.variant].filter(Boolean).join(' · ') || item.category?.name || 'สินค้าในบ้าน'}</p>
      <p className="truncate text-[10px] text-primary" title={itemAddress(item)}>{itemAddress(item)}</p>
      {(low || expiry || item.archived) && <div className="inventory-card-alerts">{item.archived && <Badge variant="secondary">ใช้หมดแล้ว</Badge>}{low && <Badge variant="secondary" className="text-warning">ใกล้หมด · ซื้อ {Math.max(1, item.minimum + 1 - item.quantity)}</Badge>}{expiry && <Badge variant={expiry === 'expired' ? 'destructive' : 'secondary'}>{expiry === 'expired' ? 'หมดอายุแล้ว' : 'ใกล้หมดอายุ'}</Badge>}</div>}
    </div>
      <div className="inventory-card-controls">

        <div className="inventory-card-quantity"><Button variant="ghost" size="icon-sm" disabled={busy || item.quantity === 0} onClick={() => onQuantity(-1)} aria-label={`ลดจำนวน ${item.name}`}><Minus size={16}/></Button><span className="inventory-card-count" title={`${item.quantity} ${item.unit}`}><strong>{item.quantity}</strong><small>{item.unit}</small></span><Button variant="secondary" size="icon-sm" disabled={busy} onClick={() => onQuantity(1)} aria-label={`เพิ่มจำนวน ${item.name}`}><Plus size={16}/></Button></div>
      </div>
  </Card>;
}
