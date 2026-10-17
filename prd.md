# PRD — 1Section

> **Product Requirements Document** ditulis ulang secara menyeluruh berdasarkan kondisi **aktual kode** di repository. Dokumen ini menjadi indeks utama; detail teknis dipisah ke `docs/`.
>
> Konteks asli (dari catatan awal): landing page terintegrasi pembayaran **Paddle.com**, di bawahnya menjual **bundle PDF per niche**, dengan domain utama `1section.com` dan subdomain per niche (`finance.1section.com`, `business.1section.com`, dst.) serta admin di `admin.1section.com`. Stack yang diminta: Next.js + Tailwind + TypeScript + Axios + React Query + react-hook-form + Express + CORS, scalable, mudah dimaintain, clean-code.

---

## 0. Peta Dokumentasi

| Dokumen | Isi |
| --- | --- |
| `prd.md` (ini) | PRD master: visi, scope, kebutuhan fungsional/non-fungsional, user stories, kriteria terima, roadmap |
| [`docs/architecture.md`](docs/architecture.md) | Arsitektur sistem, struktur repo, alur request, routing subdomain, keamanan |
| [`docs/design-system.md`](docs/design-system.md) | Design token, tema, motion, inventaris komponen UI, layout |
| [`docs/data-model.md`](docs/data-model.md) | Skema Prisma, relasi, index, migrasi, seed |
| [`docs/api-spec.md`](docs/api-spec.md) | Referensi REST API lengkap (request/response/error) |
| [`docs/client-app.md`](docs/client-app.md) | Detail aplikasi Next.js (routing, halaman, komponen, hooks, lib) |
| [`docs/server-app.md`](docs/server-app.md) | Detail API Express (modul, middleware, util, alur eksekusi) |
| [`docs/paddle-integration.md`](docs/paddle-integration.md) | Integrasi Paddle (katalog, checkout, webhook, pengujian) |
| [`docs/operations.md`](docs/operations.md) | Setup, env, skrip, DNS/subdomain, deployment, storage |

---

## 1. Ringkasan Produk

**1Section** adalah platform penjualan **bundle PDF per-niche** dengan model **sekali beli (one-time purchase)**. Setiap niche memiliki landing page sendiri (via subdomain), dan setiap produk adalah kumpulan file PDF yang otomatis dapat diunduh pembeli setelah pembayaran terkonfirmasi melalui **Paddle** (merchant of record).

- Domain utama: **`1section.com`**
- Subdomain niche: **`<slug>.1section.com`**
- Admin: **`admin.1section.com`**

**Value proposition:** pilih niche → bayar sekali dengan Paddle → unduh PDF langsung. Tanpa langganan, tanpa akun pembeli yang rumit.

---

## 2. Latar Belakang & Masalah

- Penjual produk digital sering perlu banyak *landing page* per topik, tetapi membangun & memelihara satu per satu mahal.
- Pembayaran digital lintas negara rumit dari sisi **pajak (VAT/sales tax)** dan kepatuhan.
- Pengiriman produk digital harus **instan, aman, dan terlacak** (mencegah link tersebar).

**Solusi 1Section:**
- Satu codebase multi-niche dengan subdomain dinamis.
- Paddle menangani pembayaran + pajak (merchant of record).
- Sistem **download token** berbatas waktu & kuota untuk distribusi file yang terkendali.

---

## 3. Tujuan & Metrik Keberhasilan

**Tujuan produk**
- Menjual bundle PDF multi-niche dari satu platform.
- Menambah niche/produk baru tanpa perubahan kode.
- Pembayaran patuh pajak via Paddle.
- Pengiriman file instan & aman.

**Metrik (disarankan, belum diinstrumentasi)**
- Konversi kunjungan niche → pembelian.
- Rasio order `PAID` vs `PENDING` yang menggantung.
- Waktu dari pembayaran → link unduh tampil.
- Tingkat penyelesaian unduhan (download selesai vs token tak terpakai).

---

## 4. Persona & Peran

