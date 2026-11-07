import { auth, signIn } from '@/auth';
import { redirect } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default async function Login() {
  if (await auth()) redirect('/');
  return <main className="auth-screen flex min-h-dvh items-center justify-center p-5">
    <Card className="fade-in onboarding-card w-full max-w-md"><CardContent className="p-4 sm:p-6">
      <BrandLogo className="mb-8 size-20" priority />
      <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">Welcome to HouseRao</p>
      <h1 className="text-[38px] font-bold leading-tight tracking-tight">ของในบ้าน<br/>รู้พร้อมกัน</h1>
      <p className="mt-4 leading-7 text-muted-foreground">จัดการของในบ้านร่วมกัน</p>
      <div className="mt-7 space-y-3 text-sm"><div className="flex items-center gap-3"><Check size={17} className="text-primary"/>แชร์รายการกับคนในบ้าน</div><div className="flex items-center gap-3"><Check size={17} className="text-primary"/>เตือนของใกล้หมดและหมดอายุ</div></div>
      <form action={async () => { 'use server'; await signIn('google', { redirectTo: '/' }); }} className="mt-10"><Button type="submit" className="h-12 w-full gap-3">เข้าสู่ระบบด้วย Google <ArrowRight size={18}/></Button></form>
      <p className="mt-5 text-center text-xs text-muted-foreground">เริ่มใช้ได้เลย</p>
    </CardContent></Card>
  </main>;
}
