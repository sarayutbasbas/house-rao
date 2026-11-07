'use client';

import { CalendarDays } from 'lucide-react';

// Adapted from bn-trip's NativeDateTimeInput: a bounded display with a native
// picker overlay, so iOS date segments cannot stretch the surrounding card.
export function DatePicker({ id, value, onChange, disabled = false, label = 'เลือกวันหมดอายุ' }: {
  id: string; value: string; onChange: (value: string) => void; disabled?: boolean; label?: string;
}) {
  const display = value ? new Date(`${value}T00:00:00`).toLocaleDateString('th-TH-u-ca-gregory', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : 'เลือกวันที่';
  return <div className="native-picker-control" data-disabled={disabled}>
    <span className="native-picker-value" aria-hidden="true">{display}</span>
    <CalendarDays size={18} aria-hidden="true" />
    <input id={id} type="date" lang="th-TH-u-ca-gregory" aria-label={label} value={value} disabled={disabled} onChange={event => onChange(event.target.value)} />
  </div>;
}
