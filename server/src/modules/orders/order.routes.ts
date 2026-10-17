import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { accessLinkLimiter, orderStatusLimiter } from "../../middlewares/rate-limit";
import { validate } from "../../middlewares/validate";
import * as orderController from "./order.controller";
import { reconcilePaidOrders } from "../webhooks/webhook.service";
import type { Request, Response } from "express";
import {
  accessLinkRequestSchema,
  adminOrderListQuerySchema,
  orderIdParamSchema,
  orderStatusLookupSchema,
  orderStatusQuerySchema,
} from "./order.schema";

export const orderRouter = Router();

orderRouter.get(
  "/:orderNumber/status",
  orderStatusLimiter,
  validate({ params: orderStatusLookupSchema, query: orderStatusQuerySchema }),
  orderController.status,
);

orderRouter.post(
  "/:orderNumber/access-link",
  accessLinkLimiter,
  validate({ params: orderStatusLookupSchema, body: accessLinkRequestSchema }),
  orderController.requestAccessLink,
);

export const adminOrderRouter = Router();

adminOrderRouter.use(requireAuth, requireRole("admin"));
adminOrderRouter.post("/reconcile", async (_req: Request, res: Response) => {
  const repaired = await reconcilePaidOrders();
  res.json({ success: true, data: { repaired } });
});
adminOrderRouter.get(
  "/",
  validate({ query: adminOrderListQuerySchema }),
  orderController.listAdmin,
);
adminOrderRouter.get(
  "/:id",
  validate({ params: orderIdParamSchema }),
  orderController.getAdmin,
);
