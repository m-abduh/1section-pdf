# Architecture — 1section

> Gambaran teknis menyeluruh: struktur repo, tanggung jawab tiap lapisan, alur request, routing multi-subdomain, keamanan, dan model deployment.

---

## 1. Gambaran Sistem

```
            ┌──────────────────────────────┐
            │            Browser            │
            └───────────────┬───────────────┘
                            │ HTTPS
        ┌───────────────────┼────────────────────┐
        │                   │                    │
  1section.com        <slug>.1section.com    admin.1section.com
  (landing utama)     (landing niche)        (dashboard admin)
        │                   │                    │
        └───────────────────┴────────────────────┘
                            │
                  ┌──────────▼──────────┐
                  │  Next.js 16 (app)   │  ← SSR/RSC + ISR + middleware proxy
                  │  App Router          │  ← Route handlers = API (Prisma, auth, webhook)
                  └────┬──────────┬──────┘
                       │          │
               ┌───────▼──┐   ┌───▼──────────────┐
               │PostgreSQL│   │ Cloudinary (PDF) │
               └──────────┘   └──────────────────┘
                       │
                       │ Paddle API (products, prices, transactions)
                       │ Paddle Webhooks ──► POST /api/webhooks/paddle
               ┌───────▼────────┐
               │     Paddle     │  (merchant of record, pajak, checkout)
               └────────────────┘
```

---

## 2. Struktur Repository

Single app Next.js 16 (App Router) di `client/`. Seluruh backend (Prisma, service, route handlers) berada di dalam `client/`. Tidak ada service terpisah.

```
1section/
├── package.json            # single workspace: client
├── package-lock.json
├── prd.md
├── docs/
├── .gitignore
│
└── client/                 # Next.js 16 App Router (full-stack)
    ├── next.config.ts
    ├── tsconfig.json
    ├── prisma/             # schema.prisma, seed.ts, migrations/
    ├── .env / .env.example
    └── src/
        ├── app/            # routes (RSC + client pages) + api/* route handlers
        ├── components/     # ui, site, admin, theme
        ├── hooks/          # react-query wrappers + auth context
        ├── lib/
        │   ├── server/     # Prisma, services, auth, email, paddle, cloudinary, audit, utils
        │   └── ...         # api client, types, formatters, site config, server-api
        └── proxy.ts        # subdomain routing middleware

```

## 3. Lapisan Aplikasi

### 3.1 Client (Next.js)
- **RSC/Server Components** untuk storefront (SEO + ISR). Contoh: `app/page.tsx`, `app/niche/[slug]/page.tsx` memanggil `lib/server-api.ts` (fetch dengan `revalidate`).
- **Client Components** (`"use client"`) untuk interaktivitas: checkout, form admin, dashboard, theme.
- **Config runtime** via `NEXT_PUBLIC_*` (di-inline saat build).
- **Data client** via React Query (cache 30s, retry 1, tanpa refetch on focus).

### 3.2 API (Next.js Route Handlers)
Pola berlapis: `src/app/api/**/route.ts` (HTTP I/O) → `src/lib/server/modules/*/*.service.ts` (logika bisnis + Prisma) → `*.schema.ts` (zod). Tidak ada ORM call langsung di route handler. Middleware auth/rate-limit/validation di `src/lib/server/next-helpers.ts`.

### 3.3 Database
PostgreSQL via Prisma. Single source of truth schema: `client/prisma/schema.prisma`. Lihat `docs/data-model.md`.

### 3.4 File Storage
PDF disimpan di **Cloudinary** sebagai aset privat (`type: authenticated`). Saat pembeli mengunduh, server membangun **signed URL** berumur pendek lalu redirect 302. Metadata storage disimpan pada `ProductFile` (`storageKey`, `resourceType`, `format`, `bytes`, `checksum`, `provider`). Provider `EXTERNAL`/`LOCAL` (dengan `fileUrl`) tetap didukung untuk kompatibilitas. Lihat `docs/operations.md` §8.

---

