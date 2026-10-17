import type { Niche, NicheWithProducts, Product } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiGet<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    const json = (await response.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

export function getNiches(): Promise<Niche[] | null> {
  return apiGet<Niche[]>("/niches", 30);
}

export function getNiche(slug: string): Promise<NicheWithProducts | null> {
  return apiGet<NicheWithProducts>(`/niches/${slug}`, 30);
}

export function getProduct(slug: string): Promise<Product | null> {
  return apiGet<Product>(`/products/${slug}`, 30);
}
