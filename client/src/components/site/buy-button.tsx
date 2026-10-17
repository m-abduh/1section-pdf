"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BuyButtonProps {
  productId: string;
  productSlug?: string;
  label?: string;
  size?: "md" | "lg";
  className?: string;
}

export function BuyButton({
  productId,
  productSlug,
  label = "Buy once, download instantly",
  size = "lg",
  className = "",
}: BuyButtonProps) {
  const router = useRouter();

  return (
    <div className="w-full">
      <Button
        type="button"
        size={size}
        className={`w-full ${className}`}
        onClick={() => {
          const params = new URLSearchParams({ product: productId });
          if (productSlug) params.set("slug", productSlug);
          router.push(`/checkout?${params.toString()}`);
        }}
      >
        {label}
      </Button>
    </div>
  );
}
