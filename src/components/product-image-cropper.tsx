'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';
import { canvasToUploadFile, loadImageFile } from '@/lib/compress-image';

type Point = { x: number; y: number };
// Shared drag/pinch cropper: portrait products and landscape room covers.
export function ProductImageCropper({ file, onClose, onApply, subject = 'สินค้า', portrait = true }: { portrait?: boolean; subject?: string; file: File; onClose: () => void; onApply: (file: File) => void }) {
  const cropWidth = portrait ? 1200 : 1600;
  const cropHeight = portrait ? 1600 : 900;
  const ratioLabel = portrait ? '3:4' : '16:9';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<{ point: Point; offset: Point } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true, release: (() => void) | undefined;
    void loadImageFile(file).then(result => {
      if (!active) { result.release(); return; }
      release = result.release; setImage(result.image);
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'อ่านรูปไม่สำเร็จ'); });
    return () => { active = false; release?.(); };
  }, [file]);
  function clamp(point: Point, nextZoom = zoom) {
    if (!image) return { x: 0, y: 0 };
    const scale = Math.max(cropWidth / image.naturalWidth, cropHeight / image.naturalHeight) * nextZoom;
    const x = Math.max(0, (image.naturalWidth * scale - cropWidth) / 2);
    const y = Math.max(0, (image.naturalHeight * scale - cropHeight) / 2);
    return { x: Math.max(-x, Math.min(x, point.x)), y: Math.max(-y, Math.min(y, point.y)) };
  }
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext('2d');
    if (!context) { setError('ไม่สามารถประมวลผลรูปภาพได้'); return; }
    const scale = Math.max(cropWidth / image.naturalWidth, cropHeight / image.naturalHeight) * zoom;
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    context.clearRect(0, 0, cropWidth, cropHeight);
    context.drawImage(image, (cropWidth - width) / 2 + offset.x, (cropHeight - height) / 2 + offset.y, width, height);
  }, [image, zoom, offset, cropWidth, cropHeight]);
  function distance() { const points = [...pointers.current.values()]; return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y); }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (busy || !image) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 1) { drag.current = { point: { x: event.clientX, y: event.clientY }, offset }; pinch.current = null; }
    else { drag.current = null; pinch.current = { distance: distance(), zoom }; }
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (busy || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2 && pinch.current?.distance) {
      const nextZoom = Math.max(1, Math.min(3, pinch.current.zoom * distance() / pinch.current.distance));
      setZoom(nextZoom); setOffset(point => clamp(point, nextZoom));
    } else if (drag.current) {
      const ratio = cropWidth / event.currentTarget.getBoundingClientRect().width;
      setOffset(clamp({ x: drag.current.offset.x + (event.clientX - drag.current.point.x) * ratio, y: drag.current.offset.y + (event.clientY - drag.current.point.y) * ratio }));
    }
  }
  function end(event: PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pinch.current = null;
    const remaining = [...pointers.current.values()][0];
    drag.current = remaining ? { point: remaining, offset } : null;
  }
  async function apply() {
    if (!canvasRef.current || !image || busy) return;
    setBusy(true); setError('');
    try { onApply(await canvasToUploadFile(canvasRef.current, file.name, .86)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'ครอบรูปไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="product-image-fullscreen" showCloseButton={false} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onPointerDownOutside={event => event.preventDefault()} onOpenAutoFocus={event => { event.preventDefault(); document.getElementById('product-crop-title')?.focus(); }}>
    <header><Button type="button" variant="ghost" size="icon" aria-label="ยกเลิก" disabled={busy} onClick={onClose}><X size={20}/></Button><div><DialogTitle id="product-crop-title" tabIndex={-1}>ครอบรูป{subject}</DialogTitle><DialogDescription>ลากด้วยหนึ่งนิ้ว · จีบเข้า–ออกด้วยสองนิ้ว</DialogDescription></div><span/></header>
    <main><div className={`product-crop-frame ${portrait ? 'portrait' : ''}`}><canvas ref={canvasRef} width={cropWidth} height={cropHeight} aria-label={`ภาพตัวอย่างครอบรูป ${ratioLabel}`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/><span className="product-crop-hint">ลากเพื่อขยับ · จีบเพื่อซูม</span><span>{ratioLabel}</span></div></main>
    <footer>
      {!image && !error && <p role="status">กำลังอ่านรูป…</p>}
      <label className="sr-only">ซูมรูป<input type="range" min={1} max={3} step={.01} value={zoom} disabled={!image || busy} onChange={event => { const value = Number(event.target.value); setZoom(value); setOffset(point => clamp(point, value)); }}/></label>
      {error && <p role="alert">{error}</p>}
      <Button type="button" className="product-crop-apply" disabled={!image || busy} onClick={() => void apply()}><CheckCircle2 size={18}/>{busy ? 'กำลังเตรียมรูป…' : 'ยืนยันและกลับไปบันทึก'}</Button>
    </footer>
  </DialogContent></Dialog>;
}
