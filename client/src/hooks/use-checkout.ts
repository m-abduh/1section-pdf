"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getPaddle } from "@/lib/paddle";

export const LAST_ORDER_KEY = "section_last_order";

export interface CheckoutPayload {
  productId: string;
  email?: string;
}

export interface CheckoutResult {
  orderNumber: string;
  transactionId: string;
  checkoutUrl: string;
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload): Promise<CheckoutResult> => {
      const response = await api.post<{ data: CheckoutResult }>("/checkout", payload);
      return response.data.data;
    },
    onSuccess: async (data) => {
      try {
        window.localStorage.setItem(LAST_ORDER_KEY, data.orderNumber);
      } catch {
        /* storage might be unavailable */
      }

      const successUrl = `${window.location.origin}/checkout/success?order=${data.orderNumber}`;

      try {
        const paddle = await getPaddle();
        paddle.Checkout.open({
          transactionId: data.transactionId,
          settings: {
            displayMode: "overlay",
            successUrl,
          },
        });
      } catch {
        window.location.href = data.checkoutUrl || successUrl;
      }
    },
  });
}
