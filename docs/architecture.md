# Architecture — 1Section

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
                 │  Next.js 16 (client) │  ← SSR/RSC + ISR + middleware proxy
                 │  App Router          │
                 └──────────┬───────────┘
                            │ REST /api/*  (JSON, Axios)
                            │ /uploads/* (rewrite ke server)
                 ┌──────────▼───────────┐
                 │  Express 5 (server)  │  ← REST API, auth, webhook
                 │  Prisma ORM          │
                 └────┬─────────────┬───┘
                      │             │
              ┌───────▼──┐   ┌──────▼──────┐
              │PostgreSQL│   │local uploads│
              └──────────┘   └─────────────┘
                      │
                      │ Paddle API (products, prices, transactions)
                      │ Paddle Webhooks ──► POST /api/webhooks/paddle
              ┌───────▼────────┐
              │     Paddle     │  (merchant of record, pajak, checkout)
              └────────────────┘
```

---

## 2. Struktur Repository

Monorepo **npm workspaces** (`client`, `server`) dijoinkan lewat `concurrently`.

```
1section/
├── package.json            # workspaces + script orkestrasi (dev/build/typecheck/prisma/seed)
├── package-lock.json
├── prd.md                  # PRD utama (index ke docs/)
├── docs/                   # dokumentasi detail (file ini, design-system, api-spec, dst.)
├── .gitignore
│
├── client/                 # Next.js 16 App Router
│   ├── next.config.ts      # allowedDevOrigins, remotePatterns, rewrite /uploads
│   ├── postcss.config.mjs  # @tailwindcss/postcss (satu plugin, tanpa opsi)
│   ├── tsconfig.json       # strict, path alias @/* -> ./src/*
│   ├── next-env.d.ts       # generated Next (jangan diedit)
│   ├── tsconfig.tsbuildinfo# generated incremental build info
│   ├── .gitignore          # node_modules, .next, out, build, .env*, next-env.d.ts, *.tsbuildinfo
│   ├── .env / .env.example
│   └── src/
│       ├── app/            # routes (RSC + client pages)
│       ├── components/     # ui, site, admin, theme
│       ├── hooks/          # react-query wrappers + auth context
│       ├── lib/            # api client, types, formatters, paddle, site config, server-api
│       └── proxy.ts        # subdomain routing middleware
│
└── server/                 # Express + Prisma
    ├── package.json
    ├── tsconfig.json       # CommonJS, outDir dist
    ├── .gitignore          # node_modules, dist, .env*, uploads/* (!.gitkeep), *.log, *.tsbuildinfo
    ├── .env / .env.example
    ├── uploads/            # file PDF tersimpan (gitignored, hanya .gitkeep yang dilacak)
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.ts
    │   └── migrations/     # 3 migration + migration_lock.toml (provider = postgresql)
    └── src/
        ├── index.ts        # bootstrap + graceful shutdown
        ├── app.ts          # express app (middleware global)
        ├── config/env.ts   # validasi env (zod)
        ├── routes/index.ts # mount semua router
        ├── modules/        # per-domain (auth, niches, products, checkout, orders, downloads, webhooks, uploads, stats, paddle)
        ├── middlewares/    # auth, validate, error
        ├── lib/            # prisma, jwt, paddle
        ├── utils/          # api-error, ids, slug
        └── types/          # express.d.ts (Request.admin)
```

### 2.1 Inventaris Artefak & File Pendukung

| Path | Jenis | Peran |
| --- | --- | --- |
| `.gitignore` (root) | config | Abaikan `node_modules`, `dist`, `.next`, `.env*` (kecuali `.env.example`), `server/uploads/*` (kecuali `.gitkeep`), `*.log`, `*.tsbuildinfo` |
| `client/.gitignore`, `server/.gitignore` | config | Aturan ignore per-paket |
| `client/postcss.config.mjs` | config | Satu plugin `@tailwindcss/postcss` |
| `client/next-env.d.ts` | generated | Tipe Next (jangan diedit) |
| `client/tsconfig.tsbuildinfo` | generated | Cache build TypeScript incremental |
| `server/prisma/migrations/migration_lock.toml` | generated | Lock provider Prisma (`postgresql`) |
| `server/uploads/` | data | PDF hasil upload (hanya `.gitkeep` yang dilacak git; saat ini berisi file PDF) |
| `client/.next/`, `server/dist/`, `client/node_modules`+`server/node_modules` | build/deps | Hasil build & dependensi (tidak didokumentasi isinya) |
| `package-lock.json` | lockfile | Dependensi terkunci |

---

## 3. Lapisan Aplikasi

### 3.1 Client (Next.js)
- **RSC/Server Components** untuk storefront (SEO + ISR). Contoh: `app/page.tsx`, `app/niche/[slug]/page.tsx` memanggil `lib/server-api.ts` (fetch dengan `revalidate`).
- **Client Components** (`"use client"`) untuk interaktivitas: checkout, form admin, dashboard, theme.
- **Config runtime** via `NEXT_PUBLIC_*` (di-inline saat build).
- **Data client** via React Query (cache 30s, retry 1, tanpa refetch on focus).

### 3.2 Server (Express)
Pola berlapis per modul: `*.routes.ts` (mapping + middleware) → `*.controller.ts` (HTTP I/O) → `*.service.ts` (logika bisnis + Prisma) → `*.schema.ts` (zod). Tidak ada ORM call langsung di controller.

### 3.3 Database
PostgreSQL via Prisma. Single source of truth schema: `server/prisma/schema.prisma`. Lihat `docs/data-model.md`.

### 3.4 File Storage
PDF disimpan lokal di `server/uploads/` (dibuat multer), di-serve statis oleh Express di `/uploads`. Client me-rewrite `/uploads/*` ke server agar URL relatif konsisten. Lihat `docs/operations.md` (§storage) untuk catatan produksi.

---

## 4. Alur Request

### 4.1 Render Storefront (ISR)
```
Browser → Next (RSC) → fetch `${NEXT_PUBLIC_API_URL}/api/niches`
        → Express → Prisma → PostgreSQL → JSON
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
     → 201 { orderNumber, transactionId, checkoutUrl }
  → Paddle.js Checkout.open({ transactionId, successUrl })
  → (pembayaran) → Paddle webhook → order PAID + download tokens
  → /checkout/success poll /api/orders/:orderNumber/status
```

### 4.3 Webhook (data masuk)
```
Paddle → POST /api/webhooks/paddle (raw body + signature)
  → verify signature (paddle.webhooks.unmarshal)
  → recordWebhookEvent (idempotensi via eventId unique)
  → handlePaddleEvent → update Order + issueDownloadTokensForItem
  → 200 { received: true }
```

### 4.4 Download
```
Link → GET /api/downloads/:token
  → resolveDownload (cek token, expiry, kuota) + increment count
  → lokal: res.download(file); eksternal: redirect 302
```

---

## 5. Routing Multi-Subdomain

Implementasi: `client/src/proxy.ts` (helper `proxy` + `config.matcher`).

Matcher mengecualikan `api`, `_next/static`, `_next/image`, `favicon.ico`, `uploads`, dan semua path ber-ekstensi file.

Logika:
1. Ekstrak subdomain dari `Host` terhadap suffix `ROOT_DOMAIN`, `localhost`, `lvh.me` (hanya satu level subdomain; host dengan `www` diabaikan).
2. `admin` → rewrite ke `/admin/*`.
3. Subdomain lain → rewrite ke `/niche/<subdomain>/*` (kecuali path reserved: `/checkout`, `/admin`, `/api`, `/_next`, `/uploads`).
4. Selain itu → `NextResponse.next()`.

Konstanta terkait:
- `ROOT_DOMAIN` = `NEXT_PUBLIC_ROOT_DOMAIN` (default `1section.com`).
- `DEV_SUFFIXES` = `["localhost", "lvh.me"]`.
- `RESERVED_PREFIXES` = `["/checkout", "/admin", "/api", "/_next", "/uploads"]`.

`lib/site.ts` menyediakan `nicheUrl(slug)` yang menghasilkan URL subdomain di produksi dan path `/niche/<slug>` di dev (dikontrol `NEXT_PUBLIC_USE_SUBDOMAINS`).

Di dev, Next mengizinkan host dev via `allowedDevOrigins` (`*.localhost`, `lvh.me`, `*.lvh.me`, `1section.com`, `*.1section.com`).

---

## 6. Keamanan

| Area | Mekanisme |
| --- | --- |
| Password admin | bcryptjs (cost 10) |
| Sesi | JWT HS256, expiry default `7d`, disimpan di localStorage client |
| Middleware auth | `requireAuth` membaca `Authorization: Bearer`, set `req.admin` |
| Validasi input | zod untuk body/query/params (`validate`), + validasi env saat boot |
| Headers | `helmet` (dengan `crossOriginResourcePolicy: cross-origin`) |
| CORS | Whitelist + izinkan root domain & seluruh subdomain; izinkan localhost saat dev |
| Webhook | Verifikasi `Paddle-Signature` + idempotensi `WebhookEvent.eventId` |
| Download | Token acak 24 byte, expiry (`DOWNLOAD_TOKEN_TTL_HOURS`), batas `DOWNLOAD_MAX_HITS`; proteksi path traversal di `resolveLocalFile` |
| Upload | Hanya `application/pdf`, maks 50 MB, nama file di-random UUID |
| Error | Pesan generik di produksi; detail zod hanya untuk validasi |
| Proxy | `trust proxy = 1` (di belakang reverse proxy) |

Catatan: rate limiting belum ada. Lihat `prd.md` §kandidat evaluasi.

---

## 7. Konfigurasi & Bootstrapping

- **Server boot:** `config/env.ts` memvalidasi env dengan zod (gagal cepat jika kurang). `index.ts` membuat app, listen, dan menangani `SIGINT`/`SIGTERM` (tutup server + disconnect Prisma).
- **Middleware global berurutan** (`app.ts`):
  1. `helmet`
  2. `cors`
  3. `morgan` (combined di prod, dev di dev)
  4. `/api/webhooks` → `express.raw({ type: "application/json" })` + `webhookRouter` (**sebelum** JSON parser)
  5. `express.json({ limit: "2mb" })` + `urlencoded`
  6. `express.static('/uploads')`
  7. `/api` → `apiRouter`
  8. `notFoundHandler` lalu `errorHandler`
- **Client boot:** `app/layout.tsx` menyuntikkan `themeScript` anti-flash, lalu `Providers` (Theme → QueryClient → Auth).

---

## 8. Tipe & Kontrak

- **Envelope response konsisten:** `{ success, data, pagination? }` / `{ success:false, error:{ code, message, details? } }`.
- **Tipe client** diduplikasi manual di `client/src/lib/types.ts` (belum ada shared package / codegen dari Prisma).
- **`req.admin`** dideklarasikan di `server/src/types/express.d.ts`.

---

## 9. Deployment (ringkasan)

- Dua layanan: **web (Next)** dan **api (Express)**, plus **PostgreSQL terkelola**.
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
