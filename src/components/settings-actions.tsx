'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

// Row layout and icon controls follow bn-trip's settings screen.
export function ThemeSetting() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  return <Card className="settings-action-card"><CardContent className="settings-action-row">
    <div className="settings-action-label"><span className={`settings-feature-icon ${dark ? 'is-dark' : 'is-light'}`}>{dark ? <Moon/> : <Sun/>}</span><div><strong>ธีม</strong><small>สว่าง / มืด</small></div></div>
    <div className="settings-theme-switch" role="group" aria-label="เปลี่ยนธีม">{([{ value: 'light', label: 'โหมดสว่าง', Icon: Sun }, { value: 'dark', label: 'โหมดมืด', Icon: Moon }] as const).map(({ value, label, Icon }) => <Button key={value} type="button" variant="ghost" size="icon" className={value === 'light' ? 'is-light' : 'is-dark'} aria-label={label} title={label} aria-pressed={mounted && resolvedTheme === value} onClick={() => { if (resolvedTheme !== value) { setTheme(value); toast.success('บันทึกธีมแล้ว'); } }}><Icon className="size-[26px]"/></Button>)}</div>
  </CardContent></Card>;
}

export function LogoutSetting() {
  const [busy, setBusy] = useState(false);
  async function logout() {
    if (busy) return;
    setBusy(true);
    try { await signOut({ callbackUrl: '/login' }); }
    catch { setBusy(false); toast.error('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่'); }
  }
  return <Card className="settings-action-card"><CardContent className="settings-action-row">
    <div className="settings-action-label"><span className="settings-feature-icon settings-logout-icon"><LogOut/></span><div><strong>ออกจากระบบ</strong><small>บัญชีนี้</small></div></div>
    <Button type="button" variant="outline" className="settings-logout-button" disabled={busy} onClick={() => void logout()}>{busy ? 'กำลังออก…' : 'ออกจากระบบ'}</Button>
  </CardContent></Card>;
}
