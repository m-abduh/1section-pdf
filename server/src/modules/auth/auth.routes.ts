import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { loginLimiter } from "../../middlewares/rate-limit";
import { validate } from "../../middlewares/validate";
import * as authController from "./auth.controller";
import { loginSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  authController.login,
);
authRouter.get("/me", requireAuth, authController.me);
authRouter.post("/logout", requireAuth, authController.logout);
