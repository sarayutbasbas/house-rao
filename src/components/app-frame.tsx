'use client';

import { useShoppingCount } from '@/lib/use-shopping-count';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Settings, LogOut, Package, ShoppingBasket } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { BrandLogo } from '@/components/brand-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AppBottomNavigation } from './app-bottom-navigation';
import { primaryPath, primaryRoutes } from '@/lib/navigation';
import { ItemSheetProvider } from './item-sheet-provider';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: typeof Home };

export function AppFrame({ houseId, houseName, userName, userImage, children }: { houseId: string; houseName: string; userName: string; userImage: string | null; children: React.ReactNode }) {
  const pathname = primaryPath(usePathname(), houseId);
  const shoppingCount = useShoppingCount(houseId, pathname);
  const categoryDetail = pathname === '/settings/categories' || pathname === '/settings/rooms' || pathname.startsWith('/rooms/');
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const nav: NavItem[] = [
    { href: '/home', label: 'หน้าแรก', icon: Home },
    { href: '/shopping', label: 'ต้องซื้อ', icon: ShoppingBasket },
    { href: '/inventory', label: 'สินค้า', icon: Package },
    { href: '/history', label: 'รายการย้อนหลัง', icon: History },
    { href: '/settings', label: 'ตั้งค่า', icon: Settings },
  ];
  useEffect(() => { setPendingPath(null); }, [pathname]);
  useEffect(() => {
    if (pathname !== '/home') return;
    try {
      const raw = sessionStorage.getItem('house-rao-setup-result');
      if (!raw) return;
      sessionStorage.removeItem('house-rao-setup-result');
      const result = JSON.parse(raw);
      if (result.houseId === houseId && typeof result.at === 'number' && Date.now() - result.at < 60_000 && ['create', 'join'].includes(result.mode))
        toast.success(result.mode === 'create' ? 'สร้างบ้านแล้ว' : 'เข้าร่วมบ้านแล้ว');
    } catch { /* Storage may be unavailable in private browser contexts. */ }
  }, [pathname, houseId]);
  const activePath = pendingPath ?? (pathname.includes('/items/') ? '/inventory' : pathname);

  return <ItemSheetProvider key={houseId}><div className="app-shell lg:flex" data-bottom-nav={primaryRoutes.includes(pathname)} data-detail={categoryDetail}>
    <aside className="sticky top-0 hidden h-screen min-h-screen w-[244px] shrink-0 flex-col border-r bg-card px-5 py-8 lg:flex">
      <Link replace href="/home" prefetch className="flex items-center gap-2 px-2" onClick={() => setPendingPath('/home')}>
        <BrandLogo className="size-12" priority />
        <span className="flex flex-col"><span className="text-xl font-extrabold leading-none tracking-tight">HouseRao</span><span className="mt-1 text-[9px] font-bold uppercase tracking-[.13em] text-primary">Home together</span></span>
      </Link>
      <p className="mb-3 mt-11 px-4 text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">พื้นที่ของคุณ</p>
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-accent px-4 py-4"><span className="text-2xl">🏡</span><div className="min-w-0"><div className="text-[11px] text-muted-foreground">บ้านปัจจุบัน</div><div className="truncate text-sm font-bold">{houseName}</div></div></div>
      <nav aria-label="เมนูหลัก" className="space-y-1">{nav.map(({ href, label, icon: Icon }) => <Link replace key={href} href={href} prefetch onClick={() => setPendingPath(href)} className={cn('flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-muted-foreground transition-colors', activePath === href && 'bg-accent text-accent-foreground')}><Icon size={19}/>{label}{href === "/shopping" && shoppingCount > 0 && <span className="nav-shopping-badge" aria-label={`ต้องซื้อ ${shoppingCount} รายการ`}>{shoppingCount > 99 ? "99+" : shoppingCount}</span>}</Link>)}</nav>
      <div className="mt-auto border-t pt-5"><div className="mb-3 flex items-center gap-2 px-3"><Avatar className="size-10 ring-2 ring-background shadow-md">{userImage && <AvatarImage src={userImage} alt={userName} referrerPolicy="no-referrer" />}<AvatarFallback>{userName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><p className="min-w-0 truncate text-xs text-muted-foreground">{userName}</p></div><Button variant="ghost" className="w-full justify-start" onClick={() => signOut({ callbackUrl: '/login' })}><LogOut size={18}/>ออกจากระบบ</Button></div>
    </aside>

    <div className="min-w-0 flex-1">
      <div className="app-topbar flex items-center justify-between px-5 lg:hidden">
        <Link replace href="/home" prefetch onClick={() => setPendingPath('/home')} className="flex items-center gap-0"><BrandLogo className="size-[46px]" priority /><span className="flex flex-col"><span className="text-base font-bold leading-none tracking-tight">HouseRao</span><span className="mt-1 text-[8px] font-bold uppercase tracking-[.13em] text-primary">Home together</span></span></Link>
        <Link replace href="/settings" prefetch onClick={() => setPendingPath('/settings')} aria-label="ตั้งค่า"><Avatar className="size-10 ring-2 ring-background shadow-md">{userImage && <AvatarImage src={userImage} alt={userName} referrerPolicy="no-referrer" />}<AvatarFallback className="bg-accent text-accent-foreground">{userName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar></Link>
      </div>
      <main data-room-page={pathname.startsWith('/rooms/')} className="app-main px-5 pt-5 sm:px-7 sm:pt-7 lg:px-10">{children}</main>
    </div>

    <AppBottomNavigation houseId={houseId} shoppingCount={shoppingCount} />
  </div></ItemSheetProvider>;
}
