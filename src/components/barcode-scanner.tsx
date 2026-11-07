'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { productCode, type BarcodeProduct } from '@/lib/barcode';

export function BarcodeScanner({ houseId, onClose, onApply }: {
  houseId: string; onClose: () => void; onApply: (product: BarcodeProduct) => void;
}) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('กำลังเปิดกล้อง…');
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);
  const apply = useRef(onApply);
  useEffect(() => { apply.current = onApply; }, [onApply]);

  useEffect(() => {
    if (!video) return;
    let active = true;
    let found = false;
    let controls: { stop: () => void } | undefined;
    const request = new AbortController();
    function stop() {
      controls?.stop();
      const stream = video!.srcObject;
      if (stream instanceof MediaStream) stream.getTracks().forEach(track => track.stop());
    }
    async function lookup(code: string) {
      setStatus('กำลังค้นหาข้อมูลสินค้า…');
      try {
        const response = await fetch(`/api/barcode?houseId=${houseId}&code=${code}`, { signal: request.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'ค้นหาข้อมูลไม่สำเร็จ');
        if (active) apply.current(data);
      } catch {
        // Keep a successfully scanned code even when the lookup service is unavailable.
        if (active && !request.signal.aborted) apply.current({ code, source: 'none' });
      }
    }
    async function start() {
      setError(''); setFailed(false); setStatus('กำลังเปิดกล้อง…');
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        if (!active) return;
        controls = await new BrowserMultiFormatReader().decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false }, video!,
          (result, _error, scanner) => {
            if (!active || found || !result) return;
            const code = productCode(result.getText());
            if (!code) { setError('QR นี้ไม่มีรหัสสินค้า ลองส่องบาร์โค้ดบนบรรจุภัณฑ์'); return; }
            found = true; scanner.stop(); stop(); void lookup(code);
          },
        );
        if (!active || found) stop();
        else setStatus('ส่องบาร์โค้ดในกรอบ');
      } catch {
        stop();
        if (active) { setFailed(true); setStatus('เปิดกล้องไม่ได้'); setError('อนุญาตกล้องแล้วลองใหม่ หรือกรอกเอง'); }
      }
    }
    void start();
    return () => { active = false; request.abort(); stop(); };
  }, [video, houseId, attempt]);

  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="product-image-fullscreen barcode-camera-screen" showCloseButton={false} onOpenAutoFocus={event => event.preventDefault()}>
      <header className="flex items-center justify-between gap-3 p-5 pt-[max(20px,env(safe-area-inset-top))]">
        <div><DialogTitle>สแกนสินค้า</DialogTitle><DialogDescription className="mt-2 text-white/70">เติมข้อมูลอัตโนมัติ</DialogDescription></div>
        <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full text-white" aria-label="ปิดกล้อง" onClick={onClose}><X/></Button>
      </header>
      <div className="relative min-h-0 overflow-hidden bg-black">
        <video ref={setVideo} muted playsInline autoPlay className="size-full object-cover"/>
        {!failed && <div aria-hidden="true" className="pointer-events-none absolute inset-x-[10%] top-1/2 h-40 -translate-y-1/2 rounded-3xl border-2 border-white/80"/>}
      </div>
      <footer className="space-y-3 p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-center">
        <p role="status" aria-live="polite">{status}</p>
        {error && <p role="alert" className="text-sm text-white/80">{error}</p>}
        {failed && <div className="flex justify-center gap-2"><Button type="button" onClick={() => setAttempt(value => value + 1)}><Camera size={18}/>ลองอีกครั้ง</Button><Button type="button" variant="secondary" onClick={onClose}>กลับไปกรอกเอง</Button></div>}
      </footer>
    </DialogContent>
  </Dialog>;
}
