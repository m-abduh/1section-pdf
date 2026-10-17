# Data Model — 1Section

> Skema database aktual (`server/prisma/schema.prisma`), relasi, index, aturan, riwayat migrasi, dan data seed. Database: **PostgreSQL**.

---

## 1. Konvensi

- **ID:** `String @id @default(cuid())` (kecuali tabel key-value `Setting`).
- **Timestamp:** `createdAt @default(now())` + `updatedAt @updatedAt` (kecuali tabel append-only seperti `DownloadToken`, `WebhookEvent`, `AuditLog`, `Entitlement`, `Payment` tidak semuanya memiliki `updatedAt`).
- **Nama tabel** di-map ke snake_case plural via `@@map` (mis. `Niche` → `niches`).
- **Uang:** disimpan sebagai **integer cent** (mis. `2900` = $29.00). Ini menghindari floating-point (`Int`), jadi konsisten dan aman. Field `currency` eksplisit, default `"USD"`.
- **Soft-hide:** memakai flag `active`; delete relasional memakai `onDelete` yang disengaja (cascade untuk entitas bergantung, `Restrict`/`SetNull` untuk riwayat agar tidak hilang).

---

## 2. Daftar Model

### 2.1 `AdminUser` → `admin_users`
Akun untuk dashboard admin.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `email` | String | unique |
| `name` | String? | nullable |
| `passwordHash` | String | bcrypt hash |
| `role` | String | default `"admin"` |
| `isActive` | Boolean | default `true` |
| `tokenVersion` | Int | default `0` — dinaikkan untuk mencabut seluruh sesi |
| `createdAt` / `updatedAt` | DateTime | |
| `auditLogs` | AuditLog[] | relasi |

### 2.2 `Niche` → `niches`
Kategori sekaligus landasan subdomain landing page.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `slug` | String | unique (dipakai subdomain) |
| `name` | String | |
| `tagline` / `description` / `heroImage` | String? | |
| `accentColor` | String | default `#6366F1` |
| `featured` | Boolean | default `false` |
| `active` | Boolean | default `true` |
| `sortOrder` | Int | default `0` |
| `createdAt` / `updatedAt` | DateTime | |
| `products` | Product[] | relasi |

Index: `@@index([active, sortOrder])`.

### 2.3 `Product` → `products`
Bundle PDF yang dijual (satu produk = satu bundle file).

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `nicheId` | String | FK → Niche (onDelete Cascade) |
| `slug` | String | unique |
| `name` / `summary` / `description` / `coverImage` | String? | |
| `priceAmount` | Int | harga (cent) |
| `compareAtAmount` | Int? | harga pembanding (cent) |
| `currency` | String | default `"USD"` |
| `paddleProductId` / `paddlePriceId` | String? | ID Paddle (`pro_...` / `pri_...`) — **tidak** diekspos ke publik |
| `paddleSyncedAt` | DateTime? | waktu sync terakhir |
| `features` | Json | default `[]` |
| `active` | Boolean | default `true` |
| `sortOrder` | Int | default `0` |
| `createdAt` / `updatedAt` | DateTime | |
| `files` | ProductFile[] | relasi |
| `orderItems` / `entitlements` | OrderItem[] / Entitlement[] | relasi |

Index: `@@index([nicheId, active, sortOrder])`.

### 2.4 `ProductFile` → `product_files`
File PDF di dalam sebuah bundle. Mendukung Cloudinary (privat) maupun URL eksternal/lokal.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `productId` | String | FK → Product (onDelete Cascade) |
| `name` | String | label file |
| `provider` | StorageProvider | `CLOUDINARY` / `LOCAL` / `EXTERNAL`, default `EXTERNAL` |
| `storageKey` | String? | public_id Cloudinary |
| `resourceType` | String? | mis. `image` (PDF di Cloudinary) |
| `format` | String? | mis. `pdf` |
| `bytes` | Int? | ukuran |
| `checksum` | String? | sha256 |
| `fileUrl` | String? | untuk EXTERNAL/LOCAL/legacy |
| `sortOrder` | Int | default `0` |
| `createdAt` | DateTime | now |
| `entitlements` / `downloadTokens` | relasi | |

Constraint: `@@unique([productId, sortOrder])`, `@@index([productId])`.

### 2.5 `OrderStatus` (enum)
`PENDING` · `PAID` · `FAILED` · `CANCELED` · `PARTIALLY_REFUNDED` · `REFUNDED`