| Peran | Deskripsi | Kebutuhan utama |
| --- | --- | --- |
| **Pembeli (buyer)** | Pengunjung yang ingin membeli bundle | Landing jelas, checkout cepat & aman, unduh instan |
| **Admin** | Operator yang mengelola katalog & pesanan | CRUD niche/produk, upload PDF, lihat order & statistik |
| **Pemilik bisnis** | Pemilik `1section.com` | Sesuaikan niche, pantau revenue |

> `role` didukung di backend dengan middleware `requireRole` (mis. `ADMIN`); UI multi-admin/role granular belum ada.

---

## 5. Ruang Lingkup

### 5.1 Dalam ruang lingkup (sudah diimplementasikan)
- Landing utama + landing per-niche (subdomain).
- Checkout **one-time** via Paddle (overlay) untuk **satu produk per transaksi**.
- Webhook Paddle (tervalidasi & idempotent) → order `PAID` + `Payment` → menerbitkan `Entitlement` + download token per file.
- Halaman sukses dengan polling status (bukti akses) & link unduh.
- Endpoint unduh berbatas waktu (default 72 jam) & kuota (default 5x per file, increment atomik).
- Pemulihan akses via **magic-link email**.
- Storage PDF **Cloudinary privat** dengan signed URL berumur pendek.
- Rate limiting endpoint sensitif; revokasi sesi admin; audit log; role (`requireRole`).
- Refund penuh/sebagian (`REFUNDED`/`PARTIALLY_REFUNDED`) + pencabutan entitlement.
- Dashboard admin: auth, statistik, CRUD niche, CRUD produk (multi-PDF upload), sync/arsip Paddle, daftar/filter/detail order, rekonsiliasi.
- Auto-sync katalog produk ke Paddle.
- Test otomatis (Vitest + Supertest) & CI GitHub Actions.
- Tema light/dark, desain monokrom "cinematic".

### 5.2 Di luar ruang lingkup (belum)
- Subscription / recurring billing.
- Keranjang multi-item (checkout 1 item per transaksi).
- Akun/login pembeli penuh (akses masih via order number + bukti email/magic-link).
- Manajemen admin multi-user dengan UI role granular (role didukung di backend).
- Rate limit store terdistribusi (saat ini in-memory per-instance).

---

## 6. Alur Pengguna Utama

### 6.1 Pembeli membeli bundle
```
Buka 1section.com → pilih niche → buka <slug>.1section.com
 → pilih bundle → klik "Buy once, download instantly"
 → POST /api/checkout → Paddle overlay checkout
 → bayar → webhook transaction.completed → order PAID + download token
 → halaman /checkout/success menampilkan link unduh
 → unduh PDF (maks N kali, sebelum kedaluwarsa)
```

### 6.2 Pembeli mengambil ulang pembelian
```
Buka /checkout/success → masukkan nomor order (atau ?order= / localStorage)
 → minta magic-link ke email (POST /orders/:orderNumber/access-link)
 → buka tautan (?order=...&access=...) → status & link unduh (bila authorized & PAID)
```

### 6.3 Admin menyiapkan katalog
```
Login admin.1section.com
 → buat Niche (nama, slug, tagline, warna)
 → buat Product di niche (nama, harga, fitur, upload PDF)
 → produk otomatis tersinkron ke Paddle (product + price)
 → (opsional) Sync manual / Archive
```

### 6.4 Admin memantau penjualan
```
Dashboard (revenue, order) → Orders (filter status, cari, paginate) → detail item
```

---

## 7. Kebutuhan Fungsional (FR)

### 7.1 Katalog & Landing Page
- **FR-1** Menampilkan daftar niche aktif di landing utama (prioritas `featured`).
- **FR-2** Setiap niche aktif dapat diakses lewat subdomain `<slug>` (`finance.1section.com`; dev `finance.localhost:3000`); fallback path `/niche/<slug>` hanya bila `NEXT_PUBLIC_USE_SUBDOMAINS=false`.
- **FR-3** Landing niche menampilkan nama, tagline, deskripsi, dan produk aktif.
- **FR-4** Setiap produk menampilkan harga (format mata uang), harga pembanding (opsional, dicoret), daftar fitur, jumlah PDF, dan tombol beli.
- **FR-5** Konten storefront di-cache (ISR 30–60s) untuk performa & SEO.

