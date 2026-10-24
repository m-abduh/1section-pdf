import Link from "next/link";
import type { Product } from "@/lib/types";
import { LEARNING_LEVEL_LABEL } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { resourceUrl } from "@/lib/site";

export function ProductCard({
  product,
  nicheSlug,
  accentColor = "#6366F1",
}: {
  product: Product;
  nicheSlug: string;
  accentColor?: string;
}) {
  const hasDiscount =
    product.compareAtAmount != null && product.compareAtAmount > product.priceAmount;
  const learnings = product.learnings?.slice(0, 3) ?? [];

  return (
    <Link
      href={resourceUrl(nicheSlug, product.slug)}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-fg/20 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40"
    >
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-fg-muted">
          {LEARNING_LEVEL_LABEL[product.level]}
        </span>
        {hasDiscount ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            Save {formatCurrency(product.compareAtAmount! - product.priceAmount, product.currency)}
          </span>
        ) : null}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-fg">{product.name}</h3>
      <p className="mt-2 flex-1 text-sm text-fg-muted">
        {product.outcome ?? product.summary ?? "A practical learning guide."}
      </p>

      {learnings.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {learnings.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-fg-muted">
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span className="line-clamp-2">{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex items-end justify-between gap-3 border-t border-border pt-4">
        <span className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-fg">
            {formatCurrency(product.priceAmount, product.currency)}
          </span>
          {hasDiscount ? (
            <span className="text-sm text-fg-muted line-through">
              {formatCurrency(product.compareAtAmount as number, product.currency)}
            </span>
          ) : null}
        </span>
        <span className="text-sm font-semibold text-fg transition group-hover:translate-x-0.5">
          View guide →
        </span>
      </div>
    </Link>
  );
}
