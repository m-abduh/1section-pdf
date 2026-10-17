import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { env } from "../../config/env";
import { generateSecureToken } from "../../utils/ids";
import { sendAccessLinkEmail } from "../../lib/email";
import { fulfillOrder } from "../downloads/download.service";

export interface PublicOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitAmount: number;
  downloads: {
    token: string;
    label: string;
    url: string;
    remaining: number;
    expiresAt: Date;
  }[];
}

export interface PublicOrder {
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  paidAt: Date | null;
  authorized: boolean;
  hasEmail: boolean;
  items: PublicOrderItem[];
}

export interface AccessProof {
  email?: string;
  accessToken?: string;
}

async function isAuthorized(orderId: string, orderEmail: string | null, proof: AccessProof) {
  if (proof.accessToken) {
    const link = await prisma.accessLink.findUnique({
      where: { token: proof.accessToken },
    });
    if (
      link &&
      link.orderId === orderId &&
      link.expiresAt.getTime() > Date.now()
    ) {
      if (!link.usedAt) {
        await prisma.accessLink.update({
          where: { id: link.id },
          data: { usedAt: new Date() },
        });
      }
      return true;
    }
  }

  if (proof.email && orderEmail) {
    return orderEmail.toLowerCase() === proof.email.toLowerCase();
  }

  return false;
}

export async function getOrderStatus(
  orderNumber: string,
  proof: AccessProof,
): Promise<PublicOrder> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { tokens: true } } },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const authorized = await isAuthorized(order.id, order.email, proof);

  if (order.status === "PAID" && authorized) {
    // Self-heal: idempotently re-issue any missing entitlements/tokens.
    await fulfillOrder(order.id);
    order.items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: { tokens: true },
    });
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    currency: order.currency,
    paidAt: order.paidAt,
    authorized,
    hasEmail: Boolean(order.email),
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      downloads:
        order.status === "PAID" && authorized
          ? item.tokens.map((token) => ({
              token: token.token,
              label: token.label,
              url: `/api/downloads/${token.token}`,
              remaining: token.maxDownloads - token.downloadCount,
              expiresAt: token.expiresAt,
            }))
          : [],
    })),
  };
}

/**
 * Sends a magic access link. Response is always generic to avoid leaking
 * whether an order number exists.
 */
export async function requestAccessLink(
  orderNumber: string,
  email: string,
): Promise<void> {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) return;

  const normalized = email.toLowerCase();

  if (order.email && order.email.toLowerCase() !== normalized) {
    return;
  }

  if (!order.email) {
    await prisma.order.update({
      where: { id: order.id },
      data: { email: normalized },
    });
  }

  const token = generateSecureToken(24);
  await prisma.accessLink.create({
    data: {
      token,
      orderId: order.id,
      email: normalized,
      expiresAt: new Date(Date.now() + env.ACCESS_LINK_TTL_MINUTES * 60 * 1000),
    },
  });

  await sendAccessLinkEmail({ to: normalized, orderNumber, token });
}

export async function listAdminOrders(params: {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  search?: string;
}) {
  const where: Prisma.OrderWhereInput = {};
  if (params.status) {
    where.status = params.status;
  }
  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { items: true },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    },
  };
}

export async function getAdminOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          tokens: true,
          entitlements: true,
          product: { select: { slug: true } },
        },
      },
      payments: true,
    },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  return order;
}
