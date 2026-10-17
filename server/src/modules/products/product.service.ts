import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { slugify } from "../../utils/slug";
import type { CreateProductInput, UpdateProductInput } from "./product.schema";

const publicInclude: Prisma.ProductInclude = {
  niche: { select: { id: true, slug: true, name: true, accentColor: true } },
  files: { orderBy: { sortOrder: "asc" } },
};

export function listPublicProducts(nicheSlug?: string) {
  return prisma.product.findMany({
    where: {
      active: true,
      ...(nicheSlug ? { niche: { slug: nicheSlug, active: true } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: publicInclude,
  });
}

export function listAdminProducts() {
  return prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      niche: { select: { id: true, slug: true, name: true } },
      files: { orderBy: { sortOrder: "asc" } },
      _count: { select: { orderItems: true } },
    },
  });
}

export async function getPublicProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: publicInclude,
  });

  if (!product || !product.active) {
    throw ApiError.notFound("Product not found");
  }

  return product;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  return product;
}

async function assertNicheExists(nicheId: string) {
  const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
  if (!niche) {
    throw ApiError.badRequest("Selected niche does not exist");
  }
}

async function ensureSlugAvailable(slug: string, ignoreId?: string) {
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing && existing.id !== ignoreId) {
    throw ApiError.conflict(`Product slug "${slug}" is already used`);
  }
}

export async function createProduct(input: CreateProductInput) {
  await assertNicheExists(input.nicheId);

  const slug = input.slug ?? slugify(input.name);
  if (!slug) {
    throw ApiError.badRequest("Unable to generate a slug from the provided name");
  }
  await ensureSlugAvailable(slug);

  const data: Prisma.ProductCreateInput = {
    niche: { connect: { id: input.nicheId } },
    slug,
    name: input.name,
    summary: input.summary ?? null,
    description: input.description ?? null,
    coverImage: input.coverImage ?? null,
    priceAmount: input.priceAmount,
    compareAtAmount: input.compareAtAmount ?? null,
    currency: input.currency ?? "USD",
    paddlePriceId: input.paddlePriceId ?? null,
    features: input.features ?? [],
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
  };

  if (input.files && input.files.length > 0) {
    data.files = {
      create: input.files.map((file, index) => ({
        name: file.name,
        fileUrl: file.fileUrl,
        sortOrder: index,
      })),
    };
  }

  return prisma.product.create({ data });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await getProductById(id);

  if (input.nicheId) {
    await assertNicheExists(input.nicheId);
  }
  if (input.slug) {
    await ensureSlugAvailable(input.slug, id);
  }

  const data: Prisma.ProductUpdateInput = {};
  if (input.nicheId) data.niche = { connect: { id: input.nicheId } };
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.name !== undefined) data.name = input.name;
  if (input.summary !== undefined) data.summary = input.summary;
  if (input.description !== undefined) data.description = input.description;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage;
  if (input.priceAmount !== undefined) data.priceAmount = input.priceAmount;
  if (input.compareAtAmount !== undefined) data.compareAtAmount = input.compareAtAmount;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.paddlePriceId !== undefined) data.paddlePriceId = input.paddlePriceId;
  if (input.features !== undefined) data.features = input.features;
  if (input.active !== undefined) data.active = input.active;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  if (input.files !== undefined) {
    data.files = {
      deleteMany: {},
      create: input.files.map((file, index) => ({
        name: file.name,
        fileUrl: file.fileUrl,
        sortOrder: index,
      })),
    };
  }

  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  await getProductById(id);
  await prisma.product.delete({ where: { id } });
}
