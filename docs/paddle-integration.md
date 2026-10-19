# Paddle Integration — 1section

> Detail integrasi Paddle sebagai *merchant of record*: katalog (product & price), checkout, webhook fulfillment, konfigurasi sandbox/production, dan pengujian.

---

## 1. Ringkasan Peran Paddle

- **Merchant of record:** menangani pembayaran, pajak (VAT/sales tax), invoice, refund.
- **Katalog:** setiap produk 1section direplikasi sebagai Paddle *product* + *price*.
- **Checkout:** dibuka via Paddle.js (overlay) menggunakan `transactionId` dari API.
- **Konfirmasi:** webhook `transaction.completed` memicu pemberian akses unduh.

Komponen kode:
- Server SDK: `src/lib/server/lib/paddle.ts`, `src/lib/server/modules/paddle/paddle-catalog.service.ts`, `checkout.service.ts`, `webhooks/*`.
- Client SDK: `src/lib/paddle.ts` + `hooks/use-checkout.ts`.

---

## 2. Konfigurasi

### Server env
| Var | Contoh | Catatan |
| --- | --- | --- |
| `PADDLE_ENV` | `sandbox` | `sandbox` \| `production` |
| `PADDLE_API_KEY` | `pdl_sdbx_apikey_...` | Server-only |
| `PADDLE_WEBHOOK_SECRET` | `pdl_ntfset_...` | Untuk verifikasi signature |
| `PADDLE_TAX_CATEGORY` | `standard` | Dipetakan ke `TaxCategory` SDK |

`lib/paddle.ts` membuat instance dengan `Environment.sandbox` atau `Environment.production`.