## 4. Alur Request

### 4.1 Render Storefront (ISR)
```
Browser → Next (RSC) → service langsung (Prisma) → PostgreSQL → JSON
        → HTML (di-cache revalidate 30–60s)
```

### 4.2 Checkout
```
BuyButton → useCheckout.mutate
  → POST /api/checkout (Axios)
     → checkout.controller → checkout.service
        → Prisma: create Order(PENDING) + OrderItem
        → Paddle: transactions.create(customData{orderId,...})
        → Prisma: simpan paddleTransactionId
   → 201 { orderNumber, transactionId, checkoutUrl, accessToken }
   → Paddle.js Checkout.open({ transactionId, successUrl=/checkout/success?order=...&access=... })
   → (pembayaran) → Paddle webhook → order PAID + Payment + fulfillOrder (Entitlement + tokens) + kirim email access link
   → /checkout/success poll /api/orders/:orderNumber/status?access=... (langsung terotorisasi via accessToken)
```

### 4.3 Webhook (data masuk)
```
Paddle → POST /api/webhooks/paddle (raw body + signature)
  → verify signature (paddle.webhooks.unmarshal)
  → beginEvent (idempotensi: eventId unique + status RECEIVED/PROCESSED/FAILED)
  → processEvent → update Order/Payment + fulfillOrder (Entitlement + token) → markProcessed
  → gagal: markFailed + 500 (biar Paddle retry)
  → 200 { received: true }
```

### 4.4 Download
```
Link → GET /api/downloads/:token
  → fulfill/cek token, expiry, kuota (increment atomik via updateMany)
  → Cloudinary: signed URL + redirect 302; lokal: res.download; eksternal: redirect 302
```

---

## 5. Routing Multi-Subdomain

Implementasi: `client/src/proxy.ts` (helper `proxy` + `config.matcher`).

Matcher mengecualikan `api`, `_next/static`, `_next/image`, `favicon.ico`, dan semua path ber-ekstensi file.

Logika:
1. Ekstrak subdomain dari `Host` terhadap suffix `ROOT_DOMAIN`, `localhost`, `lvh.me` (hanya satu level subdomain; host dengan `www` diabaikan).
2. `admin` → rewrite ke `/admin/*`.
3. Subdomain niche (selain `admin`/`www`): path `/` → rewrite ke `/niche/<subdomain>` (landing page niche/subdomain); path lain (`/resources/*`, editorial, legal) disajikan apa adanya.
4. Root domain hanya untuk landing page: `/niche/<slug>` → redirect 308 ke `<slug>.<root>`; `/resources/<slug>` → lookup slug niche via API lalu redirect 308 ke `<slug>.<root>/resources/<slug>`.
5. Selain itu → `NextResponse.next()`.

Konstanta terkait:
- `ROOT_DOMAIN` = `NEXT_PUBLIC_ROOT_DOMAIN` (default `1section.com`).
- `DEV_SUFFIXES` = `["localhost", "lvh.me"]`.

`lib/site.ts` menyediakan helper URL subdomain (protokol otomatis `http` untuk localhost/lvh.me), dikontrol `NEXT_PUBLIC_USE_SUBDOMAINS` + `NEXT_PUBLIC_ROOT_DOMAIN`:
- `nicheUrl(slug)` → `finance.1section.com` (dev `finance.localhost:3000`).
- `resourceUrl(nicheSlug, productSlug)` → `<niche>.1section.com/resources/<product>`.
- `rootUrl()` → root domain (`1section.com`), dipakai untuk logo/breadcrumb "Home" agar selalu kembali ke landing page utama.
- `socialLinks(slug)` → tautan YouTube/Instagram/TikTok dengan handle seragam `@1section.<slug>` (prefix dari `NEXT_PUBLIC_SOCIAL_HANDLE_PREFIX`), mis. `youtube.com/@1section.business`.

Di dev, Next mengizinkan host dev via `allowedDevOrigins` (`*.localhost`, `lvh.me`, `*.lvh.me`, `1section.com`, `*.1section.com`).

