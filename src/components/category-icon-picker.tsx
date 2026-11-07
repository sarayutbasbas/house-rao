'use client';

import { Button } from './ui/button';
import { CategoryIcon } from './category-icon';
import { CATEGORY_ICON_KEYS, CATEGORY_ICON_LABELS, type CategoryIconKey } from '@/lib/category-icons';

// Adapted from bn-trip's ChecklistCategoryIconPicker with keyboard radio navigation.
export function CategoryIconPicker({ value, onChange, disabled = false }: { value: CategoryIconKey; onChange: (value: CategoryIconKey) => void; disabled?: boolean }) {
  return <div role="radiogroup" aria-label="เลือกไอคอนหมวดหมู่" className="grid grid-cols-3 gap-2 min-[360px]:grid-cols-4" onKeyDown={event => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (disabled || !(event.key in moves || event.key === 'Home' || event.key === 'End')) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? CATEGORY_ICON_KEYS.length - 1 : (CATEGORY_ICON_KEYS.indexOf(value) + moves[event.key] + CATEGORY_ICON_KEYS.length) % CATEGORY_ICON_KEYS.length;
    onChange(CATEGORY_ICON_KEYS[index]);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')[index]?.focus();
  }}>{CATEGORY_ICON_KEYS.map(key => <Button type="button" role="radio" key={key} aria-checked={value === key} aria-label={CATEGORY_ICON_LABELS[key]} title={CATEGORY_ICON_LABELS[key]} tabIndex={value === key ? 0 : -1} disabled={disabled} variant="outline" className={`h-auto min-h-20 min-w-0 flex-col gap-2 whitespace-normal px-1 py-3 text-center ${value === key ? 'tone-lilac border-primary ring-2 ring-primary' : ''}`} onClick={() => onChange(key)}><CategoryIcon value={key}/><span className="text-[10px] leading-4">{CATEGORY_ICON_LABELS[key]}</span></Button>)}</div>;
}
