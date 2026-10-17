import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { nicheRouter, adminNicheRouter } from "../modules/niches/niche.routes";
import { productRouter, adminProductRouter } from "../modules/products/product.routes";
import { checkoutRouter } from "../modules/checkout/checkout.routes";
import { orderRouter, adminOrderRouter } from "../modules/orders/order.routes";
import { downloadRouter } from "../modules/downloads/download.routes";
import { adminUploadRouter } from "../modules/uploads/upload.routes";
import { adminStatsRouter } from "../modules/stats/stats.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", time: new Date().toISOString() } });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/niches", nicheRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/checkout", checkoutRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/downloads", downloadRouter);

apiRouter.use("/admin/niches", adminNicheRouter);
apiRouter.use("/admin/products", adminProductRouter);
apiRouter.use("/admin/orders", adminOrderRouter);
apiRouter.use("/admin/uploads", adminUploadRouter);
apiRouter.use("/admin/stats", adminStatsRouter);
