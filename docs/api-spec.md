# API Specification — 1section

> Referensi REST API `server/` (Express 5). Base URL default: `http://localhost:4000`. Semua endpoint API berada di prefix **`/api`**. Response selalu JSON dengan envelope konsisten.

---

## 1. Konvensi

### Success
```json
{ "success": true, "data": { ... } }
```
Untuk endpoint list ber-paginasi ditambah:
```json
{ "success": true, "data": [ ... ], "pagination": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 } }
```

### Error
```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Product not found", "details": null } }
```

| Kode | HTTP | Sumber |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | `ApiError.badRequest`, validasi params/query/body |
| `VALIDATION_ERROR` | 400 | `ZodError` tak tertangani |
| `UNAUTHORIZED` | 401 | `requireAuth`, login gagal |
| `FORBIDDEN` | 403 | akses ditolak (mis. email tidak cocok, kuota habis, path traversal) |
| `NOT_FOUND` | 404 | resource/route tidak ada |
| `CONFLICT` | 409 | slug duplikat |
| `PADDLE_ERROR` | 502 | kegagalan API Paddle |
| `INTERNAL_ERROR` | 500 | error tak terduga |
| `EXPIRED` | 410 | token download kedaluwarsa |

### Autentikasi
Endpoint `admin/*` dan `auth/me` memerlukan header:
```
Authorization: Bearer <JWT>
```

### Validasi
Body/query/params divalidasi zod. Jika gagal, `400 BAD_REQUEST` dengan `details` = `error.flatten()`.

---

## 2. Health

### `GET /api/health`
Tidak butuh auth.
**200**
```json
{ "success": true, "data": { "status": "ok", "time": "2026-01-01T00:00:00.000Z" } }
```

---

## 3. Auth

### `POST /api/auth/login`
Login admin.
**Body**
```json
{ "email": "admin@1section.com", "password": "ChangeMe123!" }
```
**200**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "clx...", "email": "admin@1section.com", "name": "Administrator", "role": "admin" }
  }
}
```
**Errors:** `400` validasi; `401 UNAUTHORIZED` (email/password salah atau `isActive=false`).

### `GET /api/auth/me` 🔒
**200:** `{ "success": true, "data": { "id", "email", "name", "role" } }`

---

## 4. Niches

### `GET /api/niches`
Daftar niche **aktif**, urut `sortOrder ASC, name ASC`, termasuk jumlah produk aktif.
**200**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...", "slug": "finance", "name": "Finance",
      "tagline": "...", "description": "...", "heroImage": null,
      "audience": "Adults with irregular income",
      "problems": ["I cannot reconcile irregular income...", "..."],
      "accentColor": "#10B981", "active": true,
      "sortOrder": 1, "createdAt": "...", "updatedAt": "...",
      "_count": { "products": 2 }
    }
  ]
}
```

### `GET /api/niches/:slug`
Detail niche + produk aktif. Produk menyertakan field baru (`outcome`, `level`, dst). File hanya `{ id, name, sortOrder, format }` (tanpa `storageKey`/`fileUrl`). **Tanpa** ID Paddle.
**Params:** `slug` (string).
**200:** `data` = niche + `products: Product[]`.
**Errors:** `404 NOT_FOUND` bila tidak ada / non-aktif.

### `GET /api/admin/niches` 🔒
Semua niche (termasuk non-aktif), urut `sortOrder, name`, dengan `_count.products` (semua).

### `POST /api/admin/niches` 🔒
**Body**
```json
{
  "name": "Finance",            // wajib, 2..120
  "slug": "finance",            // opsional, regex ^[a-z0-9-]+$ (auto dari name bila kosong)
  "tagline": "...",             // opsional, <=240
  "description": "...",         // opsional, <=5000
  "audience": "...",            // opsional, <=1000
  "problems": ["...", "..."],   // opsional, maks 30, tiap item <=300
  "heroImage": "https://...",   // opsional, <=500
  "accentColor": "#10B981",     // opsional, hex 6 digit
  "active": true,               // opsional
  "sortOrder": 1                // opsional
}
```
**201:** `data` = niche baru.
**Errors:** `400` (mis. slug tak bisa digenerate), `409 CONFLICT` (slug sudah dipakai).

