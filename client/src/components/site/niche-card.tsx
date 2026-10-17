import type { Niche } from "@/lib/types";
import { nicheUrl } from "@/lib/site";

export function NicheCard({ niche }: { niche: Niche }) {
  const productCount = niche._count?.products ?? 0;

  return (
    <a
      href={nicheUrl(niche.slug)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-fg/30 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40"
    >
      <span className="grid size-11 place-items-center rounded-xl border border-border bg-surface-muted text-lg font-bold text-fg">
        {niche.name.charAt(0)}
      </span>

      <h3 className="mt-4 text-lg font-semibold text-fg">{niche.name}</h3>
      <p className="mt-1 flex-1 text-sm text-fg-muted">
        {niche.tagline ?? niche.description ?? "Explore curated PDF bundles."}
      </p>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-fg-muted">
          {productCount} bundle{productCount === 1 ? "" : "s"}
        </span>
        <span className="font-medium text-fg transition group-hover:translate-x-0.5">
          View bundles →
        </span>
      </div>
    </a>
  );
}
