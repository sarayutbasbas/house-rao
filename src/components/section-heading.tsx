import type { ReactNode } from "react";

export function SectionHeading({
  title,
  subtitle,
  actions,
  className = "",
}: {
  title: ReactNode;
  subtitle: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`section-heading ${className}`.trim()}>
      <div className="section-heading-copy">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {actions ? (
        <div className="section-heading-actions">{actions}</div>
      ) : null}
    </header>
  );
}
