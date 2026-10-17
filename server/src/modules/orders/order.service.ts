import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { issueDownloadTokensForItem } from "../downloads/download.service";

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
  email: string | null;
  total: number;
  currency: string;
  paidAt: Date | null;
  items: PublicOrderItem[];
}

export async function getOrderStatus(
  orderNumber: string,
  email?: string,
): Promise<PublicOrder> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: { tokens: true },
      },
    },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.email && email && order.email.toLowerCase() !== email.toLowerCase()) {
    throw ApiError.forbidden("Email does not match this order");
  }

  if (order.status === "PAID") {
    for (const item of order.items) {
      if (item.tokens.length === 0) {
        const created = await issueDownloadTokensForItem(item.id, item.productId);
        if (created > 0) {
          item.tokens = await prisma.downloadToken.findMany({
            where: { orderItemId: item.id },
          });
        }
      }
    }
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    email: order.email,
    total: order.total,
    currency: order.currency,
    paidAt: order.paidAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      downloads:
        order.status === "PAID"
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
      items: { include: { tokens: true, product: { select: { slug: true } } } },
    },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  return order;
}