### `PATCH /api/admin/niches/:id` 🔒
Body = partial dari create. **200:** niche terupdate. **Errors:** `404`, `409`.

### `DELETE /api/admin/niches/:id` 🔒
Menghapus niche + seluruh produknya (cascade). **200:** `{ "success": true, "data": null }`.

---

## 5. Products

### `GET /api/products?niche=<slug>`
Daftar produk **aktif**; bila `niche` diberi, filter ke niche aktif tersebut. Include `niche` (id, slug, name, accentColor) + `files` terbatas (`{ id, name, sortOrder, format }`). **Tanpa** `paddleProductId`/`paddlePriceId`/`storageKey`/`fileUrl`.
**200:** array Product.

### `GET /api/products/:slug`
Detail produk publik. Include `niche` + `files` terbatas. **Tanpa** ID Paddle / referensi storage.
**Errors:** `404` bila non-aktif/tidak ada.

### `GET /api/admin/products` 🔒
Semua produk (termasuk non-aktif), urut `sortOrder ASC, createdAt DESC`, include `niche`, `files`, `_count.orderItems`.

### `POST /api/admin/products` 🔒
**Body**
```json
{
  "nicheId": "clx...",              // wajib
  "name": "Personal Finance Bundle",// wajib 2..160
  "slug": "personal-finance-bundle",// opsional regex
  "summary": "...",                 // opsional <=300
  "description": "...",             // opsional <=20000
  "audience": "...",                // opsional <=1000
  "notFor": "...",                  // opsional <=1000
  "outcome": "...",                 // opsional <=1000
  "learnings": ["...", "..."],      // opsional, maks 50, tiap item <=300
  "limitations": "...",             // opsional <=2000
  "license": "...",                 // opsional <=2000
  "sampleUrl": "https://...",       // opsional <=500
  "level": "PRACTICAL",             // opsional: FOUNDATIONS | PRACTICAL | ADVANCED
  "coverImage": "https://...",      // opsional <=500
  "priceAmount": 2900,              // wajib, int >=0 (cent)
  "compareAtAmount": 5900,          // opsional int >=0
  "currency": "USD",                // opsional, 3 char
  "paddlePriceId": null,            // opsional <=120
  "features": ["...", "..."],       // opsional, maks 30, tiap item <=200
  "files": [                        // opsional, maks 50
    {
      "name": "Budget Blueprint",
      "provider": "CLOUDINARY",     // CLOUDINARY | LOCAL | EXTERNAL (opsional, default EXTERNAL)
      "storageKey": "1section/bundles/budget-123", // public_id Cloudinary
      "resourceType": "image", "format": "pdf", "bytes": 123456, "checksum": "sha256...",
      "fileUrl": null,              // untuk EXTERNAL/LOCAL
      "assetFileId": "clx..."       // opsional, dari hasil upload
    }
  ],
  "active": true,                   // opsional
  "sortOrder": 0                    // opsional
}
```
**Perilaku:** setelah create, server **auto-sync ke Paddle** (best-effort). Response mengembalikan produk yang sudah di-refresh (berisi `paddleProductId`/`paddlePriceId` bila sync sukses).
**201:** `data` = product.
**Errors:** `400` (niche tidak ada / slug gagal), `409` (slug duplikat).

### `PATCH /api/admin/products/:id` 🔒
Body = partial. Bila produk sudah punya `paddleProductId`, otomatis sync ulang ke Paddle (best-effort). `files` bila dikirim akan **mengganti seluruh file** (deleteMany + create).
**200:** product terupdate.

### `DELETE /api/admin/products/:id` 🔒
Menghapus produk (ProductFile cascade; OrderItem.productId → null). **200:** `{ success:true, data:null }`.

### `POST /api/admin/products/:id/paddle-sync` 🔒
Sync manual produk+harga ke Paddle.
**200**
```json
{ "success": true, "data": { "paddleProductId": "pro_...", "paddlePriceId": "pri_...", "createdProduct": true, "createdPrice": true } }
```

