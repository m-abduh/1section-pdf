import type { OrderStatus } from "@/lib/types";

const statusClasses: Record<OrderStatus, string> = {
  PENDING: "bg-surface-muted text-fg-muted ring-border",
  PAID: "bg-fg text-surface ring-fg",
  FAILED: "bg-transparent text-fg ring-fg/40",
  CANCELED: "bg-surface-muted text-fg-muted ring-border",
  REFUNDED: "bg-surface-muted text-fg ring-border",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "neutral" | "success";
}) {
  const tones = {
    brand: "bg-fg text-surface ring-fg",
    neutral: "bg-surface-muted text-fg-muted ring-border",
    success: "bg-fg text-surface ring-fg",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
