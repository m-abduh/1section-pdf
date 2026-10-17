import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { BuyButton } from "@/components/site/buy-button";

export function ProductCard({ product }: { product: Product }) {
  const hasDiscount =
    product.compareAtAmount != null && product.compareAtAmount > product.priceAmount;
  const fileCount = product.files.length;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/5 dark:shadow-black/40">
      <div className="grid md:grid-cols-2">
        <div className="flex flex-col justify-between gap-6 p-8">
          <div>
            <Badge tone="neutral">
              {fileCount > 0
                ? `${fileCount} PDF${fileCount > 1 ? "s" : ""} bundle`
                : "Featured bundle"}
            </Badge>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              {product.name}
            </h2>
            {product.summary ? (
              <p className="mt-2 text-sm text-fg-muted">{product.summary}</p>
            ) : null}

            {product.features.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-fg-muted">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-fg">
                {formatCurrency(product.priceAmount, product.currency)}
              </span>
              {hasDiscount ? (
                <>
                  <span className="text-base text-fg-muted line-through">
                    {formatCurrency(product.compareAtAmount as number, product.currency)}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-fg-muted">
                    one-time
                  </span>
                </>
              ) : null}
            </div>

            <div className="mt-4">
              {product.active ? (
                <BuyButton productId={product.id} />
              ) : (
                <p className="rounded-lg bg-surface-muted px-4 py-3 text-center text-sm text-fg-muted">
                  Currently unavailable
                </p>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-fg-muted">
              Secure checkout via Paddle · Instant PDF download after payment
            </p>
          </div>
        </div>

        <div className="relative hidden min-h-[320px] overflow-hidden border-l border-border bg-surface-muted md:block">
          {product.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.coverImage}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover grayscale"
            />
          ) : (
            <div className="cinema-grid relative flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="cinema-spotlight pointer-events-none absolute inset-0" />
              <span className="relative grid size-16 place-items-center rounded-2xl border border-border bg-accent text-lg font-bold text-accent-fg shadow-lg">
                PDF
              </span>
              <p className="relative text-sm font-medium text-fg">{product.name}</p>
              <p className="relative text-xs text-fg-muted">
                {product.description ?? "Downloadable PDF bundle"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
