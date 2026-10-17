import type { OrderStatus } from "@prisma/client";
import type { Request, Response } from "express";
import * as orderService from "./order.service";

export async function status(req: Request, res: Response) {
  const email = typeof req.query.email === "string" ? req.query.email : undefined;
  const access = typeof req.query.access === "string" ? req.query.access : undefined;
  const order = await orderService.getOrderStatus(
    req.params.orderNumber as string,
    { email, accessToken: access },
  );
  res.json({ success: true, data: order });
}

export async function requestAccessLink(req: Request, res: Response) {
  const body = req.body as { email: string };
  await orderService.requestAccessLink(req.params.orderNumber as string, body.email);
  res.json({
    success: true,
    data: { sent: true, message: "If the details match, an access link is on its way." },
  });
}

interface AdminOrderQuery {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  search?: string;
}

export async function listAdmin(req: Request, res: Response) {
  const query: AdminOrderQuery = {
    page: Math.max(Number(req.query.page) || 1, 1),
    pageSize: Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100),
    status:
      typeof req.query.status === "string" && req.query.status
        ? (req.query.status as OrderStatus)
        : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  };
  const result = await orderService.listAdminOrders(query);
  res.json({ success: true, data: result.items, pagination: result.pagination });
}

export async function getAdmin(req: Request, res: Response) {
  const order = await orderService.getAdminOrder(req.params.id as string);
  res.json({ success: true, data: order });
}
