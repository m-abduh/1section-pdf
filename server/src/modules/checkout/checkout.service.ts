import { prisma } from "../../lib/prisma";
import { paddle } from "../../lib/paddle";
import { ApiError } from "../../utils/api-error";
import { generateOrderNumber } from "../../utils/ids";
import type { CreateCheckoutInput } from "./checkout.schema";

export interface CheckoutResult {
  orderNumber: string;
  transactionId: string;
  checkoutUrl: string;
}

export async function createCheckout(
  input: CreateCheckoutInput,
): Promise<CheckoutResult> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: { niche: { select: { slug: true, name: true } } },
  });

  if (!product || !product.active) {
    throw ApiError.notFound("Product not found");
  }

  if (!product.paddlePriceId) {
    throw ApiError.badRequest(
      "Product is not linked to a Paddle price yet. Add a Paddle price ID in admin.",
    );
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      email: input.email?.toLowerCase() ?? null,
      status: "PENDING",
      currency: product.currency,
      subtotal: product.priceAmount,
      total: product.priceAmount,
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            unitAmount: product.priceAmount,
            quantity: 1,
            paddlePriceId: product.paddlePriceId,
          },
        ],
      },
    },
  });

  try {
    const transaction = await paddle.transactions.create({
      items: [
        {
          priceId: product.paddlePriceId,
          quantity: 1,
        },
      ],
      customData: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        productId: product.id,
      },
    });

    const checkoutUrl = transaction.checkout?.url;
    if (!checkoutUrl) {
      throw ApiError.badRequest(
        "Paddle did not return a checkout URL for this price",
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paddleTransactionId: transaction.id },
    });

    return {
      orderNumber: order.orderNumber,
      transactionId: transaction.id,
      checkoutUrl,
    };
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });

    if (error instanceof ApiError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Paddle checkout failed";
    throw new ApiError(502, `Paddle checkout error: ${message}`, {
      code: "PADDLE_ERROR",
    });
  }
}
