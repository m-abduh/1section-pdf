"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { Spinner } from "@/components/ui/spinner";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoading && !user && !isLoginRoute) {
      router.replace("/admin/login");
    }
  }, [isLoading, user, isLoginRoute, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface text-fg-muted">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}
