'use client';
import { useEffect, useState } from 'react';

export function notifyShoppingChanged() { window.dispatchEvent(new Event('house-rao:shopping-changed')); }

export function useShoppingCount(houseId: string, pathname: string) {
  const [result, setResult] = useState({ houseId, count: 0 });
  useEffect(() => {
    let controller: AbortController | undefined;
    async function refresh() {
      if (document.visibilityState === 'hidden') return;
      controller?.abort();
      const current = new AbortController(); controller = current;
      try {
        const response = await fetch(`/api/houses/${houseId}/shopping?count=true`, { signal: current.signal, cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!current.signal.aborted && Number.isInteger(data.count) && data.count >= 0) setResult({ houseId, count: data.count });
      } catch { /* Keep the last known count on temporary network failures. */ }
    }
    void refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener('house-rao:shopping-changed', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller?.abort(); clearInterval(timer); window.removeEventListener('house-rao:shopping-changed', refresh); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [houseId, pathname]);
  return result.houseId === houseId ? result.count : 0;
}