### Client env
| Var | Catatan |
| --- | --- |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` → `paddle.Environment.set("sandbox")` |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Token publik (client-side), dari dashboard Paddle |

> **Penting:** `PADDLE_API_KEY` & `PADDLE_WEBHOOK_SECRET` hanyalah di server. Repository berisi nilai contoh di `.env` lokal — jangan commit/ekspos; rotate bila pernah terpapar.

---

## 3. Sinkronisasi Katalog (`paddle-catalog.service.ts`)

### 3.1 Pemetaan field
| 1section (Product) | Paddle |
| --- | --- |
| `name` | product `name` |
| `summary` \|\| `description` \|\| `name` | product `description` |
| `coverImage` | product `imageUrl` |
| `PADDLE_TAX_CATEGORY` | product `taxCategory` |
| `priceAmount` (cent, string) | price `unitPrice.amount` |
| `currency` | price `unitPrice.currencyCode` |
| `customData { source:"1section", productId }` | product/price `customData` |

### 3.2 `syncProductToPaddle(productId)`
1. `upsertRemoteProduct`:
   - bila belum punya `paddleProductId` → `paddle.products.create` → simpan id.
   - bila sudah → `paddle.products.update`; jika gagal → `create` baru.
2. Simpan `paddleProductId` bila berubah.
3. `upsertRemotePrice`:
   - bila belum punya `paddlePriceId` → `paddle.prices.create`.
   - bila sudah → `paddle.prices.update`; jika gagal → `create` baru + archive price lama (`safeArchivePrice`).
4. Simpan `paddleProductId`, `paddlePriceId`, `paddleSyncedAt`.

Return: `{ paddleProductId, paddlePriceId, createdProduct, createdPrice }`.
Error Paddle dibungkus `ApiError(502, ..., code: "PADDLE_ERROR")`.

### 3.3 `getPaddleState(productId)`
Ambil remote product & price (bila ada id), kembalikan `{ linked, syncedAt, product, price }`.

### 3.4 `archiveProductInPaddle(productId)`
Archive price lalu product di Paddle (toleran error), set `active=false` lokal. Return `{ productArchived, priceArchived }`.

### 3.5 Kapan dipanggil
| Pemicu | Aksi |
| --- | --- |
| `POST /api/admin/products` | auto-sync (best-effort, warning bila gagal) |
| `PATCH /api/admin/products/:id` | auto-sync bila `paddleProductId` sudah ada |
| `POST /api/admin/products/:id/paddle-sync` | sync manual |
| `POST /api/admin/products/:id/paddle-archive` | archive + nonaktifkan |

> Best-effort: kegagalan sync **tidak** membatalkan penyimpanan produk. Admin bisa sync ulang manual.

---

## 4. Checkout (Server + Client)

### 4.1 Server (`checkout.service.ts`)
1. Validasi produk ada & aktif, dan punya `paddlePriceId` (jika tidak → `400`).
2. Buat `Order` (PENDING) + `OrderItem` (snapshot nama/harga/priceId).
3. `paddle.transactions.create({ items:[{ priceId, quantity:1 }], customData:{ orderId, orderNumber, productId } })`.
4. Simpan `paddleTransactionId`; buat `AccessLink` (TTL `ORDER_ACCESS_TTL_HOURS`); kembalikan `{ orderNumber, transactionId, checkoutUrl, accessToken }`.
5. Gagal → order `FAILED`, throw `PADDLE_ERROR` (502).

### 4.2 Client (`use-checkout.ts` + `lib/paddle.ts`)
1. `POST /checkout` → simpan `orderNumber` ke localStorage (`section_last_order`).
2. `successUrl = <origin>/checkout/success?order=<orderNumber>&access=<accessToken>` (agar halaman sukses langsung terotorisasi setelah bayar).
3. `paddle.Checkout.open({ transactionId, settings:{ displayMode:"overlay", successUrl } })`.
4. Bila Paddle.js gagal dimuat → fallback `window.location.href = checkoutUrl`.

### 4.3 Kenapa pakai `transactionId` (bukan priceId) di client
Server sudah membuat transaksi dengan harga tepercaya, sehingga client hanya membuka transaksi tersebut — mencegah manipulasi harga di sisi klien.

---

## 5. Webhook

### 5.1 Endpoint
`POST /api/webhooks/paddle` — raw JSON body + header `Paddle-Signature`.
Verifikasi: `paddle.webhooks.unmarshal(rawBodyString, PADDLE_WEBHOOK_SECRET, signature)`. Gagal → `400`.

### 5.2 Idempotensi & retry
`beginEvent` menyimpan `eventId` (unique) dengan `status=RECEIVED`. Bila `eventId` sudah ada:
- `PROCESSED` → respons `{ received:true, duplicate:true }` tanpa memproses ulang.
- `FAILED`/`RECEIVED` → diproses ulang (retry dari Paddle aman, fulfillment idempotent).
Sukses → `status=PROCESSED, processedAt`; gagal → `status=FAILED, error, attempts++` dan server membalas **500** agar Paddle retry.

### 5.3 Penanganan event
| eventType | Aksi (`processEvent`) |
| --- | --- |
| `transaction.completed` | **Validasi** payload (status/currency/harga/qty/total) terhadap snapshot order; dalam transaksi DB: order → `PAID` + `paidAt` + Payment `COMPLETED`; lalu `fulfillOrder` menerbitkan `Entitlement` + `DownloadToken` (idempotent). |
| `transaction.payment_failed` | order → `FAILED`, Payment → `FAILED` |
| `transaction.canceled` | order → `CANCELED`, Payment → `CANCELED` |
| `adjustment.created` / `adjustment.updated` | hanya bila `action ∈ {refund, chargeback}` dan `status=approved`: full → `REFUNDED` + cabut entitlement; sebagian → `PARTIALLY_REFUNDED` (+`amountRefunded`). |

Aturan: order `PAID` tidak diturunkan statusnya kecuali `FAILED`/`CANCELED`. Rekonsiliasi berkala (`reconcilePaidOrders`) mengisi entitlement yang bolong.

### 5.4 Resolusi order
`resolveOrder(transactionId, customData)`:
1. `customData.orderId` → `findUnique(Order.id)`.
2. fallback `findUnique(Order.paddleTransactionId)`.

### 5.5 Fulfillment download
`fulfillOrder(orderId)` (idempotent) membuat `Entitlement` per `(orderItem, file)` (unique) lalu `DownloadToken` per entitlement:
- `token` = hex 24 byte, `label` = nama file,
- `expiresAt` = now + `DOWNLOAD_TOKEN_TTL_HOURS`, `maxDownloads` = `DOWNLOAD_MAX_HITS`,
- sumber file ditentukan dari `ProductFile.provider` (Cloudinary → signed URL saat unduh; EXTERNAL/LOKAL → `fileUrl`).

---

## 6. Alur Lengkap (sequence)

```
Admin ──create product──► API ──sync──► Paddle (product+price) ──ids──► DB
Buyer ──click buy───────► API /checkout ──create txn──► Paddle
Buyer ◄──transactionId + checkoutUrl──────────────────────────
Buyer ──Paddle.js open(txn)──► Paddle Checkout (bayar)
Paddle ──webhook transaction.completed──► API
API: Order=PAID, terbitkan DownloadToken
Buyer ──/checkout/success poll──► API status ──► tampil link unduh
Buyer ──GET /api/downloads/:token──► API ──► file PDF
```

---

## 7. Setup Dashboard Paddle (checklist)

1. Buat akun & environment **sandbox** terlebih dahulu.
2. **Developer Tools → Authentication:** ambil API key (server) & client-side token.
3. **Developer Tools → Notifications:** buat webhook ke `https://<api-host>/api/webhooks/paddle`, subscribe minimal `transaction.completed` (+ `payment_failed`, `canceled`, `adjustment.created`). Simpan signing secret → `PADDLE_WEBHOOK_SECRET`.
4. **Catalog:** boleh dibiarkan — product & price akan dibuat otomatis oleh sync.
5. Isi `PADDLE_TAX_CATEGORY` sesuai jenis produk digital (default `standard`; sesuaikan bila perlu).
6. Setelah siap, ganti ke environment **production** + API key/token/webhook secret produksi.

