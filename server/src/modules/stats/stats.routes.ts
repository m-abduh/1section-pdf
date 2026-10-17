import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middlewares/auth";
import { getDashboardStats } from "./stats.service";

export const adminStatsRouter = Router();

adminStatsRouter.use(requireAuth);

adminStatsRouter.get("/", async (_req: Request, res: Response) => {
  const stats = await getDashboardStats();
  res.json({ success: true, data: stats });
});
