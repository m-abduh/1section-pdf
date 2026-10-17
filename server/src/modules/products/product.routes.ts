import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as productController from "./product.controller";
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  productSlugParamSchema,
  updateProductSchema,
} from "./product.schema";

export const productRouter = Router();

productRouter.get(
  "/",
  validate({ query: listProductsQuerySchema }),
  productController.listPublic,
);
productRouter.get(
  "/:slug",
  validate({ params: productSlugParamSchema }),
  productController.getPublic,
);

export const adminProductRouter = Router();

adminProductRouter.use(requireAuth, requireRole("admin"));
adminProductRouter.get("/", productController.listAdmin);
adminProductRouter.post(
  "/",
  validate({ body: createProductSchema }),
  productController.create,
);
adminProductRouter.patch(
  "/:id",
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  productController.update,
);
adminProductRouter.post(
  "/:id/paddle-sync",
  validate({ params: productIdParamSchema }),
  productController.syncPaddle,
);
adminProductRouter.get(
  "/:id/paddle",
  validate({ params: productIdParamSchema }),
  productController.getPaddle,
);
adminProductRouter.post(
  "/:id/paddle-archive",
  validate({ params: productIdParamSchema }),
  productController.archivePaddle,
);
adminProductRouter.delete(
  "/:id",
  validate({ params: productIdParamSchema }),
  productController.remove,
);