### 7.2 Checkout & Pembayaran
- **FR-6** Membuat order lokal (`PENDING`) dan transaksi Paddle saat tombol beli diklik.
- **FR-7** Membuka Paddle overlay dengan `transactionId` tepercaya dari server.
- **FR-8** Menolak checkout bila produk non-aktif atau belum tertaut harga Paddle.
- **FR-9** Fallback redirect ke `checkoutUrl` bila Paddle.js gagal dimuat.
- **FR-10** Menyimpan nomor order terakhir di browser untuk pemulihan.

### 7.3 Fulfillment & Unduhan
- **FR-11** Webhook `transaction.completed` (tervalidasi terhadap order) menandai order `PAID`, mencatat `Payment`, dan menerbitkan `Entitlement` + download token per file (idempotent).
- **FR-12** Halaman sukses mem-poll status order (tiap 3s) sampai `PAID` (dengan bukti akses).
- **FR-13** Link unduh per file dengan sisa kuota; token kedaluwarsa (TTL) dan berbatas unduh (increment atomik).
- **FR-14** Endpoint unduh memvalidasi token, entitlement, expiry, kuota, lalu mengalihkan ke signed URL Cloudinary.
- **FR-15** Mendukung file Cloudinary (privat, signed URL), lokal (`/uploads`) maupun URL eksternal (redirect) untuk kompatibilitas; `/uploads` tidak lagi disajikan publik.
- **FR-15b** Pemulihan akses via magic-link email (`POST /orders/:orderNumber/access-link`) dengan rate limit.

### 7.4 Admin
- **FR-16** Login admin (email/password, bcrypt) → JWT + `tokenVersion`; logout mencabut sesi; rate limit login.
- **FR-17** Guard route admin (redirect ke login bila belum auth) + `requireRole`.
- **FR-18** CRUD niche (aktif/featured/sortOrder, warna aksen, slug otomatis).
- **FR-19** CRUD produk + upload banyak PDF (maks 50 file, 50 MB/file, hanya PDF + magic bytes) ke Cloudinary privat.
- **FR-20** Auto-sync produk & harga ke Paddle saat create/update.
- **FR-21** Aksi manual: Sync to Paddle, cek state Paddle, Archive (nonaktifkan).
- **FR-22** Dashboard statistik (revenue, paid/total order, jumlah niche/produk, order terbaru).
- **FR-23** Daftar order dengan filter status, pencarian (nomor/email), pagination, detail item, dan rekonsiliasi entitlement.
- **FR-23b** Audit log (`AuditLog`) untuk aksi admin penting (login, upload, ubah harga, refund, dll.).

### 7.5 Integrasi Paddle
- **FR-24** Sinkronisasi product+price (pemetaan field & customData) dan simpan id-nya.
- **FR-25** Verifikasi signature webhook + idempotensi via `eventId` + status (`RECEIVED`/`PROCESSED`/`FAILED`) + validasi detail transaksi.
- **FR-26** Dukungan sandbox/production via env.

### 7.6 Data & Operasional
- **FR-27** Seed idempotent untuk admin + 4 niche + 4 produk contoh.
- **FR-28** Validasi env saat boot (gagal cepat).
- **FR-29** Envelope response API konsisten; error terstruktur.

---

## 8. Kebutuhan Non-Fungsional (NFR)

