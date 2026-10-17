import { Router } from "express";
import { checkoutLimiter } from "../../middlewares/rate-limit";
import { validate } from "../../middlewares/validate";
import * as checkoutController from "./checkout.controller";
import { createCheckoutSchema } from "./checkout.schema";

export const checkoutRouter = Router();

checkoutRouter.post(
  "/",
  checkoutLimiter,
  validate({ body: createCheckoutSchema }),
  checkoutController.create,
);
