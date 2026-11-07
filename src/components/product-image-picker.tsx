'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { ProductImageCropper } from './product-image-cropper';

export function ProductImagePicker({ preview, pending, busy, onSelect, onRemove, subject = 'สินค้า', portrait = true }: {
  portrait?: boolean; subject?: string; preview: string; pending: boolean; busy: boolean; onSelect: (file: File) => void; onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [source, setSource] = useState<File | null>(null);
  const [error, setError] = useState('');
  function select(file?: File) {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('รองรับ JPG, PNG และ WebP เท่านั้น'); return; }
    if (file.size > 8_000_000) { setError('รูปต้นฉบับต้องไม่เกิน 8 MB'); return; }
    setSource(file);
  }
  return <section className="space-y-3" aria-label={`รูป${subject}`}>
    <div className={`product-cover-upload ${preview ? 'selected' : ''} ${portrait ? 'portrait' : ''}`}>
      <button type="button" className="product-upload-preview" disabled={busy} onClick={() => preview ? setPreviewOpen(true) : input.current?.click()} aria-label={preview ? 'เปิดรูปเต็มจอ' : `เพิ่มรูป${subject}`}>
        {preview ? <img src={preview} alt={`รูป${subject}ที่เลือก`}/> : <ImagePlus size={24}/>}
      </button>
      <button type="button" className="product-upload-content" disabled={busy} onClick={() => input.current?.click()} aria-label={preview ? 'เลือกรูปใหม่' : 'เลือกไฟล์รูป'}>
        <strong>{preview ? <><CheckCircle2 size={15}/>เลือกรูปแล้ว</> : `เพิ่มรูป${subject}`}</strong>
        <small>{preview ? 'แตะเพื่อเปลี่ยนรูป' : `ครอบรูป${portrait ? 'แนวตั้ง 3:4' : 'แนวนอน 16:9'}`}</small>
      </button>
    {preview && <Button type="button" size="icon" variant="outline" className="product-upload-remove" aria-label={`ลบรูป${subject}`} disabled={busy} onClick={() => { setError(''); onRemove(); }}><Trash2 size={18}/></Button>}
    </div>

    <p className="text-xs text-muted-foreground">{pending ? 'พร้อมอัปโหลดเมื่อกดบันทึก · ' : ''}JPG, PNG, WebP ไม่เกิน 8 MB · บันทึกเป็น WebP {portrait ? '3:4' : '16:9'} ไม่เกิน 1 MB</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { select(event.target.files?.[0]); event.target.value = ''; }}/>
    {previewOpen && <Dialog open onOpenChange={setPreviewOpen}><DialogContent className="product-image-fullscreen product-image-viewer" showCloseButton={false} aria-describedby={undefined}>
      <header><Button type="button" variant="ghost" size="icon" aria-label="ปิดรูป" onClick={() => setPreviewOpen(false)}><X size={20}/></Button><DialogTitle>รูป{subject}</DialogTitle><span/></header>
      <main><img src={preview} alt={`รูป${subject}เต็มจอ`}/></main>
    </DialogContent></Dialog>}
    {source && <ProductImageCropper portrait={portrait} subject={subject} file={source} onClose={() => setSource(null)} onApply={file => { onSelect(file); setSource(null); }}/>}
  </section>;
}
