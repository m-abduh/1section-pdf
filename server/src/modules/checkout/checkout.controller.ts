import type { Request, Response } from "express";
import * as checkoutService from "./checkout.service";

export async function create(req: Request, res: Response) {
  const result = await checkoutService.createCheckout(req.body);
  res.status(201).json({ success: true, data: result });
}
