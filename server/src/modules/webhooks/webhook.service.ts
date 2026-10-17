import type { Order, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { paddle } from "../../lib/paddle";
import { issueDownloadTokensForItem } from "../downloads/download.service";

type PaddleEvent = {
  eventId: string;
  eventType: string;
  data: Record<string, unknown>;
};

function readString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

function readCustomData(source: Record<string, unknown>): Record<string, unknown> {
  const value = source.customData;
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

async function resolveOrder(
  transactionId: string | undefined,
  customData: Record<string, unknown>,
): Promise<Order | null> {
  const orderId = typeof customData.orderId === "string" ? customData.orderId : undefined;
  if (orderId) {
    const byId = await prisma.order.findUnique({ where: { id: orderId } });
    if (byId) return byId;
  }
  if (transactionId) {
    return prisma.order.findUnique({ where: { paddleTransactionId: transactionId } });
  }
  return null;
}

async function resolveCustomerEmail(customerId: string | undefined): Promise<string | undefined> {
  if (!customerId) return undefined;
  try {
    const customer = await paddle.customers.get(customerId);
    return customer.email ?? undefined;
  } catch {
    return undefined;
  }
}

async function markOrderPaid(event: PaddleEvent) {
  const data = event.data;
  const transactionId = readString(data, "id");
  const customData = readCustomData(data);
  const order = await resolveOrder(transactionId, customData);

  if (!order) {
    console.warn(`[webhook] order not found for transaction ${transactionId}`);
    return;
  }

  if (order.status === "PAID") {
    return;
  }

  const customerId = readString(data, "customerId");
  const email =
    order.email ?? (await resolveCustomerEmail(customerId)) ?? null;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paddleTransactionId: transactionId ?? order.paddleTransactionId,
      paddleCustomerId: customerId ?? order.paddleCustomerId,
      email,
    },
  });

  const items = await prisma.orderItem.findMany({
    where: { orderId: order.id },
  });

  for (const item of items) {
    const created = await issueDownloadTokensForItem(item.id, item.productId);
    if (created === 0) {
      console.warn(`[webhook] order item ${item.id} has no files to deliver`);
    }
  }
}

async function updateOrderStatus(event: PaddleEvent, status: Order["status"]) {
  const data = event.data;
  const transactionId = readString(data, "id");
  const customData = readCustomData(data);
  const order = await resolveOrder(transactionId, customData);

  if (!order) {
    return;
  }

  if (order.status === "PAID" && status !== "REFUNDED") {
    return;
  }

  await prisma.order.update({ where: { id: order.id }, data: { status } });
}

export async function handlePaddleEvent(event: PaddleEvent): Promise<void> {
  switch (event.eventType) {
    case "transaction.completed":
      await markOrderPaid(event);
      break;
    case "transaction.payment_failed":
      await updateOrderStatus(event, "FAILED");
      break;
    case "transaction.canceled":
      await updateOrderStatus(event, "CANCELED");
      break;
    case "adjustment.created":
      await updateOrderStatus(event, "REFUNDED");
      break;
    default:
      break;
  }
}

export async function recordWebhookEvent(event: PaddleEvent): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({
      data: {
        eventId: event.eventId,
        type: event.eventType,
        payload: event.data as Prisma.InputJsonValue,
      },
    });
    return true;
  } catch {
    return false;
  }
}
