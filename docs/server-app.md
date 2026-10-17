# Server Application — 1section

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
/admin/uploads → multer memoryStorage (di router)
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
| `APP_URL` | url (opsional) | `CLIENT_URL` |
| `DOWNLOAD_SIGNED_URL_TTL_MINUTES` | int > 0 | `10` |
| `ACCESS_LINK_TTL_MINUTES` | int > 0 | `60` |
| `CLOUDINARY_CLOUD_NAME` | string (opsional) | — |
| `CLOUDINARY_API_KEY` | string (opsional) | — |
| `CLOUDINARY_API_SECRET` | string (opsional) | — |
| `CLOUDINARY_FOLDER` | string | `1section/bundles` |
| `EMAIL_PROVIDER` | `resend`/`log` | `log` |
| `RESEND_API_KEY` | string (opsional) | — |
| `EMAIL_FROM` | string | `1section <no-reply@1section.com>` |
| `RATE_LIMIT_DISABLED` | bool (opsional) | `false` |

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
| `jwt.ts` | `signAuthToken({ sub, email, role, tokenVersion })`, `verifyAuthToken` (throw `401` bila invalid/expired). |
| `paddle.ts` | Instance `Paddle(env.PADDLE_API_KEY, { environment })` + `paddleWebhookSecret`. |
| `cloudinary.ts` | Klien Cloudinary (lazy), `isCloudinaryConfigured`, `uploadPrivatePdf(buffer, name)`, `signedDownloadUrl(publicId, opts)`. |
| `email.ts` | `sendAccessLinkEmail({ to, orderNumber, url })` — provider `resend` (via fetch) atau `log` (dev). |
| `audit.ts` | `recordAudit({ actorId, action, entity, entityId, metadata? })` → tulis `AuditLog` (best-effort). |

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
     /api/admin/assets    → adminAssetRouter 🔒
     /api/admin/stats     → adminStatsRouter 🔒
