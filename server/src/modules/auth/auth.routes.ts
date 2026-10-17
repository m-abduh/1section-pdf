import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as authController from "./auth.controller";
import { loginSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginSchema }), authController.login);
authRouter.get("/me", requireAuth, authController.me);
