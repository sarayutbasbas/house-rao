import './globals.css';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Thai } from 'next/font/google';
import { cn } from "@/lib/utils";
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';

const ibmPlex = IBM_Plex_Sans_Thai({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HouseRao — ของในบ้าน รู้พร้อมกัน', description: 'จัดการสต็อกของใช้และอาหารในบ้านร่วมกัน',
  applicationName: 'HouseRao', other: { 'apple-mobile-web-app-capable': 'yes' }, appleWebApp: { capable: true, title: 'HouseRao', statusBarStyle: 'black-translucent' },
  icons: { apple: '/icons/apple-touch-icon-plum.png' }, formatDetection: { telephone: false },
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#ffffff' }, { media: '(prefers-color-scheme: dark)', color: '#000000' }],
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="th" suppressHydrationWarning className={cn('font-sans', ibmPlex.variable)}><body><ThemeProvider>{children}<Toaster /></ThemeProvider></body></html>; }