### `GET /api/admin/products/:id/paddle` 🔒
Ambil state remote dari Paddle.
**200**
```json
{ "success": true, "data": { "linked": true, "syncedAt": "...", "product": {...}, "price": {...} } }
```

### `POST /api/admin/products/:id/paddle-archive` 🔒
Arsipkan price & product di Paddle, lalu set `active=false` lokal.
**200:** `{ "success": true, "data": { "productArchived": true, "priceArchived": true } }`

---

## 6. Checkout

### `POST /api/checkout`
Membuat order lokal + Paddle transaction.
**Body**
```json
{ "productId": "clx...", "email": "buyer@example.com" }
```
(`email` opsional.)

**Perilaku (`checkout.service.ts`):**
1. Ambil produk; tolak jika tidak ada / non-aktif (`404`) atau tanpa `paddlePriceId` (`400`).
2. Buat `Order` (PENDING, `orderNumber` format `ORD-YYYYMMDD-NNNNNN`) + 1 `OrderItem`.
3. `paddle.transactions.create({ items:[{priceId, quantity:1}], customData:{orderId, orderNumber, productId} })`.
4. Simpan `paddleTransactionId`.
5. Buat `AccessLink` berumur panjang (TTL `ORDER_ACCESS_TTL_HOURS`) → `accessToken` dipakai client untuk `successUrl`.

**201**
```json
{ "success": true, "data": { "orderNumber": "ORD-20260101-000123", "transactionId": "txn_...", "checkoutUrl": "https://...", "accessToken": "abc..." } }
```
**Errors:** `400` (produk tidak tertaut Paddle / tanpa URL checkout), `404`, `502 PADDLE_ERROR` (gagal Paddle — order di-set `FAILED`).

---

## 7. Orders

### `GET /api/orders/:orderNumber/status`
Status order publik + link unduhan (bila `PAID` **dan** akses terbukti).
- **Param:** `orderNumber` boleh berupa kode order toko (`ORD-...`) **atau** Paddle transaction ID (`txn_...`) dari redirect Paddle.
- **Query bukti akses:** `access=<token>` (dari `successUrl` checkout atau magic-link email) **atau** `email=<email>`.
- Bila tidak ada bukti yang cocok → response tetap `200` tetapi `authorized:false` dan `downloads:[]` (tidak membocorkan token / keberadaan email). **Rate-limited** (30/menit/IP).
- Bila `PAID` dan `authorized`, server melakukan self-heal `fulfillOrder` (idempotent).
- `email` pada response **dihapus** (hanya `hasEmail:boolean`).
- Tiap item punya `hasFiles:boolean` (produk punya `ProductFile` atau tidak). Bila `false`, klien menampilkan pesan "belum ada file" (bukan "preparing" terus-menerus).