---

## 6. Keamanan

| Area | Mekanisme |
| --- | --- |
| Password admin | bcryptjs (cost 10) + kebijakan minimal (8 char, huruf + angka) |
| Sesi | JWT HS256, expiry default `7d`; `AdminUser.tokenVersion` memungkinkan **logout/revoke** (setiap request re-validasi ke DB) |
| Middleware auth | `requireAuth` (Bearer, re-validasi user + tokenVersion) & `requireRole` |
| Validasi input | zod untuk body/query/params (`validate`), + validasi env saat boot |
| Headers | `helmet` (dengan `crossOriginResourcePolicy: cross-origin`) |
| CORS | Whitelist + izinkan root domain & seluruh subdomain; izinkan localhost saat dev |
| Rate limit | `express-rate-limit` pada login, checkout, status order, access-link, download |
| Webhook | Verifikasi `Paddle-Signature` + idempotensi `WebhookEvent` (`RECEIVED`/`PROCESSED`/`FAILED`) + validasi payload vs snapshot order |
| Download | `Entitlement` (ACTIVE/REVOKED) + token acak 24 byte, expiry, batas kuota dengan increment atomik; Cloudinary signed URL |
| Upload | Hanya PDF, maks 50 MB, **cek magic bytes `%PDF-`**, disimpan privat di Cloudinary |
| Error | Pesan generik di produksi; detail zod hanya untuk validasi |
| Audit | `AuditLog` mencatat aksi admin penting |
| Proxy | `trust proxy = 1` (di belakang reverse proxy) |

Catatan: rate limiting in-memory (per-instance); untuk multi-instance produksi gunakan store terdistribusi (mis. Redis). Lihat `prd.md` §kandidat evaluasi.

---

## 7. Konfigurasi & Bootstrapping

- **Server boot:** `config/env.ts` memvalidasi env dengan zod (gagal cepat jika kurang). `index.ts` membuat app, listen, dan menangani `SIGINT`/`SIGTERM` (tutup server + disconnect Prisma).
- **Middleware global berurutan** (`app.ts`):
  1. `helmet`
  2. `cors`
  3. `morgan` (combined di prod, dev di dev)
  4. `/api/webhooks` → `express.raw({ type: "application/json" })` + `webhookRouter` (**sebelum** JSON parser)
  5. `express.json({ limit: "2mb" })` + `urlencoded`
  6. `/api` → `apiRouter`
  7. `notFoundHandler` lalu `errorHandler`
- **Client boot:** `app/layout.tsx` menyuntikkan `themeScript` anti-flash, lalu `Providers` (Theme → QueryClient → Auth).

---

## 8. Tipe & Kontrak

- **Envelope response konsisten:** `{ success, data, pagination? }` / `{ success:false, error:{ code, message, details? } }`.
- **Tipe client** diduplikasi manual di `client/src/lib/types.ts` (belum ada shared package / codegen dari Prisma).
- **Admin auth** via `getAdmin(request)` / `requireAdminSync(admin)` di `client/src/lib/server/next-helpers.ts` (JWT dari `Authorization` header).

---

## 9. Deployment (ringkasan)

- Satu layanan: **Next.js (web + api route handlers)**, plus **PostgreSQL terkelola**.
- Client butuh `NEXT_PUBLIC_*` saat build; server butuh secrets Paddle & JWT.
- Webhook Paddle harus menunjuk ke URL publik `https://<api-host>/api/webhooks/paddle`.
- DNS: wildcard `*.<domain>` harus mengarah ke web agar subdomain niche & admin bekerja.
- Detail lengkap: `docs/operations.md`.

---

## 10. Diagram Dependency (server)

```
routes → controller → service → { prisma, paddle }
                          │
                          ├─ downloads.service (dipakai webhook & orders)
                          └─ paddle-catalog.service (dipakai products.controller)
middlewares: auth(requireAuth) → lib/jwt
             validate → utils/api-error (ApiError)
             error → ApiError + ZodError
```
