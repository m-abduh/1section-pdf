"use client";

import { useState } from "react";
import type { AdminOrder, OrderStatus } from "@/lib/types";
import { useAdminOrders } from "@/hooks/use-admin-orders";
import { formatCurrency, formatDate } from "@/lib/format";
import { Modal } from "@/components/admin/modal";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const statusOptions: (OrderStatus | "")[] = [
  "",
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELED",
  "REFUNDED",
];

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const orders = useAdminOrders({
    page,
    pageSize: 20,
    status: status || undefined,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Orders</h1>
        <p className="text-sm text-fg-muted">One-time purchases made via Paddle.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border-0 bg-card px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus | "");
            setPage(1);
          }}
        >
          {statusOptions.map((option) => (
            <option key={option || "all"} value={option}>
              {option || "All statuses"}
            </option>
          ))}
        </select>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
        >
          <Input
            placeholder="Search order number or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {orders.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading orders...
        </div>
      ) : null}

      {orders.data && orders.data.items.length === 0 ? (
        <p className="rounded-2xl bg-card p-8 text-center text-sm text-fg-muted ring-1 ring-border">
          No orders found.
        </p>
      ) : null}

      {orders.data && orders.data.items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.data.items.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-muted">
                    <td className="px-5 py-3 font-medium text-fg">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3 text-fg-muted">
                      {order.email ?? "-"}
                    </td>
                    <td className="px-5 py-3 text-fg">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-fg-muted">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelected(order)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-fg-muted">
            <span>
              Page {orders.data.pagination.page} of {orders.data.pagination.totalPages}{" "}
              · {orders.data.pagination.total} orders
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= orders.data.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Modal
        open={Boolean(selected)}
        title={selected ? `Order ${selected.orderNumber}` : ""}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase text-fg-muted">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-fg-muted">Total</p>
                <p className="mt-1 font-medium text-fg">
                  {formatCurrency(selected.total, selected.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-fg-muted">Email</p>
                <p className="mt-1 text-fg">{selected.email ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-fg-muted">Paid at</p>
                <p className="mt-1 text-fg">
                  {formatDate(selected.paidAt)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-fg-muted">Items</p>
              <ul className="mt-2 divide-y divide-border rounded-lg ring-1 ring-border">
                {selected.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-fg">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="text-fg-muted">
                      {formatCurrency(item.unitAmount * item.quantity, selected.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
