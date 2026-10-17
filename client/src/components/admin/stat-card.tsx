import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-fg">{value}</p>
      {hint ? <p className="mt-1 text-xs text-fg-muted">{hint}</p> : null}
    </div>
  );
}
