import type { Request, Response } from "express";
import * as productService from "./product.service";
import {
  archiveProductInPaddle,
  getPaddleState,
  syncProductToPaddle,
} from "../paddle/paddle-catalog.service";

export async function listPublic(req: Request, res: Response) {
  const niche = typeof req.query.niche === "string" ? req.query.niche : undefined;
  const products = await productService.listPublicProducts(niche);
  res.json({ success: true, data: products });
}

export async function getPublic(req: Request, res: Response) {
  const product = await productService.getPublicProductBySlug(
    req.params.slug as string,
  );
  res.json({ success: true, data: product });
}

export async function listAdmin(_req: Request, res: Response) {
  const products = await productService.listAdminProducts();
  res.json({ success: true, data: products });
}

export async function create(req: Request, res: Response) {
  const product = await productService.createProduct(req.body);

  try {
    await syncProductToPaddle(product.id);
  } catch (error) {
    console.warn(
      `[paddle] auto-sync on create failed for product ${product.id}:`,
      error instanceof Error ? error.message : error,
    );
  }

  const refreshed = await productService.getProductById(product.id);
  res.status(201).json({ success: true, data: refreshed });
}

export async function update(req: Request, res: Response) {
  const product = await productService.updateProduct(
    req.params.id as string,
    req.body,
  );

  if (product.paddleProductId) {
    try {
      await syncProductToPaddle(product.id);
    } catch (error) {
      console.warn(
        `[paddle] auto-sync failed for product ${product.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  const refreshed = await productService.getProductById(product.id);
  res.json({ success: true, data: refreshed });
}

export async function remove(req: Request, res: Response) {
  await productService.deleteProduct(req.params.id as string);
  res.json({ success: true, data: null });
}

export async function syncPaddle(req: Request, res: Response) {
  const result = await syncProductToPaddle(req.params.id as string);
  res.json({ success: true, data: result });
}

export async function getPaddle(req: Request, res: Response) {
  const result = await getPaddleState(req.params.id as string);
  res.json({ success: true, data: result });
}

export async function archivePaddle(req: Request, res: Response) {
  const result = await archiveProductInPaddle(req.params.id as string);
  res.json({ success: true, data: result });
}
