# Data Model — 1Section

> Skema database aktual (`server/prisma/schema.prisma`), relasi, index, aturan, riwayat migrasi, dan data seed. Database: **PostgreSQL**.

---

## 1. Konvensi

- **ID:** `String @id @default(cuid())` (kecuali tabel key-value `Setting`).
- **Timestamp:** `createdAt @default(now())` + `updatedAt @updatedAt` (kecuali `ProductFile`, `OrderItem`, `DownloadToken`, `WebhookEvent`, `Setting`).
- **Nama tabel** di-map ke snake_case plural via `@@map` (mis. `Niche` → `niches`).
- **Uang:** integer dalam **cent** (mis. `2900` = $29.00), field `currency` default `"USD"`.
- **Soft-hide:** memakai flag `active` (bukan soft delete); delete relasional memakai `onDelete` cascade/set null.

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
| `createdAt` | DateTime | now |
| `updatedAt` | DateTime | updatedAt |

### 2.2 `Niche` → `niches`
Kategori sekaligus landasan subdomain landing page.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `slug` | String | unique (dipakai subdomain) |
| `name` | String | |
| `tagline` | String? | |
| `description` | String? | |
| `heroImage` | String? | (disimpan tapi belum dirender) |
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
| `name` | String | |
| `summary` | String? | |
| `description` | String? | |
| `coverImage` | String? | |
| `priceAmount` | Int | harga (cent) |
| `compareAtAmount` | Int? | harga pembanding (cent) |
| `currency` | String | default `"USD"` |
| `paddleProductId` | String? | ID produk Paddle (`pro_...`) |
| `paddlePriceId` | String? | ID price Paddle (`pri_...`) |
| `paddleSyncedAt` | DateTime? | waktu sync terakhir |
| `features` | Json | default `[]` (array string) |
| `active` | Boolean | default `true` |
| `sortOrder` | Int | default `0` |
| `createdAt` / `updatedAt` | DateTime | |
| `files` | ProductFile[] | relasi |
| `orderItems` | OrderItem[] | relasi |

Index: `@@index([nicheId, active, sortOrder])`.

### 2.4 `ProductFile` → `product_files`
File PDF di dalam sebuah bundle produk.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `productId` | String | FK → Product (onDelete Cascade) |
| `name` | String | label file |
| `fileUrl` | String | `/uploads/<uuid>.pdf` atau URL eksternal |
| `sortOrder` | Int | default `0` |
| `createdAt` | DateTime | now |

Index: `@@index([productId, sortOrder])`.

### 2.5 `OrderStatus` (enum)
`PENDING` · `PAID` · `FAILED` · `CANCELED` · `REFUNDED`

### 2.6 `Order` → `orders`
Transaksi pembelian.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `orderNumber` | String | unique, format `ORD-YYYYMMDD-NNNNNN` |
| `email` | String? | dari input checkout / Paddle customer |
| `customerName` | String? | |
| `status` | OrderStatus | default `PENDING` |
| `currency` | String | default `"USD"` |
| `subtotal` | Int | default `0` |
| `total` | Int | default `0` |
| `paddleTransactionId` | String? | unique (`txn_...`) |
| `paddleCustomerId` | String? | (`ctm_...`) |
| `paidAt` | DateTime? | diisi saat webhook completed |
| `createdAt` / `updatedAt` | DateTime | |
| `items` | OrderItem[] | relasi |

Index: `@@index([status, createdAt])`, `@@index([email])`.

### 2.7 `OrderItem` → `order_items`
Baris item dalam order (saat ini selalu 1 item).

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `orderId` | String | FK → Order (onDelete Cascade) |
| `productId` | String? | FK → Product (onDelete **SetNull**) — snapshot agar riwayat aman bila produk dihapus |
| `productName` | String | snapshot nama |
| `unitAmount` | Int | harga satuan (cent) |
| `quantity` | Int | default `1` |
| `paddlePriceId` | String? | snapshot price |
| `createdAt` | DateTime | now |
| `tokens` | DownloadToken[] | relasi |

Index: `@@index([orderId])`.

