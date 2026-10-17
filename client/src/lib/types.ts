export interface Niche {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  heroImage: string | null;
  accentColor: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface ProductFile {
  id: string;
  name: string;
  fileUrl: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  nicheId: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  coverImage: string | null;
  priceAmount: number;
  compareAtAmount: number | null;
  currency: string;
  paddleProductId: string | null;
  paddlePriceId: string | null;
  paddleSyncedAt: string | null;
  features: string[];
  files: ProductFile[];
  active: boolean;
  sortOrder: number;
  niche?: { id: string; slug: string; name: string };
  _count?: { orderItems: number };
}

export interface NicheWithProducts extends Niche {
  products: Product[];
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED";

export interface DownloadLink {
  token: string;
  label: string;
  url: string;
  remaining: number;
  expiresAt: string;
}

export interface PublicOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitAmount: number;
  downloads: DownloadLink[];
}

export interface PublicOrder {
  orderNumber: string;
  status: OrderStatus;
  email: string | null;
  total: number;
  currency: string;
  paidAt: string | null;
  items: PublicOrderItem[];
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  email: string | null;
  customerName: string | null;
  status: OrderStatus;
  currency: string;
  total: number;
  paidAt: string | null;
  createdAt: string;
  items: { id: string; productName: string; quantity: number; unitAmount: number }[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  error?: { code: string; message: string; details?: unknown };
}
