import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as nicheController from "./niche.controller";
import {
  createNicheSchema,
  nicheIdParamSchema,
  nicheSlugParamSchema,
  updateNicheSchema,
} from "./niche.schema";

export const nicheRouter = Router();

nicheRouter.get("/", nicheController.listPublic);
nicheRouter.get(
  "/:slug",
  validate({ params: nicheSlugParamSchema }),
  nicheController.getPublic,
);

export const adminNicheRouter = Router();

adminNicheRouter.use(requireAuth);
adminNicheRouter.get("/", nicheController.listAdmin);
adminNicheRouter.post(
  "/",
  validate({ body: createNicheSchema }),
  nicheController.create,
);
adminNicheRouter.patch(
  "/:id",
  validate({ params: nicheIdParamSchema, body: updateNicheSchema }),
  nicheController.update,
);
adminNicheRouter.delete(
  "/:id",
  validate({ params: nicheIdParamSchema }),
  nicheController.remove,
);
