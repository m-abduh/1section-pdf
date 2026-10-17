"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("order");
    const access = searchParams.get("access");
    if (access) setAccessToken(access);
    if (fromQuery) {
      setOrderNumber(fromQuery);
      return;
    }
    const stored = window.localStorage.getItem(LAST_ORDER_KEY);
    if (stored) setOrderNumber(stored);
  }, [searchParams]);

  const orderQuery = useQuery({
    queryKey: ["order-status", orderNumber, accessToken, email],
    enabled: Boolean(orderNumber),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (accessToken) params.access = accessToken;
      else if (email) params.email = email;
      const response = await api.get<{ data: PublicOrder }>(
        `/orders/${orderNumber}/status`,
        { params },
      );
      return response.data.data;
    },
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 3000 : false,
  });

  const requestLink = useMutation({
    mutationFn: async () => {
      await api.post(`/orders/${orderNumber}/access-link`, { email });
    },
    onSuccess: () => {
      setNotice(
        "If your email matches this order, a secure access link is on its way. Check your inbox.",
      );
    },
    onError: (error) => setNotice(getApiErrorMessage(error)),
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
        Your purchase
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        Bookmark this page or keep your order number to retrieve your downloads
        later.
      </p>

      {!orderNumber ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-fg">
            Enter your order number to retrieve a purchase.
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
              placeholder="ORD-20260101-000123"
            />
            <Button type="submit">Retrieve</Button>
          </form>
        </div>
      ) : null}

      {orderNumber && orderQuery.isLoading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading order {orderNumber}...
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
              <h2 className="text-lg font-semibold text-fg">
                Verify to unlock downloads
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                Enter the email you used at checkout, or send yourself a secure
                access link.
              </p>
              <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  setNotice(null);
                  setEmail(email.trim());
                }}
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Button type="submit">Unlock</Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!email.includes("@") || requestLink.isPending}
                  onClick={() => requestLink.mutate()}
                >
                  {requestLink.isPending ? <Spinner /> : null}
                  Email me a link
                </Button>
              </form>
              {notice ? (
                <p className="mt-3 text-xs text-fg-muted">{notice}</p>
              ) : null}
            </div>
          ) : null}

          {orderQuery.data.status === "PAID" && orderQuery.data.authorized ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-fg">Your downloads</h2>
              {orderQuery.data.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <p className="font-medium text-fg">{item.productName}</p>
                  <div className="mt-3 space-y-2">
                    {item.downloads.length === 0 ? (
                      <p className="text-sm text-fg-muted">
                        Preparing your download link...
                      </p>
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