**200**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD-20260101-000123",
    "status": "PAID",
    "total": 2900,
    "currency": "USD",
    "paidAt": "2026-01-01T00:05:00.000Z",
    "authorized": true,
    "hasEmail": true,
    "items": [
      {
        "id": "clx...", "productName": "Personal Finance Bundle",
        "quantity": 1, "unitAmount": 2900,
        "hasFiles": true,
        "downloads": [
          { "token": "abc...", "label": "Budget Blueprint", "url": "/api/downloads/abc...", "remaining": 5, "expiresAt": "2026-01-04T00:05:00.000Z" }
        ]
      }
    ]
  }
}
```
**Errors:** `404` (order tidak ada), `429 RATE_LIMITED`.

### `POST /api/orders/:orderNumber/access-link`
Minta kirim ulang tautan akses (tanpa form verify). **Rate-limited** (5/jam/IP).
**Body:** `{ "email": "buyer@example.com" }` (`email` opsional — bila kosong, pakai email yang tersimpan pada order).
**Perilaku:** bila order ada, buat `AccessLink` (TTL `ACCESS_LINK_TTL_MINUTES`) dan kirim email berisi tautan `APP_URL/checkout/success?order=...&access=...`. Bila `email` diberikan dan berbeda dari email order, tidak dikirim. Response **selalu generik** (anti-enumerasi).
**200:** `{ "success": true, "data": { "sent": true } }`.

### `GET /api/admin/orders` 🔒
List order ber-paginasi.
**Query:** `page` (>=1, default 1), `pageSize` (1..100, default 20), `status` (enum), `search` (orderNumber / email, case-insensitive `contains`).
**200:** `data` = Order[] (+items), `pagination`.

### `GET /api/admin/orders/:id` 🔒
Detail order, include `items` (+ `tokens`, `entitlements`, `product.slug`) + `payments`.
**Errors:** `404`.

### `POST /api/admin/orders/reconcile` 🔒
Menjalankan rekonsiliasi: menerbitkan ulang entitlement/token untuk order `PAID` yang bolong (idempotent).
**200:** `{ "success": true, "data": { "repaired": 2 } }`.

---

## 8. Downloads

### `GET /api/downloads/:token`
Mengunduh file. **Rate-limited** (60/menit/IP).
- Validasi: token ada (`404`), entitlement tidak `REVOKED` (`403`), belum expired (`410 EXPIRED`), kuota.
- Kuota dinaikkan **atomik** (`updateMany` dengan `downloadCount < maxDownloads`); bila gagal → `403`.
- Sumber file:
  - `provider=CLOUDINARY` → server membangun **signed URL** (`DOWNLOAD_SIGNED_URL_TTL_MINUTES`) lalu **302 redirect**.
  - `fileUrl` absolut (`http(s)://`) → **302 redirect**; lokal (`/uploads/...`) → `res.download(filePath, fileName)`.

Nama file: label + ekstensi `.pdf` bila belum ada, disanitasi (`[^a-zA-Z0-9._-]` → `-`).

---

## 9. Uploads

### `POST /api/admin/uploads` 🔒
`multipart/form-data`, field **`file`**. Hanya `application/pdf`, maks **50 MB**, **wajib lolos magic bytes `%PDF-`**. Diunggah ke Cloudinary (privat, `type=authenticated`).
**201**
```json
{
  "success": true,
  "data": {
    "name": "guide",
    "provider": "CLOUDINARY",
    "storageKey": "1section/bundles/guide-1700000000000",
    "resourceType": "image", "format": "pdf", "bytes": 123456, "checksum": "sha256...",
    "assetFileId": "clx..."
  }
}
```
Upload juga melakukan **upsert `AssetFile`** (by `storageKey`) dan mengembalikan `assetFileId` untuk dikaitkan ke `ProductFile`.
**Errors:** `400 BAD_FILE` (bukan PDF), `400 INVALID_PDF` (magic bytes tidak cocok), `400` (tidak ada file), `503 STORAGE_NOT_CONFIGURED` (Cloudinary belum dikonfigurasi).

### `GET /api/admin/assets` 🔒
Daftar `AssetFile` (terbaru dulu) dengan `_count.productFiles`.

### `POST /api/admin/assets` 🔒
Upsert `AssetFile` manual (by `storageKey`). **Body:** `storageKey` (wajib), `provider`, `resourceType`, `format`, `mimeType`, `bytes`, `checksum`. **201:** `data` = assetFile.

---

## 10. Stats

### `GET /api/admin/stats` 🔒
Agregat dashboard.
**200**
```json
{
  "success": true,
  "data": {
    "niches": 4,
    "products": 4,
    "orders": 12,
    "paidOrders": 9,
    "revenue": 26100,
    "recentOrders": [ { "id": "...", "orderNumber": "...", "status": "PAID", "total": 2900, "currency": "USD", "createdAt": "...", "items": [...] } ]
  }
}
```
`revenue` = SUM `total` order `PAID` (cent). `recentOrders` = 5 terbaru.

---

## 11. Webhook

