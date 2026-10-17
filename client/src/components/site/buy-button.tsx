"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api";
import { useCheckout } from "@/hooks/use-checkout";

interface BuyButtonProps {
  productId: string;
  label?: string;
  size?: "md" | "lg";
  className?: string;
}

export function BuyButton({
  productId,
  label = "Buy once, download instantly",
  size = "lg",
  className = "",
}: BuyButtonProps) {
  const checkout = useCheckout();

  return (
    <div className="w-full">
      <Button
        type="button"
        size={size}
        className={`w-full ${className}`}
        disabled={checkout.isPending}
        onClick={() => checkout.mutate({ productId })}
      >
        {checkout.isPending ? <Spinner /> : null}
        {checkout.isPending ? "Starting checkout..." : label}
      </Button>
      {checkout.isError ? (
        <p className="mt-2 text-center text-xs font-medium text-red-600">
          {getApiErrorMessage(checkout.error)}
        </p>
      ) : null}
    </div>
  );
}