| Aspek | Target/Keadaan saat ini |
| --- | --- |
| **Scalability** | Stateless API + Postgres; subdomain dinamis dari data; cache ISR |
| **Maintainability** | Struktur modular (routes→controller→service→schema), TypeScript strict, util bersama |
| **Security** | bcrypt, JWT + revokasi (`tokenVersion`), helmet, CORS whitelist, validasi zod, signature & validasi webhook, entitlement + token unduh acak, rate limiting, audit log, magic bytes upload |
| **Performance** | ISR storefront; React Query cache; PDF via Cloudinary (signed URL) |
| **A11y** | aria-label, focus-visible, `prefers-reduced-motion` |
| **SEO** | RSC + metadata per niche; `metadataBase` |
| **Observability** | morgan logging, tabel `webhook_events` (status/attempts), `AuditLog`, health endpoint |
| **Portability** | Env-driven; storage terabstraksi via `StorageProvider` (Cloudinary/lokal/eksternal) |
| **Testing** | ✅ Vitest + Supertest (unit webhook logic + smoke API); CI GitHub Actions |

---

## 9. Model Data (ringkas)

Tabel utama: `admin_users`, `niches`, `products`, `product_files`, `orders`, `order_items`, `payments`, `entitlements`, `download_tokens`, `access_links`, `webhook_events`, `audit_logs`, `settings`.
Relasi kunci: Niche 1—∞ Product 1—∞ ProductFile; Order 1—∞ OrderItem 1—∞ (Entitlement → DownloadToken); Order 1—∞ Payment.
Status order: `PENDING`, `PAID`, `FAILED`, `CANCELED`, `REFUNDED`, `PARTIALLY_REFUNDED`. Harga = integer cent (USD default).
Detail: [`docs/data-model.md`](docs/data-model.md).

---

## 10. Arsitektur (ringkas)

Monorepo npm workspaces: **client** (Next.js 16 App Router, RSC+ISR) + **server** (Express 5 + Prisma + Paddle SDK) + **PostgreSQL**. Routing subdomain via middleware Next. Webhook Paddle memicu fulfillment. Detail: [`docs/architecture.md`](docs/architecture.md).

---

## 11. Spesifikasi API (ringkas)

Base `/api`. Envelope `{ success, data, pagination? }`. Endpoint publik: health, niche, produk, checkout, status order, access-link, download, webhook. Endpoint admin (🔒 JWT): auth, niches, products (+paddle-sync/archive), orders (+reconcile), uploads, stats. Detail lengkap: [`docs/api-spec.md`](docs/api-spec.md).

---

## 12. Integrasi Paddle (ringkas)

- **Katalog:** auto-sync product+price; id disimpan (`paddleProductId`, `paddlePriceId`, `paddleSyncedAt`).
- **Checkout:** order lokal + `transactions.create` dengan `customData`.
- **Webhook:** `transaction.completed`→PAID (+validasi & Payment), `payment_failed`→FAILED, `canceled`→CANCELED, `adjustment.*`→REFUNDED/PARTIALLY_REFUNDED; idempotent + retry.
- **Fulfillment:** terbitkan `Entitlement` + download token per file (idempotent).
Detail: [`docs/paddle-integration.md`](docs/paddle-integration.md).

---

## 13. Desain (ringkas)

Tema monokrom "cinematic" (grid, spotlight, noise, teks gradien), token warna CSS var untuk light/dark, animasi `fade-up/fade-in/rise`, komponen UI (Button/Input/Field/Badge/Spinner), komponen site (header/footer/cards/buy button), komponen admin (shell/guard/modal/forms/stat). Detail: [`docs/design-system.md`](docs/design-system.md).

---

## 14. User Stories & Kriteria Terima

| # | Sebagai | Saya ingin | Supaya | Kriteria terima |
| --- | --- | --- | --- | --- |
| US-1 | Pembeli | menjelajah niche | menemukan bundle | Landing menampilkan kartu niche; klik membuka subdomain niche |
| US-2 | Pembeli | membeli sekali | mendapat PDF | Klik beli → Paddle overlay → setelah bayar order `PAID` & link muncul |
| US-3 | Pembeli | mengunduh ulang | akses di lain waktu | `/checkout/success` + nomor order → minta magic-link email → buka tautan akses menampilkan link unduh |
| US-4 | Admin | menambah niche | landing baru | Create niche → `<slug>.1section.com` melayani landing |
| US-5 | Admin | menjual produk | dapat dibeli | Create produk + upload PDF → sinkron Paddle → tampil di landing |
| US-6 | Admin | memantau order | mengelola penjualan | Daftar order dengan filter/pencarian/pagination + detail |
| US-7 | Admin | melihat performa | mengambil keputusan | Dashboard menampilkan revenue & statistik |