### `POST /api/webhooks/paddle`
Bukan endpoint publik biasa — dipanggil Paddle.
- `Content-Type: application/json`, **raw body** (dipasang `express.raw` sebelum JSON parser).
- Header wajib **`Paddle-Signature`**; diverifikasi `paddle.webhooks.unmarshal(rawBody, secret, signature)`.

**Perilaku:**
1. Rekam event (`WebhookEvent`, `status=RECEIVED`). Bila `eventId` sudah ada:
   - `status=PROCESSED` → respons `{ received:true, duplicate:true }` tanpa proses ulang.
   - `status=FAILED` → diproses ulang (retry).
2. `processEvent` (dalam transaksi DB untuk perubahan order/payment):
   - `transaction.completed` → **validasi** payload (status/currency/harga/qty/total) vs snapshot order, lalu order `PAID` + `Payment COMPLETED` + `fulfillOrder` (terbitkan `Entitlement` + `DownloadToken`, idempotent).
   - `transaction.payment_failed` → `FAILED` (+ Payment `FAILED`)
   - `transaction.canceled` → `CANCELED` (+ Payment `CANCELED`)
   - `adjustment.created`/`adjustment.updated` → hanya `action=refund/chargeback` & `status=approved`; full → `REFUNDED` + cabut entitlement; sebagian → `PARTIALLY_REFUNDED`.
3. Sukses → `status=PROCESSED`; gagal → `status=FAILED` + `error` dan respons **500** agar Paddle mengirim ulang.

**200:** `{ "success": true, "data": { "received": true } }`
**Errors:** `400` (header hilang / body bukan buffer / signature invalid), `500` (proses gagal → retry).

---

## 12. Ringkasan Endpoint

| Method | Path | Auth | Deskripsi |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/login` | — | Login admin (rate-limited) |
| GET | `/api/auth/me` | 🔒 | Profil admin |
| POST | `/api/auth/logout` | 🔒 | Cabut sesi (naikkan `tokenVersion`) |
| GET | `/api/niches` | — | Niche aktif |
| GET | `/api/niches/:slug` | — | Detail niche + produk |
| GET | `/api/products` | — | Produk aktif (filter `?niche=`) |
| GET | `/api/products/:slug` | — | Detail produk publik |
| POST | `/api/checkout` | — | Buat order + Paddle transaction (rate-limited) |
| GET | `/api/orders/:orderNumber/status` | bukti | Status order + downloads |
| POST | `/api/orders/:orderNumber/access-link` | — | Kirim magic-link (rate-limited) |
| GET | `/api/downloads/:token` | — | Unduh file (rate-limited) |
| POST | `/api/webhooks/paddle` | sig | Webhook Paddle |
| GET | `/api/admin/niches` | 🔒 | List niche (admin) |
| POST | `/api/admin/niches` | 🔒 | Create niche |
| PATCH | `/api/admin/niches/:id` | 🔒 | Update niche |
| DELETE | `/api/admin/niches/:id` | 🔒 | Delete niche |
| GET | `/api/admin/products` | 🔒 | List product (admin) |
| POST | `/api/admin/products` | 🔒 | Create product (+ sync Paddle) |
| PATCH | `/api/admin/products/:id` | 🔒 | Update product (+ sync) |
| DELETE | `/api/admin/products/:id` | 🔒 | Delete product |
| POST | `/api/admin/orders/reconcile` | 🔒 | Rekonsiliasi entitlement order PAID |
| POST | `/api/admin/products/:id/paddle-sync` | 🔒 | Sync ke Paddle |
| GET | `/api/admin/products/:id/paddle` | 🔒 | State Paddle |
| POST | `/api/admin/products/:id/paddle-archive` | 🔒 | Archive di Paddle |
| GET | `/api/admin/orders` | 🔒 | List order (paginate/filter) |
| GET | `/api/admin/orders/:id` | 🔒 | Detail order |
| POST | `/api/admin/uploads` | 🔒 | Upload PDF (+ upsert AssetFile) |
| GET | `/api/admin/assets` | 🔒 | List asset files |
| POST | `/api/admin/assets` | 🔒 | Upsert asset file |
| GET | `/api/admin/stats` | 🔒 | Statistik dashboard |
