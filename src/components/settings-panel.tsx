'use client';
import { toast } from 'sonner';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Link2, Pencil, ChevronRight, Layers, RotateCw, Users, AlertTriangle, Trash2, LogOut, Home, DoorOpen, Check, X, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { PageIntro } from './page-intro';
import { ThemeSetting, LogoutSetting } from './settings-actions';
import type { Category } from '@/lib/types';

type Member = { id: string; name: string | null; email: string; image: string | null; role: string };
type Props = {
  houseId: string;
  houseName: string;
  houseNumber: string | null;
  inviteCode: string;
  initialCategories: Category[];
  members: Member[];
  role: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  houses: { id: string; name: string }[];
};

export function SettingsPanel(props: Props) {
  const { houseId, houseName, houseNumber, inviteCode, initialCategories, role, userId, userEmail, userImage, houses } = props;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState(inviteCode);
  const [members, setMembers] = useState(props.members);
  const [displayName, setDisplayName] = useState(props.userName);
  const [profileName, setProfileName] = useState(props.userName);
  const [editingName, setEditingName] = useState(false);
  const [number, setNumber] = useState(houseNumber ?? '');
  const [editingNumber, setEditingNumber] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [houseActionOpen, setHouseActionOpen] = useState(false);
  const [houseActionBusy, setHouseActionBusy] = useState(false);
  const houseActionLock = useRef(false);
  const cancelHouseAction = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [error, setError] = useState('');
  const canManage = role === 'owner' || role === 'co_owner';
  useEffect(() => setMounted(true), []);

  async function copy(value: string, type: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(type === 'link' ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกรหัสเชิญแล้ว');
    } catch { toast.error('คัดลอกไม่สำเร็จ กรุณาลองใหม่'); }
  }
  async function rotate() {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/houses/${houseId}/invite`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCode(data.inviteCode);
      toast.success('สร้างรหัสเชิญใหม่แล้ว');
    } catch (e) { const message = e instanceof Error ? e.message : 'เปลี่ยนรหัสไม่สำเร็จ'; setError(message); toast.error(message); }
    finally { setBusy(false); }
  }
  async function saveName(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profileName }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('บันทึกชื่อแล้ว');
      setDisplayName(data.name);
      setMembers(old => old.map(member => member.id === userId ? { ...member, name: data.name } : member));
      setEditingName(false);
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'บันทึกชื่อไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  async function saveNumber(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const res = await fetch(`/api/houses/${houseId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ houseNumber: number }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('บันทึกบ้านเลขที่แล้ว');
      setNumber(data.houseNumber ?? '');
      setEditingNumber(false);
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'บันทึกบ้านเลขที่ไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  async function selectHouse(id: string) {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/houses/select', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ houseId: id }) });
      if (!res.ok) throw new Error('เปลี่ยนบ้านไม่สำเร็จ');
      window.location.replace('/home');
    } catch (e) { setError(e instanceof Error ? e.message : 'เปลี่ยนบ้านไม่สำเร็จ'); setBusy(false); }
  }
  async function changeRole(member: Member, newRole: 'member' | 'co_owner') {
    if (busyMember || member.role === newRole) return;
    setBusyMember(member.id); setError('');
    try {
      const res = await fetch(`/api/houses/${houseId}/members/${member.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('เปลี่ยนสิทธิ์สมาชิกแล้ว');
      setMembers(old => old.map(row => row.id === member.id ? { ...row, role: data.role } : row));
      router.refresh();
    } catch (e) { const message = e instanceof Error ? e.message : 'เปลี่ยนสิทธิ์ไม่สำเร็จ'; setError(message); toast.error(message); }
    finally { setBusyMember(null); }
  }
  async function removeMember() {
    if (!removeTarget) return;
    setBusyMember(removeTarget.id); setError('');
    try {
      const res = await fetch(`/api/houses/${houseId}/members/${removeTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers(old => old.filter(member => member.id !== removeTarget.id));
      toast.success('นำสมาชิกออกจากบ้านแล้ว');
      setRemoveTarget(null);
      router.refresh();
    } catch (e) { const message = e instanceof Error ? e.message : 'นำสมาชิกออกไม่สำเร็จ'; setError(message); toast.error(message); }
    finally { setBusyMember(null); }
  }

  async function exitHouse() {
    if (houseActionLock.current) return;
    houseActionLock.current = true; setHouseActionBusy(true); setError('');
    try {
      const deleting = role === 'owner';
      const res = await fetch(`/api/houses/${houseId}${deleting ? '' : '/leave'}`, {
        method: deleting ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ดำเนินการไม่สำเร็จ');
      setHouseActionOpen(false);
      toast.success(deleting ? 'ลบบ้านและรูปทั้งหมดแล้ว' : 'ออกจากบ้านแล้ว');
      router.replace(data.nextHref === '/home' ? '/home' : '/welcome');
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ';
      setError(message); toast.error(message);
    } finally { houseActionLock.current = false; setHouseActionBusy(false); }
  }

  return <div className="fade-in settings-page max-w-3xl space-y-5">
    <PageIntro title="ตั้งค่า" subtitle="บัญชีและบ้าน" />

    <Card><CardHeader><CardTitle>โปรไฟล์ของฉัน</CardTitle></CardHeader><CardContent>
      <div className="flex items-center gap-3"><Avatar className="size-14">{userImage && <AvatarImage src={userImage} alt={displayName} referrerPolicy="no-referrer" />}<AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="font-bold">{displayName}</p><p className="truncate text-sm text-muted-foreground">{userEmail}</p></div>{!editingName && <Button type="button" variant="outline" size="icon" aria-label="แก้ไขชื่อ" title="แก้ไขชื่อ" onClick={() => setEditingName(true)}><Pencil size={18}/></Button>}</div>
      {editingName && <form onSubmit={saveName} className="mt-4 flex items-center gap-2"><Input aria-label="ชื่อที่แสดง" maxLength={80} required value={profileName} onChange={e => setProfileName(e.target.value)} className="min-w-0 flex-1"/><Button type="submit" size="icon" className="shrink-0 rounded-full" aria-label="บันทึก" title="บันทึก" disabled={busy}><Check size={20}/></Button><Button type="button" variant="outline" size="icon" className="shrink-0 rounded-full" aria-label="ยกเลิกแก้ไขชื่อ" title="ยกเลิก" disabled={busy} onClick={() => { setProfileName(displayName); setEditingName(false); }}><X size={20}/></Button></form>}
    </CardContent></Card>

    <Card><CardHeader><CardTitle>ข้อมูลบ้าน</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex items-center gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><Home size={24} aria-hidden="true"/></span><div className="min-w-0 flex-1"><p className="break-words text-lg font-bold">{houseName}</p><p className="break-words text-sm text-muted-foreground">บ้านเลขที่ {number || 'ยังไม่ระบุ'}</p></div>{canManage && !editingNumber && <Button type="button" variant="outline" size="icon" aria-label="แก้บ้านเลขที่" title="แก้บ้านเลขที่" onClick={() => setEditingNumber(true)}><Pencil size={18}/></Button>}{role === 'owner' && <Button type="button" variant="outline" size="icon" className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="ลบบ้าน" title="ลบบ้าน" disabled={houseActionBusy} onClick={() => { setError(''); setHouseActionOpen(true); }}><Trash2 size={20}/></Button>}</div>
      {canManage && editingNumber && <form onSubmit={saveNumber} className="flex items-center gap-2"><Input aria-label="บ้านเลขที่" maxLength={50} placeholder="เช่น 99/12" value={number} onChange={e => setNumber(e.target.value)} className="min-w-0 flex-1"/><Button type="submit" size="icon" className="shrink-0 rounded-full" aria-label="บันทึก" title="บันทึก" disabled={busy}><Check size={20}/></Button><Button type="button" variant="outline" size="icon" className="shrink-0 rounded-full" aria-label="ยกเลิกแก้ไขข้อมูลบ้าน" title="ยกเลิก" disabled={busy} onClick={() => { setNumber(houseNumber ?? ''); setEditingNumber(false); }}><X size={20}/></Button></form>}
      {houses.length > 1 && <div><Label htmlFor="house-switch">สลับบ้าน</Label><NativeSelect id="house-switch" value={houseId} disabled={busy} onChange={e => void selectHouse(e.target.value)} className="mt-2 w-full">{houses.map(house => <NativeSelectOption key={house.id} value={house.id}>{house.name}</NativeSelectOption>)}</NativeSelect></div>}
      <div className="flex flex-wrap items-center gap-3"><Button asChild variant="secondary" size="icon" className="rounded-full"><Link href="/welcome" aria-label="สร้างหรือเข้าร่วมบ้านอื่น" title="สร้างหรือเข้าร่วมบ้านอื่น"><Plus size={20}/></Link></Button></div>
    </CardContent></Card>

    <ThemeSetting />

    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Users size={19} className="text-primary"/>สมาชิก ({members.length})</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="divide-y" aria-label="รายชื่อสมาชิก">{members.map(member => {
          const editable = role === 'owner' && member.id !== userId && member.role !== 'owner';
          const removable = canManage && member.id !== userId && member.role !== 'owner' && (role === 'owner' || member.role === 'member');
          return <div key={member.id} className="member-settings-row flex items-center gap-2 py-4 first:pt-0 last:pb-0">
            <Avatar className="size-8 shrink-0">{member.image && <AvatarImage src={member.image} alt={member.name ?? member.email} referrerPolicy="no-referrer" />}<AvatarFallback className="bg-accent text-accent-foreground">{(member.name ?? member.email).slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{member.name ?? member.email}{member.id === userId ? ' (คุณ)' : ''}</div><div className="truncate text-[10px] text-muted-foreground">{member.email}</div></div>
            {!editable && !removable && <Badge variant="secondary">{member.role === 'owner' ? 'เจ้าของบ้านหลัก' : member.role === 'co_owner' ? 'เจ้าของบ้านร่วม' : 'สมาชิก'}</Badge>}
            {(editable || removable) && <NativeSelect className="member-role-select" aria-label={`สิทธิ์ของ ${member.name ?? member.email}`} value={member.role} disabled={!!busyMember} onChange={event => {
              const value = event.target.value;
              if (value === '__remove__') { event.target.value = member.role; setError(''); setRemoveTarget(member); }
              else if (editable && (value === 'member' || value === 'co_owner')) void changeRole(member, value);
            }}>
              <NativeSelectOption value="member" disabled={!editable}>สมาชิก</NativeSelectOption>
              <NativeSelectOption value="co_owner" disabled={!editable}>เจ้าของบ้านร่วม</NativeSelectOption>
              {removable && <NativeSelectOption value="__remove__">นำออกจากบ้าน…</NativeSelectOption>}
            </NativeSelect>}

          </div>;
        })}</div>
        {canManage && <section className="space-y-4 border-t pt-5" aria-labelledby="invite-heading">
          <div><h3 id="invite-heading" className="flex items-center gap-2 font-semibold"><Link2 size={19} className="text-primary"/>ชวนคนเข้าบ้าน</h3><p className="mt-2 text-sm text-muted-foreground">แชร์ลิงก์หรือรหัส</p></div>
          <div className="space-y-2"><Label htmlFor="house-invite-link">ลิงก์เชิญ</Label><div className="flex items-center gap-2"><Input id="house-invite-link" disabled className="min-w-0 flex-1 bg-muted" value={mounted ? `${location.origin}/welcome?code=${code}` : `/welcome?code=${code}`} /><Button type="button" size="icon" aria-label="คัดลอกลิงก์" title="คัดลอกลิงก์" onClick={() => void copy(`${location.origin}/welcome?code=${code}`, 'link')}><Copy size={18}/></Button></div></div>
          <div className="space-y-2"><Label htmlFor="house-invite-code">รหัสเชิญ</Label><div className="flex items-center gap-2"><Input id="house-invite-code" disabled className="min-w-0 flex-1 bg-muted" value={code} />{canManage && <Button type="button" variant="outline" size="icon" aria-label="สร้างรหัสเชิญใหม่" title="สร้างรหัสเชิญใหม่" disabled={busy} onClick={() => void rotate()}><RotateCw size={18}/></Button>}<Button type="button" size="icon" variant="outline" aria-label="คัดลอกรหัส" title="คัดลอกรหัส" onClick={() => void copy(code, 'code')}><Copy size={18}/></Button></div></div>
        </section>}
      </CardContent>
    </Card>

    <Link href="/settings/rooms" className="directory-link"><span className="grid size-11 place-items-center rounded-xl tone-blush"><DoorOpen size={21}/></span><span className="flex-1"><strong className="block">ห้องในบ้าน</strong><small className="text-muted-foreground">จัดการห้อง</small></span><ChevronRight size={20}/></Link>
    <Link href="/settings/categories" className="directory-link"><span className="grid size-11 place-items-center rounded-xl tone-lilac"><Layers size={21}/></span><span className="flex-1"><strong className="block">หมวดหมู่สินค้า</strong><small className="text-muted-foreground">{initialCategories.length} หมวดหมู่</small></span><ChevronRight size={20}/></Link>

    {role !== 'owner' && <Card className="settings-action-card"><CardContent className="settings-action-row"><button type="button" className="flex w-full items-center gap-3 text-left text-destructive" onClick={() => { setError(''); setHouseActionOpen(true); }}>
      <span className="grid size-12 shrink-0 place-items-center rounded-full border border-destructive/30"><LogOut size={20}/></span>
      <span className="flex-1"><strong className="block">ออกจากบ้าน</strong><small className="text-muted-foreground">ข้อมูลบ้านยังอยู่</small></span><ChevronRight size={18}/>
    </button></CardContent></Card>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <LogoutSetting />

    <Dialog open={houseActionOpen} onOpenChange={open => { if (!houseActionBusy) setHouseActionOpen(open); }}>
      <DialogContent className="member-confirm-dialog" role="alertdialog" showCloseButton={false}
        onOpenAutoFocus={event => { event.preventDefault(); cancelHouseAction.current?.focus(); }}
        onEscapeKeyDown={event => { if (houseActionBusy) event.preventDefault(); }} onPointerDownOutside={event => { if (houseActionBusy) event.preventDefault(); }}>
        <span className="member-confirm-icon"><AlertTriangle size={24}/></span>
        <DialogHeader className="items-center text-center"><DialogTitle>{role === 'owner' ? 'ลบบ้านนี้ถาวร?' : 'ออกจากบ้านนี้?'}</DialogTitle>
          <DialogDescription className="text-center break-words">{role === 'owner'
            ? `ลบ “${houseName}” พร้อมข้อมูลและรูปทั้งหมด ทุกคนจะเข้าบ้านไม่ได้ กู้คืนไม่ได้`
            : `ออกจาก “${houseName}” ข้อมูลยังอยู่ กลับเข้าด้วยรหัสเชิญ`}</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="grid grid-cols-2 gap-2"><Button ref={cancelHouseAction} type="button" variant="outline" disabled={houseActionBusy} onClick={() => setHouseActionOpen(false)}>ยกเลิก</Button><Button type="button" variant="destructive" disabled={houseActionBusy} onClick={() => void exitHouse()}>{houseActionBusy ? 'กำลังดำเนินการ…' : role === 'owner' ? 'ลบบ้าน' : 'ออกจากบ้าน'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!removeTarget} onOpenChange={open => { if (!open && !busyMember) setRemoveTarget(null); }}>
      <DialogContent className="member-confirm-dialog" role="alertdialog" showCloseButton={false} onEscapeKeyDown={event => { if (busyMember) event.preventDefault(); }} onPointerDownOutside={event => { if (busyMember) event.preventDefault(); }}>
        <span className="member-confirm-icon"><AlertTriangle size={24}/></span>
        <DialogHeader className="items-center text-center"><DialogTitle>นำสมาชิกออก?</DialogTitle><DialogDescription className="text-center break-words">{removeTarget?.name ?? removeTarget?.email} จะเข้าบ้านไม่ได้ ต้องใช้รหัสเชิญใหม่</DialogDescription></DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={!!busyMember} onClick={() => setRemoveTarget(null)}>ยกเลิก</Button><Button type="button" variant="destructive" disabled={!!busyMember} onClick={() => void removeMember()}>{busyMember ? 'กำลังนำออก…' : 'นำออกจากบ้าน'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

  </div>;
}
