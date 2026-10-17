"use client";

import Link from "next/link";
import { useAdminStats } from "@/hooks/use-admin-orders";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatRelative } from "@/lib/format";
import { Spinner } from "@/components/ui/spinner";

export default function AdminDashboardPage() {
  const stats = useAdminStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">Dashboard</h1>
          <p className="text-sm text-fg-muted">Overview of your store.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
          >
            New product
          </Link>
          <Link
            href="/admin/niches"
            className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-fg ring-1 ring-inset ring-border transition hover:bg-surface-muted"
          >
            Manage niches
          </Link>
        </div>
      </div>

      {stats.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading stats...
        </div>
      ) : null}

      {stats.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenue" value={formatCurrency(stats.data.revenue)} />
            <StatCard label="Paid orders" value={stats.data.paidOrders} />
            <StatCard label="Total orders" value={stats.data.orders} />
            <StatCard
              label="Catalog"
              value={`${stats.data.niches} / ${stats.data.products}`}
              hint="niches / products"
            />
          </div>

          <div className="rounded-2xl bg-card shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-fg">Recent orders</h2>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-fg hover:opacity-70"
              >
                View all
              </Link>
            </div>
            {stats.data.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-fg-muted">
                No orders yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.data.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-fg">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {order.email ?? "no email"} · {formatRelative(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-fg">
                        {formatCurrency(order.total, order.currency)}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
