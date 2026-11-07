'use client';

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

const editorSelector = 'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]),textarea,select,[contenteditable="true"]';

// Adapted from bn-trip BottomSheet: fixed head/footer and independently scrolling body.
// Keep Radix focus trapping, Escape handling and accessible dialog names from shadcn.
export function BottomSheet({ title, subtitle, onClose, children, onSubmit, submitLabel, busy = false, submitDisabled = false, footer }: {
  title: ReactNode; subtitle: ReactNode; onClose: () => void; children: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitLabel?: string; busy?: boolean; submitDisabled?: boolean; footer?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const locked = useRef(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const blocked = busy || saving;
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    let frame = 0;
    let lastEditor: Element | null = null;
    const sync = () => {
      if (!panel.current) return;
      panel.current.style.setProperty('--sheet-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
      panel.current.style.setProperty('--sheet-viewport-top', `${viewport?.offsetTop ?? 0}px`);
      const active = document.activeElement;
      const focused = active instanceof HTMLElement && active.matches(editorSelector) && panel.current.contains(active);
      setEditing(focused);
      if (focused && active !== lastEditor) active.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      lastEditor = focused ? active : null;
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(sync); };
    sync();
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    window.addEventListener('resize', schedule);
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('focusin', schedule); document.removeEventListener('focusout', schedule);
      window.removeEventListener('resize', schedule);
      viewport?.removeEventListener('resize', schedule); viewport?.removeEventListener('scroll', schedule);
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || busy || submitDisabled || !onSubmit) return;
    locked.current = true; setSaving(true);
    try { await onSubmit(event); } finally { locked.current = false; setSaving(false); }
  }
  function close() {
    if (blocked || closeTimer.current) return;
    setOpen(false);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    closeTimer.current = setTimeout(onClose, duration);
  }
  const Container = onSubmit ? 'form' : 'div';
  return <Dialog open={open} onOpenChange={value => { if (!value) close(); }}>
    <DialogContent ref={panel} className="rao-bottom-sheet" showCloseButton={false} data-editing={editing}
      onOpenAutoFocus={event => { event.preventDefault(); heading.current?.focus({ preventScroll: true }); }}
      onEscapeKeyDown={event => { if (blocked) event.preventDefault(); }}
      onPointerDownOutside={event => { if (blocked) event.preventDefault(); }}>
      <Container onSubmit={onSubmit ? event => void submit(event as FormEvent<HTMLFormElement>) : undefined} className="bottom-sheet-form" aria-busy={blocked}>
        <header className="bottom-sheet-head"><div className="min-w-0 flex-1"><DialogTitle ref={heading} tabIndex={-1}>{title}</DialogTitle><DialogDescription className="mt-2">{subtitle}</DialogDescription></div><div className="flex shrink-0 items-center gap-1">{editing && <Button type="button" variant="ghost" size="sm" onClick={() => heading.current?.focus({ preventScroll: true })}>เสร็จ</Button>}<Button type="button" variant="outline" size="icon" className="rounded-full bg-muted" aria-label="ปิด" disabled={blocked} onClick={close}><X size={20}/></Button></div></header>
        <div className="bottom-sheet-body space-y-4" onPointerDown={event => { if (event.target === event.currentTarget) heading.current?.focus({ preventScroll: true }); }}>{children}</div>
        {(submitLabel || footer) && <footer className="bottom-sheet-actions" hidden={editing}>{footer ?? <Button type="submit" className="w-full" disabled={blocked || submitDisabled}>{blocked ? 'กำลังบันทึก…' : submitLabel}</Button>}</footer>}
      </Container>
    </DialogContent>
  </Dialog>;
}
