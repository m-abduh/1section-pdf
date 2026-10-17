import { Router } from "express";
import * as downloadController from "./download.controller";

export const downloadRouter = Router();

downloadRouter.get("/:token", downloadController.download);
