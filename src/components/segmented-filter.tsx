import type { LucideIcon } from "lucide-react";

export type FilterOption<Value extends string> = {
  value: Value;
  label: string;
  Icon: LucideIcon;
  count: number;
  tone: "all" | "upcoming" | "past" | "domestic" | "international";
};

export function SegmentedFilter<Value extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  countLabel,
  className = "",
}: {
  value: Value;
  options: readonly FilterOption<Value>[];
  onChange: (value: Value) => void;
  ariaLabel: string;
  countLabel: string;
  className?: string;
}) {
  return (
    <nav className={`status-filter ${className}`.trim()} aria-label={ariaLabel}>
      {options.map(({ value: optionValue, label, Icon, count, tone }) => (
        <button
          type="button"
          key={optionValue}
          className={`${value === optionValue ? "active " : ""}status-${tone}`}
          aria-pressed={value === optionValue}
          onClick={() => onChange(optionValue)}
        >
          <Icon size={24} aria-hidden="true" />
          <span><strong>{label}</strong><small>{count} {countLabel}</small></span>
        </button>
      ))}
    </nav>
  );
}
