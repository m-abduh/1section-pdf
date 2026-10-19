import type { ReactNode } from "react";

const tones = {
  default: {
    icon: "bg-surface-muted text-fg",
    value: "text-fg",
  },
  accent: {
    icon: "bg-fg text-surface",
    value: "text-fg",
  },
  success: {
    icon: "bg-fg text-surface",
    value: "text-fg",
  },
  warning: {
    icon: "bg-surface-muted text-fg",
    value: "text-fg",
  },
  danger: {
    icon: "bg-surface-muted text-fg",
    value: "text-fg",
  },
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: keyof typeof tones;
  trend?: { value: string; positive?: boolean };
}) {
  const t = tones[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
            {label}
          </p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${t.value}`}>
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-fg-muted">{hint}</p>
          ) : null}
          {trend ? (
            <p
              className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                trend.positive ? "text-fg" : "text-fg-muted"
              }`}
            >
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${t.icon}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}
