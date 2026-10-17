import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as orderController from "./order.controller";
import {
  adminOrderListQuerySchema,
  orderIdParamSchema,
  orderStatusLookupSchema,
  orderStatusQuerySchema,
} from "./order.schema";

export const orderRouter = Router();

orderRouter.get(
  "/:orderNumber/status",
  validate({ params: orderStatusLookupSchema, query: orderStatusQuerySchema }),
  orderController.status,
);

export const adminOrderRouter = Router();

adminOrderRouter.use(requireAuth);
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