### 2.8 `DownloadToken` → `download_tokens`
Token unduh per file untuk pembeli. Diterbitkan saat order `PAID`.

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `token` | String | unique (hex 24 byte) |
| `orderItemId` | String | FK → OrderItem (onDelete Cascade) |
| `fileId` | String? | referensi ProductFile (tanpa FK) |
| `label` | String | nama file yang ditampilkan |
| `fileUrl` | String | target unduh |
| `expiresAt` | DateTime | now + `DOWNLOAD_TOKEN_TTL_HOURS` |
| `maxDownloads` | Int | default `5` (dari `DOWNLOAD_MAX_HITS`) |
| `downloadCount` | Int | default `0` |
| `createdAt` | DateTime | now |

Index: `@@index([orderItemId])`.

### 2.9 `WebhookEvent` → `webhook_events`
Jejak event Paddle untuk **idempotensi** (eventId unique).

| Field | Tipe | Atribut |
| --- | --- | --- |
| `id` | String | PK, cuid |
| `eventId` | String | unique |
| `type` | String | eventType |
| `payload` | Json | data event |
| `processedAt` | DateTime | now |

### 2.10 `Setting` → `settings`
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
                │
                │ (onDelete SetNull)
                ▼
Order 1───∞ OrderItem 1───∞ DownloadToken
```

- Hapus Niche → hapus Product (cascade) → hapus ProductFile (cascade).
- Hapus Product → OrderItem.productId diset null (snapshot nama/harga tetap tersimpan).
- Hapus Order → hapus OrderItem (cascade) → hapus DownloadToken (cascade).

---

## 4. Riwayat Migrasi (`server/prisma/migrations/`)

| Migrasi | Isi |
| --- | --- |
| `20261016102757_init` | Membuat enum `OrderStatus`, seluruh tabel awal (`admin_users`, `niches`, `products`, `orders`, `order_items`, `download_tokens`, `webhook_events`, `settings`), index & foreign key. `products` awalnya punya satu kolom `fileUrl`. |
| `20261016103805_add_paddle_product_id` | Menambah `products.paddleProductId` + `paddleSyncedAt`. |
| `20261016110500_product_files_bundle` | Membuat tabel `product_files`; menambah `download_tokens.fileId/label/fileUrl`; **migrasi data**: memindahkan `products.fileUrl` lama ke `product_files`; menghapus kolom `products.fileUrl`. |

**Evolusi penting:** model single-file (`products.fileUrl`) → **multi-file bundle** (`ProductFile[]`), dan token unduh per-file.

---

## 5. Seed (`server/prisma/seed.ts`)

Dijalankan dengan `npm run db:seed`. Idempotent (memakai `upsert`).

**Admin** (dari env `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME`, default `admin@1section.com` / `ChangeMe123!` / `Administrator`; password di-hash bcrypt cost 10).

**Niches:**

| slug | name | accentColor | featured | sortOrder |
| --- | --- | --- | --- | --- |
| `finance` | Finance | `#10B981` | true | 1 |
| `business` | Business | `#6366F1` | true | 2 |
| `marketing` | Marketing | `#F59E0B` | false | 3 |
| `productivity` | Productivity | `#EC4899` | false | 4 |

**Products** (1 per niche, `currency: USD`, `active: true`, **tanpa** `paddlePriceId` → perlu sync manual di admin):

| niche | slug | harga | compare-at |
| --- | --- | --- | --- |
| finance | `personal-finance-starter-bundle` | 2900 | 5900 |
| business | `business-launch-toolkit` | 3900 | 7900 |
| marketing | `content-marketing-system` | 2400 | null |
| productivity | `deep-work-planner` | 1900 | null |

Catatan: seed belum membuat `ProductFile`, sehingga produk contoh **belum punya file PDF**; unduhan hanya terbit bila ada file.

---

## 6. Aturan & Batasan Penting

- `orderNumber` dan `paddleTransactionId` unik → mencegah duplikasi order dari callback ganda.
- `WebhookEvent.eventId` unik → `create` gagal bila duplicate, dipakai sebagai lock idempotensi.
- Produk tanpa `paddlePriceId` **tidak bisa** checkout (`ApiError.badRequest`).
- Harga disimpan `Int` di Postgres; pembagian/format dilakukan di client (`formatCurrency` membagi 100).
- `features` harus array string (dibatasi 30 item & 200 char/item via zod di server; 1 baris per fitur di client).
- `paddlePriceId` pada `Product` bisa diinput manual (schema mengizinkan), tapi alur utama adalah auto-sync.
