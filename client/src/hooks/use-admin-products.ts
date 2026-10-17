"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export interface ProductFileInput {
  name: string;
  provider?: "CLOUDINARY" | "LOCAL" | "EXTERNAL";
  storageKey?: string | null;
  resourceType?: string | null;
  format?: string | null;
  bytes?: number | null;
  checksum?: string | null;
  fileUrl?: string | null;
}

export interface UploadedPdf {
  name: string;
  provider: "CLOUDINARY";
  storageKey: string;
  resourceType: string;
  format: string;
  bytes: number;
  checksum: string;
}

export interface ProductInput {
  nicheId: string;
  name: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  coverImage?: string | null;
  priceAmount: number;
  compareAtAmount?: number | null;
  currency?: string;
  paddlePriceId?: string | null;
  features?: string[];
  files?: ProductFileInput[];
  active?: boolean;
  sortOrder?: number;
}

export const adminProductKeys = {
  all: ["admin", "products"] as const,
};

export function useAdminProducts() {
  return useQuery({
    queryKey: adminProductKeys.all,
    queryFn: async () => {
      const response = await api.get<{ data: Product[] }>("/admin/products");
      return response.data.data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const response = await api.post<{ data: Product }>("/admin/products", input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ProductInput> }) => {
      const response = await api.patch<{ data: Product }>(`/admin/products/${id}`, input);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
  });
}

export function useUploadPdf() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post<{ data: UploadedPdf }>(
        "/admin/uploads",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data.data;
    },
  });
}

export interface PaddleSyncResult {
  paddleProductId: string;
  paddlePriceId: string;
  createdProduct: boolean;
  createdPrice: boolean;
}

export function useSyncProductPaddle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ data: PaddleSyncResult }>(
        `/admin/products/${id}/paddle-sync`,
      );
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
  });
}

export function useArchiveProductPaddle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{
        data: { productArchived: boolean; priceArchived: boolean };
      }>(`/admin/products/${id}/paddle-archive`);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminProductKeys.all }),
  });
}
