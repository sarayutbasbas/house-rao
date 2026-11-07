'use client';
import { toast } from 'sonner';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, HousePlus, LogIn, LoaderCircle, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function HouseSetup({ canClose = false }: { canClose?: boolean }) {
  const submitting = useRef(false);
  const loadingTitle = useRef<HTMLHeadingElement>(null);
  const params = useSearchParams();
  const [mode, setMode] = useState<'create' | 'join'>(params.get('code') ? 'join' : 'create');
  const [name, setName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [code, setCode] = useState(params.get('code') ?? '');
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(mode === 'create' ? '/api/houses' : '/api/houses/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mode === 'create' ? { name, houseNumber } : { code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRedirecting(true);
      try { sessionStorage.setItem('house-rao-setup-result', JSON.stringify({ mode, houseId: data.id, at: Date.now() })); } catch { /* Navigation works with storage disabled too. */ }
      // A new document reads the active-house cookie and cannot reuse a pre-join redirect/layout.
      window.location.replace('/home');
    } catch (e) { const message = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'; setError(message); toast.error(message); submitting.current = false; setBusy(false); setRedirecting(false); }
  }

  return <Card className="fade-in onboarding-card w-full max-w-lg"><CardContent className="p-4 sm:p-6">
    <div className="flex items-start justify-between gap-3"><BrandLogo className="size-20" priority />{canClose && <Button asChild variant="outline" size="icon" className="rounded-full" disabled={busy}><Link href="/settings" replace aria-label="ปิดและกลับไปบ้านเดิม" onClick={event => { if (busy) event.preventDefault(); }}><X size={20}/></Link></Button>}</div>
    <h1 className="mt-7 text-3xl font-bold">เริ่มต้นใช้งาน</h1>
    <p className="mt-2 text-muted-foreground">สร้างบ้านหรือใช้รหัสเชิญ</p>
    <Tabs value={mode} onValueChange={value => setMode(value as 'create' | 'join')} className="mt-7"><TabsList className="house-mode-tabs w-full"><TabsTrigger disabled={busy} value="create" className="flex-1"><HousePlus size={18} aria-hidden="true"/>สร้างบ้านใหม่</TabsTrigger><TabsTrigger disabled={busy} value="join" className="flex-1"><LogIn size={18} aria-hidden="true"/>เข้าร่วมบ้าน</TabsTrigger></TabsList></Tabs>
    <form onSubmit={submit} className="mt-7 space-y-2"><Label htmlFor="house-value">{mode === 'create' ? 'ชื่อบ้าน' : 'รหัสเชิญ'}</Label><Input disabled={busy} id="house-value" required placeholder={mode === 'create' ? 'เช่น บ้านของเรา' : 'วางรหัสเชิญที่นี่'} value={mode === 'create' ? name : code} onChange={e => mode === 'create' ? setName(e.target.value) : setCode(e.target.value)} />{mode === 'create' && <><Label htmlFor="house-number" className="pt-3">บ้านเลขที่ <span className="font-normal text-muted-foreground">(ถ้ามี)</span></Label><Input disabled={busy} id="house-number" maxLength={50} placeholder="เช่น 99/12" value={houseNumber} onChange={e => setHouseNumber(e.target.value)} /></>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy} className="mt-4 h-11 w-full">{busy ? 'กำลังบันทึก...' : mode === 'create' ? 'สร้างบ้าน' : 'เข้าร่วมบ้าน'}<ArrowRight size={17}/></Button></form>
    <Dialog open={busy}>
      <DialogContent className="member-confirm-dialog" showCloseButton={false}
        onOpenAutoFocus={event => { event.preventDefault(); loadingTitle.current?.focus(); }}
        onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()}>
        <LoaderCircle size={32} className="mx-auto animate-spin text-primary" aria-hidden="true"/>
        <div role="status" aria-live="polite" className="space-y-2 text-center">
          <DialogTitle ref={loadingTitle} tabIndex={-1} className="outline-none">{redirecting ? 'กำลังเปิดบ้าน…' : mode === 'create' ? 'กำลังสร้างบ้าน' : 'กำลังเข้าร่วมบ้าน'}</DialogTitle>
          <DialogDescription>รอสักครู่</DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  </CardContent></Card>;
}
