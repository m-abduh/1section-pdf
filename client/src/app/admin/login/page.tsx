"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      router.replace("/admin");
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  return (
    <div className="grid min-h-screen place-items-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
            1S
          </span>
          <span className="text-lg font-semibold text-fg">Admin</span>
        </div>
        <h1 className="mt-6 text-xl font-bold text-fg">Sign in</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Manage niches, products, and orders.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="Email" error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="admin@1section.com"
              {...register("email")}
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
          </Field>

          {serverError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
