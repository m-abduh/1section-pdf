"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Niche, Product } from "@/lib/types";
import {
  useUploadPdf,
  type ProductFileInput,
  type ProductInput,
} from "@/hooks/use-admin-products";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  nicheId: z.string().min(1, "Select a niche"),
  name: z.string().min(2, "Name is too short").max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and hyphens only")
    .optional(),
  summary: z.string().max(300).optional(),
  description: z.string().max(20000).optional(),
  coverImage: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  compareAt: z.coerce.number().min(0).optional(),
  features: z.string().optional(),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function parseFeatures(value?: string): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export function ProductForm({
  product,
  niches,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  product?: Product | null;
  niches: Niche[];
  onSubmit: (input: ProductInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const uploadPdf = useUploadPdf();
  const [files, setFiles] = useState<ProductFileInput[]>(
    product?.files.map((file) => ({ name: file.name, fileUrl: file.fileUrl })) ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const defaults: FormValues = product
    ? {
        nicheId: product.nicheId,
        name: product.name,
        slug: product.slug,
        summary: product.summary ?? "",
        description: product.description ?? "",
        coverImage: product.coverImage ?? "",
        price: product.priceAmount / 100,
        compareAt: product.compareAtAmount ? product.compareAtAmount / 100 : undefined,
        features: (product.features ?? []).join("\n"),
        sortOrder: product.sortOrder,
        active: product.active,
      }
    : {
        nicheId: niches[0]?.id ?? "",
        name: "",
        slug: "",
        summary: "",
        description: "",
        coverImage: "",
        price: 0,
        compareAt: undefined,
        features: "",
        sortOrder: 0,
        active: true,
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const result = await uploadPdf.mutateAsync(file);
        setFiles((previous) => [
          ...previous,
          { name: stripExtension(file.name), fileUrl: result.url },
        ]);
      }
    } catch (error) {
      setUploadError(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const updateFileName = (index: number, name: string) => {
    setFiles((previous) =>
      previous.map((file, i) => (i === index ? { ...file, name } : file)),
    );
  };

  const removeFile = (index: number) => {
    setFiles((previous) => previous.filter((_, i) => i !== index));
  };

  const submit = handleSubmit((values) => {
    onSubmit({
      nicheId: values.nicheId,
      name: values.name,
      slug: values.slug || undefined,
      summary: values.summary || null,
      description: values.description || null,
      coverImage: values.coverImage || null,
      priceAmount: Math.round(values.price * 100),
      compareAtAmount:
        values.compareAt != null && values.compareAt > 0
          ? Math.round(values.compareAt * 100)
          : null,
      currency: "USD",
      features: parseFeatures(values.features),
      files,
      active: values.active,
      sortOrder: values.sortOrder,
    });
  });

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Niche" error={errors.nicheId?.message}>
          <select
            className="w-full rounded-lg border-0 bg-card px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent"
            {...register("nicheId")}
          >
            {niches.map((niche) => (
              <option key={niche.id} value={niche.id}>
                {niche.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Name" error={errors.name?.message}>
          <Input placeholder="Personal Finance Starter Bundle" {...register("name")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" hint="Leave blank to auto-generate" error={errors.slug?.message}>
          <Input placeholder="personal-finance-bundle" {...register("slug")} />
        </Field>
        <div className="rounded-lg bg-surface-muted p-3 text-xs text-fg ring-1 ring-border">
          Produk & harga otomatis dibuat di Paddle saat disimpan. ID Paddle
          (`prod_...` / `pri_...`) tersimpan sendiri ke database — tidak perlu
          isi manual.
        </div>
      </div>

      <Field label="Summary" error={errors.summary?.message}>
        <Input placeholder="Short selling point" {...register("summary")} />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <Textarea rows={4} {...register("description")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (USD)" error={errors.price?.message}>
          <Input type="number" step="0.01" min="0" {...register("price")} />
        </Field>
        <Field label="Compare-at (USD)" error={errors.compareAt?.message}>
          <Input type="number" step="0.01" min="0" {...register("compareAt")} />
        </Field>
        <Field label="Sort order" error={errors.sortOrder?.message}>
          <Input type="number" {...register("sortOrder")} />
        </Field>
      </div>

      <Field label="Features" hint="One feature per line">
        <Textarea rows={4} {...register("features")} />
      </Field>

      <Field label="Cover image URL" error={errors.coverImage?.message}>
        <Input placeholder="https://..." {...register("coverImage")} />
      </Field>

      <div className="rounded-lg bg-surface-muted p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-fg">PDF files (bundle)</p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Upload banyak PDF. Pembeli dapat semua file ini dalam 1 kali beli.
            </p>
          </div>
          <label className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition hover:opacity-90">
            Add PDFs
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {uploading ? (
          <span className="mt-3 flex items-center gap-2 text-xs text-fg-muted">
            <Spinner /> Uploading...
          </span>
        ) : null}
        {uploadError ? (
          <p className="mt-2 text-xs text-red-600">{uploadError}</p>
        ) : null}

        {files.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.fileUrl}-${index}`}
                className="flex items-center gap-2 rounded-lg bg-card p-2 ring-1 ring-border"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded bg-red-50 text-[10px] font-bold text-red-600">
                  PDF
                </span>
                <Input
                  value={file.name}
                  onChange={(event) => updateFileName(index, event.target.value)}
                  placeholder="File name shown to buyers"
                  className="h-8 flex-1 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-fg-muted">No files yet.</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-fg">
        <input type="checkbox" className="size-4" {...register("active")} />
        Active (visible on the landing page)
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? <Spinner /> : null}
          {product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
