"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { getPaddle } from "@/lib/paddle";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/server-api";
import type { Product } from "@/lib/types";

type CheckoutState =
  | { status: "idle" }
  | { status: "creating" }
  | { status: "ready"; transactionId: string; orderNumber: string; accessToken: string }
  | { status: "error"; message: string };

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <Spinner />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const slugParam = searchParams.get("slug");
  const txnParam = searchParams.get("txn") ?? searchParams.get("_ptxn");
  const accessParam = searchParams.get("access");

  const [state, setState] = useState<CheckoutState>({ status: "idle" });
  const [product, setProduct] = useState<Product | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load product info for the summary panel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const products = (await getProducts()) ?? [];
        const found = slugParam
          ? products.find((p) => p.slug === slugParam)
          : products.find((p) => p.id === productParam);
        if (!cancelled) setProduct(found ?? null);
      } catch {
        // ignore; summary just won't show
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productParam, slugParam]);

  // Detect theme for Paddle.
  useEffect(() => {
    const update = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Create the transaction (unless a transaction id was provided directly).
  useEffect(() => {
    if (txnParam) {
      setState({
        status: "ready",
        transactionId: txnParam,
        orderNumber: searchParams.get("order") ?? "",
        accessToken: accessParam ?? "",
      });
      return;
    }
    if (!productParam) {
      setState({ status: "error", message: "No product selected." });
      return;
    }
    let cancelled = false;
    setState({ status: "creating" });
    (async () => {
      try {
        const res = await api.post<{ data: { orderNumber: string; transactionId: string; checkoutUrl: string; accessToken: string } }>(
          "/checkout",
          { productId: productParam },
        );
        if (cancelled) return;
        const data = res.data.data;
        try {
          window.localStorage.setItem("section_last_order", data.orderNumber);
        } catch {
          // ignore
        }
        setState({
          status: "ready",
          transactionId: data.transactionId,
          orderNumber: data.orderNumber,
          accessToken: data.accessToken,
        });
      } catch (err) {
        if (cancelled) return;
        setState({ status: "error", message: getApiErrorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productParam, txnParam, accessParam, searchParams]);

  const successUrl =
    state.status === "ready"
      ? `${window.location.origin}/checkout/success?order=${encodeURIComponent(state.orderNumber)}&access=${encodeURIComponent(state.accessToken)}`
      : undefined;

  // Render Paddle inline once ready.
  useEffect(() => {
    if (state.status !== "ready") return;
    const transactionId = state.transactionId;
    const url = successUrl;
    let cancelled = false;
    (async () => {
      try {
        const paddle = await getPaddle();
        if (cancelled) return;
        paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "inline",
            variant: "one-page",
            theme,
            locale: "en",
            frameTarget: "checkout-container",
            frameInitialHeight: "450",
            frameStyle:
              "width: 100%; min-width: 312px; background-color: transparent; border: none;",
            successUrl: url,
          },
        });
      } catch (err) {
        if (cancelled) return;
        setState({ status: "error", message: getApiErrorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, theme, successUrl]);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader niches={[]} />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="cinema-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="cinema-spotlight pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface to-transparent" />

          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <Link
              href={product ? `/resources/${product.slug}` : "/"}
              className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted transition hover:text-fg"
            >
              ← Back
            </Link>

            <div className="mt-6 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              {/* Summary */}
              <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
                    Order summary
                  </p>

                  {product ? (
                    <>
                      {product.coverImage ? (
                        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface-muted">
                          <img
                            src={product.coverImage}
                            alt={product.name}
                            className="aspect-[16/9] w-full object-cover"
                          />
                        </div>
                      ) : null}

                      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-fg">
                        {product.name}
                      </h1>
                      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                        {product.outcome ?? product.summary ?? "A practical learning bundle."}
                      </p>

                      <div className="mt-6 flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-fg">
                          {formatCurrency(product.priceAmount, product.currency)}
                        </span>
                        {product.compareAtAmount != null &&
                        product.compareAtAmount > product.priceAmount ? (
                          <span className="text-sm text-fg-muted line-through">
                            {formatCurrency(product.compareAtAmount, product.currency)}
                          </span>
                        ) : null}
                      </div>

                      <ul className="mt-5 space-y-2 text-sm text-fg-muted">
                        <li className="flex items-center gap-2">
                          <span className="grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-fg">
                            ✓
                          </span>
                          One-time payment · lifetime access
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-fg">
                            ✓
                          </span>
                          No recurring charges
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-fg">
                            ✓
                          </span>
                          Instant access after payment
                        </li>
                      </ul>
                    </>
                  ) : (
                    <div className="mt-5 space-y-3">
                      <div className="h-6 w-2/3 animate-pulse rounded bg-surface-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-surface-muted" />
                      <div className="mt-4 h-9 w-1/3 animate-pulse rounded bg-surface-muted" />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-surface-muted p-5 text-sm text-fg-muted">
                  <p className="font-semibold text-fg">Secured by Paddle</p>
                  <p className="mt-1">
                    Payments and taxes are handled by Paddle as merchant of record.
                    Your card details never touch our servers.
                  </p>
                </div>
              </aside>

              {/* Inline checkout */}
              <div className="rounded-3xl border border-border bg-card shadow-2xl shadow-black/5 dark:shadow-black/40">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
                    Secure checkout
                  </p>
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                </div>

                <div className="p-2">
                  {state.status === "creating" || state.status === "idle" ? (
                    <div className="flex min-h-[480px] items-center justify-center">
                      <Spinner />
                      <span className="ml-3 text-sm text-fg-muted">Preparing checkout…</span>
                    </div>
                  ) : null}

                  {state.status === "error" ? (
                    <div className="flex min-h-[480px] flex-col items-center justify-center gap-4 p-6 text-center">
                      <p className="text-sm text-red-600">{state.message}</p>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => window.history.back()}
                      >
                        Go back
                      </Button>
                    </div>
                  ) : null}

                  {state.status === "ready" ? (
                    <div
                      className="checkout-container w-full overflow-hidden rounded-2xl"
                      style={{ minHeight: 480 }}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter niches={[]} />
    </div>
  );
}