webhook terpisah: /api/webhooks/paddle
```

Semua router admin dilindungi `requireAuth` + `requireRole("ADMIN")`. Rate limit diterapkan pada login, checkout, status order, access-link, dan download.

---

## 7. Modul (pola routes → controller → service → schema)

### 7.1 `auth`
- **routes:** `POST /login` (validate body, rate-limited), `GET /me` (requireAuth), `POST /logout` (requireAuth).
- **service:** `login` (cari user by email lowercase, cek `isActive`, `bcrypt.compare`, sign JWT dengan `tokenVersion`), `getProfile`, `hashPassword`, `logout` (naikkan `tokenVersion` → cabut semua token).
- **middleware:** `requireAuth` memverifikasi JWT lalu **re-validasi ke DB** (user aktif + `tokenVersion` cocok); `requireRole` untuk otorisasi peran.
- **schema:** `loginSchema` (email, password min 8 + huruf + angka).

### 7.2 `niches`
- **routes public:** `GET /`, `GET /:slug`. **admin:** list/create/patch/delete (semua `requireAuth`).
- **service:** `listPublicNiches` (active, hitung produk aktif), `listAdminNiches`, `getNicheBySlug(slug, onlyActive=true)` + produk+files, `createNiche` (slug auto via `slugify`, cek unik), `updateNiche` (partial, termasuk `audience`/`problems`), `deleteNiche`.
- **schema:** create/update (regex slug, hex accent, dsb.), param slug/id.

### 7.3 `products`
- **routes public:** `GET /?niche=`, `GET /:slug`. **admin:** list/create/patch/delete + `paddle-sync`, `paddle` (get), `paddle-archive`.
- **service:** `listPublicProducts(nicheSlug?)`, `listAdminProducts` (+`_count.orderItems`), `getPublicProductBySlug`, CRUD. `createProduct`/`updateProduct` menyusun `features`, `learnings`, & `files`; update `files` = replace-all. Field naratif baru (`audience`, `notFor`, `outcome`, `limitations`, `license`, `sampleUrl`, `level`) ikut divalidasi zod.
- **response publik** memakai `publicProductSelect` → **tidak** mengekspos `paddleProductId`/`paddlePriceId`/`storageKey`/`fileUrl` (file hanya `{ id, name, sortOrder, format }`).
- **controller:** setelah create/update → `syncProductToPaddle` (best-effort, warning bila gagal), refresh & kirim produk; aksi tulis mencatat `AuditLog`.
- **schema:** validasi lengkap (lihat `api-spec.md` §5).

### 7.4 `paddle` (catalog)
`paddle-catalog.service.ts`:
- `syncProductToPaddle(id)`: upsert product + price ke Paddle; simpan `paddleProductId`, `paddlePriceId`, `paddleSyncedAt`; bila update gagal → create baru & archive price lama.
- `getPaddleState(id)`: ambil product & price remote + status linked.
- `archiveProductInPaddle(id)`: archive price & product + set `active=false`.
- Detail di `docs/paddle-integration.md`.

### 7.5 `checkout`
- **routes:** `POST /` (validate body, rate-limited).
- **service:** `createCheckout` — buat Order PENDING + OrderItem (`lineTotal`, `productTitle`) + `Payment` PENDING, panggil `paddle.transactions.create`, simpan `paddleTransactionId`, kembalikan `checkoutUrl`; gagal → order `FAILED` + `PADDLE_ERROR`.
- **schema:** `{ productId, email? }`.

### 7.6 `orders`
- **routes public:** `GET /:orderNumber/status` (bukti akses `access=` atau `email=`, rate-limited), `POST /:orderNumber/access-link` (rate-limited). **admin:** `GET /`, `GET /:id`, `POST /reconcile`.
- **service:** `getOrderStatus` (access-aware: tanpa bukti valid → `authorized:false`, `downloads:[]`; dengan bukti & `PAID` → self-heal `fulfillOrder`), `requestAccessLink` (buat `AccessLink` + kirim email, respons generik anti-enumerasi), `listAdminOrders` (filter status/search, paginate), `getAdminOrder`, `reconcilePaidOrders`.
- **schema:** param orderNumber/id, query access/email, filter list (page/pageSize/status/search).

### 7.7 `downloads`
- **routes:** `GET /:token` (rate-limited).
- **service:** `fulfillOrder(orderId)` (idempotent: buat `Entitlement` per `(orderItem, file)` + `DownloadToken`), `resolveDownload(token)` (cek token/entitlement ACTIVE/expired/kuota, increment **atomik**), resolver sumber file (Cloudinary signed URL / eksternal redirect / lokal stream).
- **controller:** redirect 302 (Cloudinary/eksternal) atau `res.download` (lokal).

### 7.8 `webhooks`
- **routes:** `POST /paddle` (raw body + `Paddle-Signature`) → `paddle.webhooks.unmarshal`.
- **service:** `beginEvent` (idempotensi: `eventId` unique + status `RECEIVED`; `PROCESSED`→skip, `FAILED`→retry), `processEvent` (transaksi DB; `transaction.completed` → validasi payload + order `PAID` + `Payment COMPLETED` + `fulfillOrder`; failed/canceled; `adjustment.*` refund/chargeback), `markProcessed`/`markFailed`, `reconcilePaidOrders`. Logika murni divalidasi unit test di `webhook.logic.ts`/`webhook.logic.test.ts`.
- Lihat `docs/paddle-integration.md` §webhook.

### 7.9 `uploads`
- **routes:** `POST /` (requireAuth) → multer `memoryStorage`, batas 50 MB, filter MIME PDF + **validasi magic bytes `%PDF-`**.
- **service:** `uploadPrivatePdf` ke Cloudinary (`type=authenticated`) → metadata `{ provider, storageKey, resourceType, format, bytes, checksum }`; **upsert `AssetFile`** (by `storageKey`) dan respons menyertakan `assetFileId`; `503 STORAGE_NOT_CONFIGURED` bila Cloudinary belum diatur; aksi dicatat di `AuditLog`.

### 7.9a `assets`
- **routes:** `GET /` (list + `_count.productFiles`), `POST /` (upsert manual by `storageKey`).
- **service:** `listAssetFiles`, `upsertAssetFile` (update metadata + naikkan `version`).

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
 → beginEvent (idempotensi, status RECEIVED)
 → processEvent('transaction.completed')
    → validasi payload vs order
    → order PAID + Payment COMPLETED + fulfillOrder (Entitlement + DownloadToken per item)
 → markProcessed → 200
   (gagal: markFailed + 500 → Paddle retry)
```

---

## 10. Menjalankan & Skrip

| Script | Perintah |
| --- | --- |
| dev | `tsx watch src/index.ts` |
| build | `tsc -p tsconfig.json` → `dist/` |
| start | `node dist/index.js` |
| typecheck | `tsc --noEmit` |
| test | `vitest run` |
| lint | `eslint .` (root) |
| prisma | `prisma generate/migrate dev/migrate deploy/studio` |
| seed | `tsx prisma/seed.ts` |
| reconcile | `tsx src/scripts/reconcile.ts` |

Root menjalankan lewat workspaces (`npm run dev:server`, dsb).

---

## 11. Catatan Teknis

- PDF disimpan di **Cloudinary** (privat) dan diakses via signed URL berumur pendek — lihat `docs/operations.md` §8.
- Webhook di-mount **sebelum** `express.json` agar `req.body` tetap `Buffer` untuk verifikasi signature.
- Test (Vitest + Supertest) ada di `src/**/*.test.ts`; `tsconfig.json` mengecualikan test dari build.
- `tsconfig` server: `target ES2022`, `module CommonJS`, `strict`, `noUncheckedIndexedAccess`, `outDir dist`.