> Ikuti dokumentasi resmi Paddle untuk detail terkini: katalog, transactions API, Paddle.js, dan verifikasi webhook.

---

## 8. Pengujian (Sandbox)

1. Konfigurasi sandbox di server & client (`.env`).
2. Jalankan app; buat niche → produk (upload PDF) → produk otomatis tersinkron (cek kolom Paddle = linked).
3. Buka landing niche, klik beli → Paddle overlay muncul.
4. Bayar dengan **kartu uji Paddle sandbox**.
5. Webhook sandbox memicu order `PAID` → halaman sukses menampilkan link unduh.
6. Verifikasi: `orders` status PAID, `download_tokens` terisi, `webhook_events` mencatat event.
7. Fallback: pastikan webhook dapat menjangkau app (gunakan tunnel bila lokal, mis. untuk mengekspos `localhost:3000`).

---

## 9. Troubleshooting

| Gejala | Kemungkinan sebab |
| --- | --- |
| `400` "Product is not linked to a Paddle price yet" | Produk belum di-sync / tanpa `paddlePriceId` |
| `502 PADDLE_ERROR` | API key salah, produk/price invalid, environment mismatch |
| Order tetap `PENDING` | Webhook tidak terkirim / gagal verifikasi / signature salah |
| Webhook `duplicate:true` | Event sudah pernah diproses (normal) |
| Paddle overlay tidak muncul | `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` kosong / script gagal → fallback ke `checkoutUrl` |
| Token unduh tidak muncul | Produk tidak punya `ProductFile` (tidak ada yang diunduh) |
| Sync berulang membuat product ganda | Koneksi update gagal (kode melakukan create baru + archive lama) |
