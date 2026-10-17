import fs from "node:fs";
import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { resolveDownload } from "./download.service";

export async function download(req: Request, res: Response) {
  const token = req.params.token as string;
  const resolved = await resolveDownload(token);

  if (resolved.redirectUrl) {
    res.redirect(resolved.redirectUrl);
    return;
  }

  if (!resolved.localPath) {
    throw ApiError.notFound("File could not be resolved");
  }

  if (!fs.existsSync(resolved.localPath)) {
    throw ApiError.notFound("File no longer exists on the server");
  }

  res.download(resolved.localPath, resolved.fileName);
}