### 2.6 `Order` → `orders`

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `orderNumber` | String | unique, `ORD-YYYYMMDD-NNNNNN` |
| `email` | String? | dari checkout / Paddle customer |
| `status` | OrderStatus | default `PENDING` |
| `currency` | String | default `"USD"` |
| `subtotal` / `total` | Int | cent |
| `amountRefunded` | Int | default `0` (cent) |
| `paddleTransactionId` | String? | unique (`txn_...`) |
| `paddleCustomerId` | String? | |
| `paidAt` / `refundedAt` | DateTime? | |
| `createdAt` / `updatedAt` | DateTime | |
| `items` / `payments` / `entitlements` / `accessLinks` | relasi | |

Index: `@@index([status, createdAt])`, `@@index([email, createdAt])`.

### 2.7 `OrderItem` → `order_items`
Baris item dalam order (snapshot harga & nama saat transaksi).

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `orderId` | String | FK → Order (onDelete Cascade) |
| `productId` | String? | FK → Product (onDelete **SetNull**) |
| `productName` / `productTitle` | String / String? | snapshot nama |
| `unitAmount` | Int | harga satuan (cent) |
| `quantity` | Int | default `1` |
| `lineTotal` | Int | default `0` |
| `paddlePriceId` | String? | snapshot price |
| `createdAt` | DateTime | now |
| `tokens` / `entitlements` | relasi | |

Index: `@@index([orderId])`.

### 2.8 `Payment` → `payments`
Memisahkan transaksi eksternal (Paddle) dari status order.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `orderId` | String | FK → Order (onDelete **Restrict**) |
| `provider` | String | default `"PADDLE"` |
| `providerTransactionId` | String? | unique (`txn_...`) |
| `status` | PaymentStatus | `PENDING`/`COMPLETED`/`FAILED`/`CANCELED`/`REFUNDED` |
| `amount` | Int | cent |
| `currency` | String | default `"USD"` |
| `createdAt` / `updatedAt` | DateTime | |

Index: `@@index([orderId, status])`.

### 2.9 `Entitlement` → `entitlements`
Sumber kebenaran hak akses pembeli atas sebuah bundle/file. Diterbitkan idempotent saat order `PAID`.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `orderId` | String | FK → Order (onDelete **Restrict**) |
| `orderItemId` | String | FK → OrderItem (onDelete Cascade) |
| `productId` / `fileId` | String? | FK → Product / ProductFile (onDelete SetNull) |
| `status` | EntitlementStatus | `ACTIVE` / `REVOKED` |
| `grantedAt` | DateTime | now |
| `downloadTokens` | DownloadToken[] | relasi |

Constraint: `@@unique([orderItemId, fileId])`, `@@index([orderId])`, `@@index([status])`.

### 2.10 `DownloadToken` → `download_tokens`
Mekanisme akses file (bukan bukti kepemilikan). TTL `DOWNLOAD_TOKEN_TTL_HOURS`, kuota `DOWNLOAD_MAX_HITS`.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `token` | String | unique (hex 24 byte) |
| `orderItemId` | String | FK → OrderItem (onDelete Cascade) |
| `entitlementId` | String? | FK → Entitlement (onDelete SetNull) |
| `fileId` | String? | FK → ProductFile (onDelete SetNull) |
| `label` | String | nama file |
| `fileUrl` | String? | untuk EXTERNAL/LOCAL/legacy (Cloudinary pakai signed URL) |
| `expiresAt` | DateTime | now + TTL |
| `maxDownloads` | Int | default `5` |
| `downloadCount` | Int | default `0` (dinaikkan **atomik**) |
| `createdAt` | DateTime | now |

Index: `@@index([orderItemId])`, `@@index([expiresAt])`.

### 2.11 `AccessLink` → `access_links`
Magic-link sekali pakai untuk memulihkan akses tanpa akun. TTL `ACCESS_LINK_TTL_MINUTES`.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `token` | String | unique |
| `orderId` | String | FK → Order (onDelete Cascade) |
| `email` | String | email tujuan |
| `expiresAt` | DateTime | |
| `usedAt` | DateTime? | diisi saat dipakai |
| `createdAt` | DateTime | now |

Index: `@@index([orderId])`.

### 2.12 `WebhookEvent` → `webhook_events`
Jejak event Paddle untuk **idempotensi + retry + pelacakan kegagalan**.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `eventId` | String | unique |
| `type` | String | eventType |
| `payload` | Json | data event |
| `status` | WebhookStatus | `RECEIVED`/`PROCESSED`/`FAILED`, default `RECEIVED` |
| `attempts` | Int | default `0` |
| `error` | String? | pesan error terakhir |
| `receivedAt` | DateTime | now |
| `processedAt` | DateTime? | diisi saat sukses |

