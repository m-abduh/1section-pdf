# Server Application — 1Section

> Dokumentasi detail `server/`: bootstrap, middleware, modul, lapisan kode, util, konfigurasi env, dan alur eksekusi internal. Stack: Express 5 + TypeScript + Prisma + Paddle SDK.

---

## 1. Entry Point & Bootstrap

### `src/index.ts`
- Memanggil `createApp()`, `app.listen(env.PORT)`.
- Graceful shutdown pada `SIGINT`/`SIGTERM`: tutup server lalu `prisma.$disconnect()`.
- Error saat start → log + `process.exit(1)`.

### `src/app.ts` — urutan middleware
```
helmet({ crossOriginResourcePolicy: "cross-origin" })
cors(corsOptions)                      // whitelist + subdomain
morgan(prod ? "combined" : "dev")
POST /api/webhooks  → express.raw({ type: "application/json", limit:"1mb" }) → webhookRouter
express.json({ limit: "2mb" })
express.urlencoded({ extended: true })
express.static("/uploads", uploadDir)
/api → apiRouter
notFoundHandler → errorHandler
app.set("trust proxy", 1)
```

**CORS (`isAllowedOrigin`):** izinkan origin tanpa origin (server-to-server), origin yang ada di `CORS_ORIGINS`, hostname `localhost`/`*.localhost`, `ROOT_DOMAIN`, dan semua subdomain `*.ROOT_DOMAIN`. `credentials: true`. Methods GET/POST/PATCH/PUT/DELETE/OPTIONS.

---

## 2. Konfigurasi Env (`src/config/env.ts`)

Validasi zod, gagal cepat saat boot. Export `env`, `corsOrigins` (split `CORS_ORIGINS`), `isProduction`.

| Var | Aturan | Default |
| --- | --- | --- |
| `NODE_ENV` | enum dev/test/prod | `development` |
| `PORT` | int > 0 | `4000` |
| `DATABASE_URL` | wajib | — |
| `CLIENT_URL` | url | `http://localhost:3000` |
| `ROOT_DOMAIN` | string | `1section.com` |
| `CORS_ORIGINS` | string CSV | `http://localhost:3000` |
| `JWT_SECRET` | min 16 | — |
| `JWT_EXPIRES_IN` | string | `7d` |
| `PADDLE_ENV` | sandbox/production | `sandbox` |
| `PADDLE_API_KEY` | wajib | — |
| `PADDLE_WEBHOOK_SECRET` | wajib | — |
| `PADDLE_TAX_CATEGORY` | string | `standard` |
| `DOWNLOAD_TOKEN_TTL_HOURS` | int > 0 | `72` |
| `DOWNLOAD_MAX_HITS` | int > 0 | `5` |

