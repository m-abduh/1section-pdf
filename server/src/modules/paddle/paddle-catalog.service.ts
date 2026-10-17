import {
  type CurrencyCode,
  type CreatePriceRequestBody,
  type CreateProductRequestBody,
  type TaxCategory,
  type UpdatePriceRequestBody,
  type UpdateProductRequestBody,
} from "@paddle/paddle-node-sdk";
import type { Product } from "@prisma/client";
import { paddle } from "../../lib/paddle";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/api-error";

const TAX_CATEGORY = env.PADDLE_TAX_CATEGORY as TaxCategory;

export interface PaddleSyncResult {
  paddleProductId: string;
  paddlePriceId: string;
  createdProduct: boolean;
  createdPrice: boolean;
}

function toPaddleError(error: unknown): ApiError {
  const message = error instanceof Error ? error.message : "Paddle request failed";
  return new ApiError(502, `Paddle error: ${message}`, { code: "PADDLE_ERROR" });
}

function buildProductPayload(product: Product): UpdateProductRequestBody {
  return {
    name: product.name,
    description: product.summary ?? product.description ?? product.name,
    imageUrl: product.coverImage ?? null,
    taxCategory: TAX_CATEGORY,
  };
}

function buildPricePayload(
  product: Product,
  productId: string,
): CreatePriceRequestBody {
  return {
    productId,
    description: product.name,
    unitPrice: {
      amount: String(product.priceAmount),
      currencyCode: product.currency as CurrencyCode,
    },
    customData: { source: "1section", productId: product.id },
  };
}

async function safeArchivePrice(priceId: string): Promise<void> {
  try {
    await paddle.prices.archive(priceId);
  } catch {
    // archiving an already-archived or in-use price can fail; not fatal
  }
}

async function upsertRemoteProduct(product: Product): Promise<{
  paddleProductId: string;
  created: boolean;
}> {
  const payload = {
    ...buildProductPayload(product),
    customData: { source: "1section", productId: product.id },
  };

  if (!product.paddleProductId) {
    const created = await paddle.products.create(payload as CreateProductRequestBody);
    return { paddleProductId: created.id, created: true };
  }

  try {
    await paddle.products.update(product.paddleProductId, buildProductPayload(product));
    return { paddleProductId: product.paddleProductId, created: false };
  } catch {
    const created = await paddle.products.create(payload as CreateProductRequestBody);
    return { paddleProductId: created.id, created: true };
  }
}

async function upsertRemotePrice(
  product: Product,
  paddleProductId: string,
): Promise<{ paddlePriceId: string; created: boolean }> {
  if (!product.paddlePriceId) {
    const created = await paddle.prices.create(
      buildPricePayload(product, paddleProductId),
    );
    return { paddlePriceId: created.id, created: true };
  }

  const update: UpdatePriceRequestBody = {
    description: product.name,
    unitPrice: {
      amount: String(product.priceAmount),
      currencyCode: product.currency as CurrencyCode,
    },
  };

  try {
    await paddle.prices.update(product.paddlePriceId, update);
    return { paddlePriceId: product.paddlePriceId, created: false };
  } catch {
    const created = await paddle.prices.create(
      buildPricePayload(product, paddleProductId),
    );
    await safeArchivePrice(product.paddlePriceId);
    return { paddlePriceId: created.id, created: true };
  }
}

export async function syncProductToPaddle(
  productId: string,
): Promise<PaddleSyncResult> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  try {
    const remoteProduct = await upsertRemoteProduct(product);

    if (product.paddleProductId !== remoteProduct.paddleProductId) {
      await prisma.product.update({
        where: { id: product.id },
        data: { paddleProductId: remoteProduct.paddleProductId },
      });
    }

    const remotePrice = await upsertRemotePrice(
      product,
      remoteProduct.paddleProductId,
    );

    await prisma.product.update({
      where: { id: product.id },
      data: {
        paddleProductId: remoteProduct.paddleProductId,
        paddlePriceId: remotePrice.paddlePriceId,
        paddleSyncedAt: new Date(),
      },
    });

    return {
      paddleProductId: remoteProduct.paddleProductId,
      paddlePriceId: remotePrice.paddlePriceId,
      createdProduct: remoteProduct.created,
      createdPrice: remotePrice.created,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw toPaddleError(error);
  }
}

export async function getPaddleState(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  try {
    const [remoteProduct, remotePrice] = await Promise.all([
      product.paddleProductId
        ? paddle.products.get(product.paddleProductId)
        : Promise.resolve(null),
      product.paddlePriceId
        ? paddle.prices.get(product.paddlePriceId)
        : Promise.resolve(null),
    ]);

    return {
      linked: Boolean(product.paddleProductId && product.paddlePriceId),
      syncedAt: product.paddleSyncedAt,
      product: remoteProduct,
      price: remotePrice,
    };
  } catch (error) {
    throw toPaddleError(error);
  }
}

export async function archiveProductInPaddle(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const result = { priceArchived: false, productArchived: false };

  if (product.paddlePriceId) {
    try {
      await paddle.prices.archive(product.paddlePriceId);
      result.priceArchived = true;
    } catch {
      // ignore
    }
  }
  if (product.paddleProductId) {
    try {
      await paddle.products.archive(product.paddleProductId);
      result.productArchived = true;
    } catch {
      // ignore
    }
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { active: false },
  });

  return result;
}
