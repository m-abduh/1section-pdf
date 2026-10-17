import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as checkoutController from "./checkout.controller";
import { createCheckoutSchema } from "./checkout.schema";

export const checkoutRouter = Router();

checkoutRouter.post(
  "/",
  validate({ body: createCheckoutSchema }),
  checkoutController.create,
);
