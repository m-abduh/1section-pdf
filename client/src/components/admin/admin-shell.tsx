"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/niches", label: "Niches", icon: "◆" },
  { href: "/admin/products", label: "Products", icon: "▤" },
  { href: "/admin/orders", label: "Orders", icon: "▤" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        <Link href="/admin" className="flex items-center gap-2 px-2 py-3">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
            1S
          </span>
          <span className="text-sm font-semibold text-fg">Admin</span>
        </Link>

        <nav className="mt-4 space-y-1">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-accent-fg"
                    : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <p className="px-2 text-xs text-fg-muted">{user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
              1S
            </span>
            <span className="text-sm font-semibold text-fg">Admin</span>
          </div>
          <nav className="flex gap-4 overflow-x-auto md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm font-medium text-fg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-fg-muted md:block">
              Signed in as <span className="font-medium text-fg">{user?.email}</span>
            </span>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
