"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { apiUrl } from "@/lib/site";
import { formatCurrency, formatDate } from "@/lib/format";
import { LAST_ORDER_KEY } from "@/hooks/use-checkout";
import type { PublicOrder } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("order");
    const txn = searchParams.get("_ptxn") ?? searchParams.get("txn");
    const access = searchParams.get("access");
    if (access) setAccessToken(access);
    const ref = fromQuery || txn;
    if (ref) {
      setOrderNumber(ref);
      return;
    }
    const stored = window.localStorage.getItem(LAST_ORDER_KEY);
    if (stored) setOrderNumber(stored);
  }, [searchParams]);

  const orderQuery = useQuery({
    queryKey: ["order-status", orderNumber, accessToken],
    enabled: Boolean(orderNumber),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (accessToken) params.access = accessToken;
      const response = await api.get<{ data: PublicOrder }>(
        `/orders/${orderNumber}/status`,
        { params },
      );
      return response.data.data;
    },
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 3000 : false,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-fg-muted transition hover:text-fg"
      >
        ← Back to home
      </Link>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-gradient">
        Your downloads
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        Enter your Paddle transaction ID below to access your purchase.
      </p>

      {!orderNumber ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-fg">
            Enter your Paddle transaction ID or order number to retrieve a
            purchase.
          </p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (manual.trim()) setOrderNumber(manual.trim());
            }}
          >
            <Input
              value={manual}
              onChange={(event) => setManual(event.target.value)}
              placeholder="txn_... or ORD-..."
            />
            <Button type="submit">Retrieve</Button>
          </form>
        </div>
      ) : null}

      {orderNumber && orderQuery.isLoading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading your purchase...
        </div>
      ) : null}

      {orderNumber && orderQuery.isError ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {getApiErrorMessage(orderQuery.error)}
        </div>
      ) : null}

      {orderQuery.data ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-fg-muted">
                Order number
              </p>
              <p className="text-lg font-semibold text-fg">
                {orderQuery.data.orderNumber}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                {formatCurrency(orderQuery.data.total, orderQuery.data.currency)} ·{" "}
                {formatDate(orderQuery.data.paidAt ?? new Date())}
              </p>
            </div>
            <StatusBadge status={orderQuery.data.status} />
          </div>

          {orderQuery.data.status === "PENDING" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted p-6 text-sm text-fg">
              <Spinner /> Waiting for payment confirmation from Paddle...
            </div>
          ) : null}

          {orderQuery.data.status === "PAID" && !orderQuery.data.authorized ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-fg">Your downloads</h2>
              <p className="mt-1 text-sm text-fg-muted">
                Your payment is confirmed. Use the access link we emailed to you
                to view your downloads here. If you lost the email, contact
                support.
              </p>
            </div>
          ) : null}

          {orderQuery.data.status === "PAID" && orderQuery.data.authorized ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-fg">
                  Your downloads
                </h2>
                {orderQuery.data.hasEmail ? (
                  <p className="mt-1 text-sm text-fg-muted">
                    We also emailed your access link, so you can come back to
                    these downloads anytime.
                  </p>
                ) : null}
              </div>
              {orderQuery.data.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <p className="font-medium text-fg">{item.productName}</p>
                  <div className="mt-3 space-y-2">
                    {item.downloads.length === 0 ? (
                      item.hasFiles ? (
                        <p className="text-sm text-fg-muted">
                          Preparing your download link...
                        </p>
                      ) : (
                        <p className="text-sm text-fg-muted">
                          No file is attached to this item yet. Please contact
                          support and we will sort it out.
                        </p>
                      )
                    ) : (
                      item.downloads.map((download) => (
                        <a
                          key={download.token}
                          href={`${apiUrl()}${download.url}`}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-fg transition hover:bg-accent hover:text-accent-fg"
                        >
                          <span className="truncate">{download.label}</span>
                          <span className="shrink-0 text-xs font-normal opacity-70">
                            {download.remaining} left
                          </span>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Spinner />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
