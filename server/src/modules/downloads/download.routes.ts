import { Router } from "express";
import { downloadLimiter } from "../../middlewares/rate-limit";
import * as downloadController from "./download.controller";

export const downloadRouter = Router();

downloadRouter.get("/:token", downloadLimiter, downloadController.download);