---

## 15. Status Implementasi

| Area | Status |
| --- | --- |
| Landing utama & niche (subdomain) | ✅ Selesai |
| Checkout Paddle (overlay) | ✅ Selesai |
| Webhook + Payment + Entitlement + download token | ✅ Selesai (hardened) |
| Hardening keamanan (rate limit, tokenVersion, audit, validasi webhook) | ✅ Selesai |
| Storage PDF Cloudinary + signed URL | ✅ Selesai |
| Magic-link akses + email | ✅ Selesai |
| Refund (penuh/sebagian) + pencabutan entitlement | ✅ Selesai |
| Admin auth + dashboard | ✅ Selesai |
| Admin CRUD niche | ✅ Selesai (accentColor diperbaiki) |
| Admin CRUD produk + upload PDF + sync Paddle | ✅ Selesai |
| Admin order (list/filter/detail/reconcile) | ✅ Selesai |
| Test otomatis + CI | ✅ Selesai |
| Migrasi data lama (verifikasi runtime dengan kredensial nyata) | ⏳ Perlu verifikasi manual |

---

## 16. Kandidat Evaluasi & Roadmap

### 16.1 Perbaikan akurasi/temuan (status)
- **`NicheForm` tidak mengirim `accentColor`** → ✅ diperbaiki.
- **`heroImage` niche** tidak dirender → ⏳ masih terbuka (rendering opsional).
- **Seed tidak membuat `ProductFile`** → ⏳ masih terbuka (produk contoh tanpa unduhan sampai PDF diunggah).
- **Konten UI campur bahasa** → ⏳ sebagian masih terbuka.
- **Webhook lambat/gagal** membuat order tertahan `PENDING` → ✅ ada `reconcilePaidOrders` + `POST /admin/orders/reconcile` + script `reconcile`.

### 16.2 Roadmap
1. **Email transaksional** ✅ magic-link akses (Resend); email konfirmasi pembelian opsional.
2. **Customer self-service** ✅ via magic-link; login penuh & riwayat masih terbuka.
3. **Keranjang/multi-item** checkout.
4. **Multi-admin & role granular** (`requireRole` sudah ada; UI/otorisasi granular terbuka).
5. **Rate limiting** ✅ (login/checkout/status/access-link/download); store terdistribusi (Redis) terbuka.
6. **Object storage** ✅ Cloudinary + signed URL (S3/R2 sebagai alternatif).
7. **Rekonsiliasi order** ✅ endpoint + script.
8. **Testing otomatis** ✅ unit webhook logic + smoke API + CI; e2e checkout sandbox terbuka.
9. **Pemanfaatan tabel `Setting`** untuk konfigurasi dinamis (mis. TTL/kuota dari admin).
10. **SEO lanjutan**: sitemap, OG image per niche, halaman 404 kustom.
11. **Shared types package / codegen** untuk menghapus duplikasi tipe client-server.

---

## 17. Asumsi & Pertanyaan Terbuka

**Asumsi**
- Setiap niche = satu subdomain; satu produk = satu bundle PDF.
- Satu transaksi = satu produk (kuantitas 1).
- Paddle adalah satu-satunya payment method.

**Pertanyaan untuk evaluasi**
- Provider email final (saat ini Resend, fallback log)?
- TTL ideal signed URL Cloudinary & access-link (kini 10 & 60 menit)?
- Perlu login pembeli penuh, atau nomor order + magic-link sudah cukup?
- Kebijakan akses saat refund sebagian (kini entitlement tetap; refund penuh mencabut)?
- Dukungan multi-mata uang selain USD?
- Batas kuota unduh & TTL token (kini 5x / 72 jam)?
- Apakah perlu email otomatis, dan lewat kanal apa?
