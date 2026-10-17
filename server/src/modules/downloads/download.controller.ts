import fs from "node:fs";
import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { resolveDownload, resolveLocalFile } from "./download.service";

export async function download(req: Request, res: Response) {
  const token = req.params.token as string;
  const resolved = await resolveDownload(token);

  if (resolved.external) {
    res.redirect(resolved.downloadUrl);
    return;
  }

  const filePath = resolveLocalFile(resolved.fileUrl);
  if (!fs.existsSync(filePath)) {
    throw ApiError.notFound("File no longer exists on the server");
  }

  res.download(filePath, resolved.fileName);
}
