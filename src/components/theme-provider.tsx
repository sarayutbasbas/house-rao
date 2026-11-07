'use client';
import { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';

function ThemeChrome() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!resolvedTheme) return;
    const syncChrome = () => {
      const overlays = document.querySelectorAll('[data-slot="dialog-overlay"]').length;
      // Match the stacked black/10 backdrops, including nested image crop sheets.
      const channel = resolvedTheme === 'dark' ? 0 : Math.round(255 * .9 ** overlays);
      const color = document.querySelector('.product-image-fullscreen') ? '#080808' : `#${channel.toString(16).padStart(2, '0').repeat(3)}`;
      document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
        if (meta.getAttribute('content') !== color) meta.setAttribute('content', color);
      });
    };
    syncChrome();
    const observer = new MutationObserver(syncChrome);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] });
    return () => observer.disconnect();
  }, [resolvedTheme]);
  return null;
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange><ThemeChrome />{children}</NextThemesProvider>;
}