Index: `@@index([status, receivedAt])`.

### 2.13 `AuditLog` → `audit_logs`
Jejak aksi sensitif admin (login, ubah harga, upload, dll).

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `adminId` | String? | FK → AdminUser (onDelete SetNull) |
| `action` | String | mis. `product.update` |
| `entity` / `entityId` | String / String? | |
| `metadata` | Json? | |
| `ip` | String? | |
| `createdAt` | DateTime | now |

Index: `@@index([adminId, createdAt])`, `@@index([entity, entityId])`.

### 2.14 `Setting` → `settings`
Key-value JSON untuk konfigurasi dinamis (belum dipakai di kode).

| Field | Tipe | Atribut |
| --- | --- | --- |
| `key` | String | PK |
| `value` | Json | |
| `updatedAt` | DateTime | updatedAt |

---

## 3. Relasi (ringkas)

```
Niche 1───∞ Product 1───∞ ProductFile
                │              │
                │              │
Order 1───∞ OrderItem ──∞ Entitlement ──∞ DownloadToken
  │            │              │
  ├─∞ Payment  └──────────────┘
  └─∞ AccessLink
```

- Hapus Niche → Product (cascade) → ProductFile (cascade).
- Hapus Product → OrderItem.productId & Entitlement.productId diset null (riwayat aman); ProductFile terhapus cascade dari Product.
- Hapus Order → OrderItem (cascade) → DownloadToken (cascade); **Payment/Entitlement memakai `Restrict`** agar histori transaksi tidak hilang.
- `Entitlement` idempotent: unique `(orderItemId, fileId)`.
- `DownloadToken` boleh dikaitkan ke `Entitlement` + `fileId` dengan FK (SetNull bila file hilang).

---

## 4. Riwayat Migrasi (`server/prisma/migrations/`)

| Migrasi | Isi |
| --- | --- |
| `20261016102757_init` | Enum `OrderStatus`, tabel awal, index, FK. |
| `20261016103805_add_paddle_product_id` | `products.paddleProductId` + `paddleSyncedAt`. |
| `20261016110500_product_files_bundle` | Tabel `product_files`; `download_tokens.fileId/label/fileUrl`; migrasi `products.fileUrl` → `product_files`. |
| `20261017120000_hardening_entities` | Enum `StorageProvider`, `PaymentStatus`, `EntitlementStatus`, `WebhookStatus`; nilai `OrderStatus.PARTIALLY_REFUNDED`; `admin_users.tokenVersion`; kolom storage pada `product_files` (`fileUrl` jadi nullable, unique `(productId, sortOrder)`); `orders.amountRefunded/refundedAt`; `order_items.lineTotal/productTitle`; `download_tokens.entitlementId`; `webhook_events.status/attempts/error/receivedAt`; tabel `payments`, `entitlements`, `access_links`, `audit_logs`. |

---

## 5. Seed (`server/prisma/seed.ts`)

Dijalankan dengan `npm run db:seed`. Idempotent (`upsert`). Admin dari env `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` (default `admin@1section.com` / `ChangeMe123!` / `Administrator`; bcrypt cost 10).

Niches: `finance` (#10B981), `business` (#6366F1), `marketing` (#F59E0B), `productivity` (#EC4899). Products: 1 per niche (`personal-finance-starter-bundle` 2900/5900, `business-launch-toolkit` 3900/7900, `content-marketing-system` 2400, `deep-work-planner` 1900). Seed belum membuat `ProductFile`, jadi produk contoh belum punya PDF.

---

## 6. Aturan & Batasan Penting

- `orderNumber` & `paddleTransactionId` unik → cegah duplikasi order.
- `WebhookEvent.eventId` unik → **lock idempotensi**: `create` gagal bila duplikat; sistem membedakan `PROCESSED` (skip) vs `FAILED` (retry).
- Produk tanpa `paddlePriceId` **tidak bisa** checkout.
- Uang disimpan `Int` cent; format di client (`formatCurrency` membagi 100). Tidak ada `Float`/`Decimal` untuk uang.
- `features` wajib array string (≤30 item, ≤200 char/item via zod).
- Data publik **tidak** mengekspos `paddleProductId`, `paddlePriceId`, `storageKey`, `fileUrl`; endpoint publik memakai `select` terbatas.
- Fulfillment idempotent lewat `Entitlement` unik + `DownloadToken` per entitlement.