(Seed memakai `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — dibaca langsung di `seed.ts`.)

---

## 3. Lapisan Middleware (`src/middlewares/`)

### `auth.ts` — `requireAuth`
- Ekstrak `Authorization: Bearer <token>`; tidak ada → `401`.
- `verifyAuthToken` → set `req.admin = { id, email, name:null, role }`; gagal → `401`.

### `validate.ts` — `validate({ body, query, params })`
- `safeParse` tiap bagian; gagal → `ApiError.badRequest` dengan `error.flatten()`.
- Menimpa `req.params` & `req.body` dengan hasil parse; `Object.assign(req.query, data)`.

### `error.ts`
- `notFoundHandler` → `ApiError.notFound` dengan method+URL.
- `errorHandler`: `ApiError` → status + envelope; `ZodError` → `400 VALIDATION_ERROR` + flatten; lainnya → `500 INTERNAL_ERROR` (pesan asli hanya di non-produksi).

---

## 4. Library (`src/lib/`)

| File | Isi |
| --- | --- |
| `prisma.ts` | Singleton `PrismaClient` (disimpan di `globalThis` saat non-prod); log `warn,error` dev / `error` prod. |
| `jwt.ts` | `signAuthToken({ sub, email, role })`, `verifyAuthToken` (throw `401` bila invalid/expired). |
| `paddle.ts` | Instance `Paddle(env.PADDLE_API_KEY, { environment })` + `paddleWebhookSecret`. |

---

## 5. Util (`src/utils/`)

| File | Fungsi |
| --- | --- |
| `api-error.ts` | Kelas `ApiError` (statusCode, code, details) + factory `badRequest/unauthorized/forbidden/notFound/conflict`. |
| `ids.ts` | `generateOrderNumber()` → `ORD-YYYYMMDD-NNNNNN`; `generateSecureToken(bytes=24)` → hex acak. |
| `slug.ts` | `slugify()` (lowercase, NFKD, buang diakritik, non-alnum → `-`, rapikan `-`). |

---

## 6. Routing Utama (`src/routes/index.ts`)

```
GET  /api/health
     /api/auth        → authRouter
     /api/niches      → nicheRouter
     /api/products    → productRouter
     /api/checkout    → checkoutRouter
     /api/orders      → orderRouter
     /api/downloads   → downloadRouter
     /api/admin/niches    → adminNicheRouter 🔒
     /api/admin/products  → adminProductRouter 🔒
     /api/admin/orders    → adminOrderRouter 🔒
     /api/admin/uploads   → adminUploadRouter 🔒
     /api/admin/stats     → adminStatsRouter 🔒
webhook terpisah: /api/webhooks/paddle
```

---

## 7. Modul (pola routes → controller → service → schema)

### 7.1 `auth`
- **routes:** `POST /login` (validate body), `GET /me` (requireAuth).
- **service:** `login` (cari user by email lowercase, cek `isActive`, `bcrypt.compare`, sign JWT), `getProfile`, `hashPassword`.
- **schema:** `loginSchema` (email, password).

### 7.2 `niches`
- **routes public:** `GET /`, `GET /:slug`. **admin:** list/create/patch/delete (semua `requireAuth`).
- **service:** `listPublicNiches` (active, hitung produk aktif), `listAdminNiches`, `getNicheBySlug(slug, onlyActive=true)` + produk+files, `createNiche` (slug auto via `slugify`, cek unik), `updateNiche` (partial), `deleteNiche`.
- **schema:** create/update (regex slug, hex accent, dsb.), param slug/id.

### 7.3 `products`
- **routes public:** `GET /?niche=`, `GET /:slug`. **admin:** list/create/patch/delete + `paddle-sync`, `paddle` (get), `paddle-archive`.
- **service:** `listPublicProducts(nicheSlug?)`, `listAdminProducts` (+`_count.orderItems`), `getPublicProductBySlug`, CRUD. `createProduct`/`updateProduct` menyusun `features` & `files`; update `files` = replace-all.
- **controller:** setelah create/update → `syncProductToPaddle` (best-effort, warning bila gagal), refresh & kirim produk.
- **schema:** validasi lengkap (lihat `api-spec.md` §5).

### 7.4 `paddle` (catalog)
`paddle-catalog.service.ts`:
- `syncProductToPaddle(id)`: upsert product + price ke Paddle; simpan `paddleProductId`, `paddlePriceId`, `paddleSyncedAt`; bila update gagal → create baru & archive price lama.
- `getPaddleState(id)`: ambil product & price remote + status linked.
- `archiveProductInPaddle(id)`: archive price & product + set `active=false`.
- Detail di `docs/paddle-integration.md`.

### 7.5 `checkout`
- **routes:** `POST /` (validate body).
- **service:** `createCheckout` — buat Order PENDING + OrderItem, panggil `paddle.transactions.create`, simpan `paddleTransactionId`, kembalikan `checkoutUrl`; gagal → order `FAILED` + `PADDLE_ERROR`.
- **schema:** `{ productId, email? }`.

### 7.6 `orders`
- **routes public:** `GET /:orderNumber/status?email=`. **admin:** `GET /`, `GET /:id`.
- **service:** `getOrderStatus` (validasi email, self-heal terbitkan token bila PAID & belum ada), `listAdminOrders` (filter status/search, paginate), `getAdminOrder`.
- **schema:** param orderNumber/id, query email, filter list (page/pageSize/status/search).

### 7.7 `downloads`
- **routes:** `GET /:token`.
- **service:** `issueDownloadTokensForItem(orderItemId, productId)` (buat token per ProductFile, expiry & maxDownloads dari env), `resolveDownload(token)` (cek ada/expired/kuota, increment count, resolve nama & URL), `resolveLocalFile` (anti path traversal), `uploadDir` (export).
- **controller:** redirect (eksternal) atau `res.download` (lokal, cek `fs.existsSync`).

### 7.8 `webhooks`
- **routes:** `POST /paddle` (raw body + `Paddle-Signature`) → `paddle.webhooks.unmarshal`.
- **service:** `recordWebhookEvent` (idempotensi via `eventId`), `handlePaddleEvent` (switch eventType), `markOrderPaid` (resolve order via customData.orderId atau transactionId, resolve customer email, set PAID + paidAt, terbitkan token), `updateOrderStatus`.
- Lihat `docs/paddle-integration.md` §webhook.

### 7.9 `uploads`
- **routes:** `POST /` (requireAuth) → multer `diskStorage` ke `uploadDir`, nama `<uuid><ext>`, batas 50 MB, filter MIME PDF.
- Response `{ url, size, originalName }`.

### 7.10 `stats`
- **routes:** `GET /` (requireAuth) → `getDashboardStats` (counts + SUM revenue + 5 order terbaru).

---

## 8. Tipe

`src/types/express.d.ts` menambah `Express.Request.admin?: Pick<AdminUser,"id"|"email"|"name"|"role">`.

---

## 9. Alur Eksekusi Penting

### 9.1 Membuat Produk (admin)
```
POST /api/admin/products
 → validate(createProductSchema)
 → product.controller.create
    → product.service.createProduct  (assertNiche, slug, files)
    → syncProductToPaddle (best-effort)
    → getProductById → 201
```

### 9.2 Checkout
```
POST /api/checkout
 → validate(createCheckoutSchema)
 → checkout.service.createCheckout
    → find product (tolak non-aktif / tanpa priceId)
    → create Order(PENDING)+OrderItem
    → paddle.transactions.create(customData)
    → update Order.paddleTransactionId
 → 201 { orderNumber, transactionId, checkoutUrl }
```

### 9.3 Webhook → fulfillment
```
POST /api/webhooks/paddle
 → verify signature
 → recordWebhookEvent (idempotensi)
 → handlePaddleEvent('transaction.completed')
    → markOrderPaid → order PAID + issueDownloadTokensForItem (per item)
 → 200
```

---

## 10. Menjalankan & Skrip

| Script | Perintah |
| --- | --- |
| dev | `tsx watch src/index.ts` |
| build | `tsc -p tsconfig.json` → `dist/` |
| start | `node dist/index.js` |
| typecheck | `tsc --noEmit` |
| prisma | `prisma generate/migrate dev/migrate deploy/studio` |
| seed | `tsx prisma/seed.ts` |

Root menjalankan lewat workspaces (`npm run dev:server`, dsb).

---

## 11. Catatan Teknis

- Upload & file PDF disimpan **lokal** (`server/uploads/`) — lihat `docs/operations.md` untuk pertimbangan produksi (ephemeral filesystem).
- Webhook di-mount **sebelum** `express.json` agar `req.body` tetap `Buffer` untuk verifikasi signature.
- `tsconfig` server: `target ES2022`, `module CommonJS`, `strict`, `noUncheckedIndexedAccess`, `outDir dist`.
