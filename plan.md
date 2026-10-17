# Rencana Perbaikan 1Section — Tahap 0 + 1

> Hasil tindak lanjut audit teknis. Dokumen ini adalah rencana eksekusi (bukan hasil).  
> Keputusan pemilik produk: **cakupan Tahap 0 + 1**, **storage PDF via Cloudinary**, **pemulihan akses via magic-link email**, dan **test + CI lengkap**.
>
> **Status: ✅ Telah diimplementasikan.** Rencana ini sudah dieksekusi; keadaan akhir didokumentasikan di `prd.md` dan `docs/` (lihat `docs/data-model.md`, `docs/api-spec.md`, `docs/operations.md`). Dokumen ini disimpan sebagai catatan rencana.

---

## 1. Ringkasan & Keputusan

| Topik | Keputusan |
| --- | --- |
| Cakupan iterasi | Tahap 0 (penutup celah) + Tahap 1 (transaksi, auth, upload) |
| Storage file berbayar | Cloudinary (delivery `authenticated`, signed URL berumur pendek) |
| Pemulihan akses pembeli | Magic-link email (tautan akses sekali pakai) |
| Kualitas | Test otomatis (unit + integrasi + e2e smoke) dan pipeline CI lengkap |

**Prinsip:** backend adalah satu-satunya sumber kebenaran status order; file berbayar tidak pernah dapat diakses tanpa entitlement; fulfillment harus idempotent dan dapat dipulihkan; jangan menambah infrastruktur berlebihan (cukup 1 API stateless + PostgreSQL + Cloudinary + worker sederhana).

---

## 2. Temuan yang Ditangani (rujukan kode)

| ID | Severity | Temuan | Lokasi |
| --- | --- | --- | --- |
| F1 | P0 | `/uploads` disajikan publik + `fileUrl` bocor di endpoint publik | `server/src/app.ts:56`, `product.service.ts:7-10`, `niche.service.ts:25-34` |
| F2 | P0 | Webhook dicatat sebelum fulfillment; error DB dianggap duplikat | `webhook.routes.ts:38-44`, `webhook.service.ts:128-141` |
| F3 | P0 | Fulfillment tidak transaksional; early-return saat PAID menghalangi perbaikan | `webhook.service.ts:50-90` |
| F4 | P0 | Tidak ada validasi detail transaksi Paddle vs order lokal | `webhook.service.ts:50-90` |
| F5 | P1 | Status order bocor: cukup nomor order tanpa email | `order.service.ts:47-49` |
| F6 | P1 | Race condition kuota unduh | `download.service.ts:47-82` |
| F7 | P1 | JWT admin tidak divalidasi ulang ke DB; tanpa cek role | `middlewares/auth.ts:13-27` |
| F8 | P1 | Tidak ada rate limiting (login/checkout/status/download) | global |
| F9 | P1 | Refund asal ubah status; abaikan jumlah/jenis/status adjustment | `webhook.service.ts:120-122` |
| F10 | P1 | Upload hanya cek MIME request (tanpa magic bytes/ekstensi/jumlah) | `upload.routes.ts:20-27` |
| F11 | P2 | Tidak ada audit log aksi admin | global |
| F12 | P2 | Secret Paddle berpotensi terpapar di riwayat git | `.env` (perlu rotasi) |

---

## 3. Perubahan Arsitektur

### 3.1 Storage: Cloudinary
- Upload PDF ke Cloudinary dengan `resource_type: "image"` dan `type: "authenticated"` (PDF berada di resource type image pada Cloudinary).
- File tidak memiliki URL publik tetap; URL dibuat saat unduh memakai signed URL berumur pendek.
- `ProductFile` menyimpan referensi, bukan URL publik.
- Folder/asset disimpan di `CLOUDINARY_FOLDER` (mis. `1section/bundles`).
- Alur: admin upload -> server `upload_stream` ke Cloudinary -> simpan `publicId`, `bytes`, `format`, `checksum`.
- Unduh: `download.controller` memverifikasi token lalu `res.redirect` ke signed URL (atau stream) dengan masa berlaku pendek.

### 3.2 Pemulihan akses: Magic-link email
- Endpoint `POST /api/orders/:orderNumber/access-link` (rate-limited) memverifikasi email cocok dengan order, membuat `AccessLink` (token acak, TTL), lalu mengirim email berisi tautan aman.
- Halaman sukses: bila belum punya tautan akses, tampilkan form "kirim tautan ke email"; setelah klik tautan, tampilkan unduhan.
- Status order (`GET /api/orders/:orderNumber/status`) hanya menampilkan token unduhan bila disertai bukti akses valid (access token) atau email cocok dengan rate limit.

### 3.3 Webhook: idempotent & dapat dipulihkan
- `WebhookEvent` diberi status (`RECEIVED`/`PROCESSED`/`FAILED`), `attempts`, `error`, `updatedAt`.
- Event baru -> status `RECEIVED`. Duplikat `PROCESSED` -> skip. Duplikat `FAILED` -> coba ulang.
- Fulfillment dibungkus transaksi DB; hanya `PROCESSED` setelah semua entitlement terbit.
- `ensureEntitlements(orderId)` idempotent (mengisi token/entitlement yang belum ada), dipanggil juga oleh rekonsiliasi.

---

## 4. Perubahan Data Model (Prisma)

1. **WebhookEvent**: tambah `status` (enum `WebhookStatus`), `attempts Int @default(0)`, `error String?`, ubah `processedAt` menjadi `receivedAt` + `processedAt DateTime?`.
2. **AdminUser**: tambah `tokenVersion Int @default(0)` (untuk pencabutan sesi).
3. **ProductFile**: tambah `provider` (enum `StorageProvider`: `CLOUDINARY`/`LOCAL`/`EXTERNAL`), `storageKey String?` (publicId Cloudinary), `resourceType String?`, `bytes Int?`, `format String?`, `checksum String?`. `fileUrl` dipertahankan untuk EXTERNAL/legacy.
4. **AccessLink** (baru): `id`, `token` (unique), `orderId`, `email`, `expiresAt`, `usedAt?`, `createdAt`.
5. **Entitlement** (baru): `id`, `orderId`, `orderItemId`, `productId`, `fileId`, `status`, `grantedAt` — sumber hak akses yang bisa diterbitkan ulang tanpa order baru.
6. **AuditLog** (baru): `id`, `adminId`, `action`, `entity`, `entityId`, `metadata Json`, `ip`, `createdAt`.

Migrasi dibuat bertahap (satu migrasi per perubahan logis) dan diuji pada salinan DB.

---

## 5. Environment Baru

**Server**
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=1section/bundles
APP_URL=https://1section.com          # untuk membentuk tautan di email
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM="1Section <no-reply@1section.com>"
ACCESS_LINK_TTL_MINUTES=60
RATE_LIMIT_* (opsional: tuning)
```

**Client**
```
NEXT_PUBLIC_API_URL (tetap)
# tidak ada secret di client
```

Catatan: nilai contoh di `.env` saat ini harus dirotasi (F12) karena pernah tersimpan di disk.

---

## 6. Rincian Tugas

### Tahap 0 — Penutup Celah (blocker produksi)

**T0.1 Cloudinary storage (F1)**
- Tambah dep `cloudinary`; buat `server/src/lib/cloudinary.ts`.
- `uploads/upload.routes.ts`: ganti disk storage -> `multer.memoryStorage()`, stream ke Cloudinary (`type: authenticated`), balikan `{ publicId, bytes, format, resourceType }` (bukan URL publik).
- `product.service.ts`: simpan metadata storage ke `ProductFile`.
- `product-form.tsx`: sesuaikan pemetaan hasil upload ke `ProductFileInput` (nama + referensi storage).
- Wisata: migrasi file lama di `server/uploads/` (opsional script sekali jalan).

**T0.2 Tutup akses publik file (F1)**
- Hapus `app.use("/uploads", express.static(...))` (`app.ts:56`).
- Hapus `fileUrl` dari `publicInclude` (`product.service.ts:7-10`) dan dari `getNicheBySlug` (`niche.service.ts`) -> kirim hanya `label`, `format`, jumlah file.
- Hapus rewrite `/uploads` di `next.config.ts` bila tak lagi dipakai.
- Pastikan endpoint unduh (`download.controller.ts`) menjadi satu-satunya jalur, kini mengarahkan ke signed URL Cloudinary.

**T0.3 Webhook idempotent + transaksional (F2, F3)**
- Ubah `recordWebhookEvent` -> `beginEvent` (insert `RECEIVED`; duplicate hanya bila event ada) dan TIDAK menelan error DB sebagai duplicate.
- `handlePaddleEvent`: bungkus perubahan order + `ensureEntitlements` dalam `prisma.$transaction`; set `PROCESSED` setelah sukses; `FAILED` + `error` saat gagal; lempar error agar Paddle mengirim ulang.
- Hapus early-return "sudah PAID tanpa memastikan token"; ganti dengan `ensureEntitlements`.
- Tambah job/endpoint rekonsiliasi: order `PAID` tanpa entitlement lengkap -> terbitkan ulang.

**T0.4 Validasi transaksi Paddle (F4)**
- Sebelum fulfillment: `paddle.transactions.get(transactionId)`; cocokkan `status === "completed"`, item `priceId` + `quantity`, `currencyCode`, dan total terhadap snapshot `OrderItem`. Tolak/flag bila tidak cocok.

**T0.5 Pemulihan akses order (F5)**
- Wajib bukti akses: email cocok + rate limit, atau `AccessLink` valid.
- Respons generik (tidak membocorkan keberadaan order).
- Halaman sukses: form permintaan magic-link (bagian T1.6).

**T0.6 Kuota unduh atomik (F6)**
- Ganti baca-cek-tulis menjadi conditional `updateMany` dengan `where: { id, downloadCount: { lt: maxDownloads } }`, lalu `count === 0` -> tolak; cek `expiresAt` sebelum update.
- Uji request paralel (race) di test suite.

### Tahap 1 — Transaksi, Auth, Upload

**T1.1 Rate limiting (F8)**
- Tambah `express-rate-limit`; pasang pada `auth/login`, `orders/:orderNumber/status`, `orders/:orderNumber/access-link`, `checkout`, `downloads/:token`.

**T1.2 Hardening admin (F7)**
- `requireAuth`: ambil admin dari DB, cek `isActive`, `role`, dan `tokenVersion` == klaim token.
- Tambah `requireRole("admin")` untuk semua route admin.
- Tandai MFA sebagai item Tahap 2 (dicatat, belum diimplementasi).
- Kebijakan password (min panjang/kompleksitas) di schema + seed.
- Opsi cookie `HttpOnly`+`Secure`+`SameSite` + CSRF (dievaluasi; lihat pertanyaan terbuka).

**T1.3 Refund benar (F9)**
- Tangani `adjustment.updated`/`adjustment.created` dengan memeriksa `action`, `status`, dan `totals`/jumlah dikembalikan.
- Full refund -> order `REFUNDED`, cabut entitlement; partial -> tandai, jangan cabut penuh.

**T1.4 Hardening upload (F10)**
- Verifikasi magic bytes `%PDF-`, ekstensi/`format`, batas ukuran, jumlah total file; tolak selain PDF.

**T1.5 Audit log (F11)**
- Middleware/helper mencatat login, upload, ubah harga, publish, refund, aksi admin lain ke `AuditLog`.

**T1.6 Email magic-link (F5)**
- Integrasi provider email (Resend) + template; kirim tautan akses ketika `POST /api/orders/:orderNumber/access-link`.

---

## 7. Test Plan

**Stack:** Vitest + Supertest (API), Vitest (client util). Mock Paddle & Cloudinary. PostgreSQL test (service di CI).

**Kasus kritis**
- Webhook: signature invalid ditolak; event duplikat `PROCESSED` di-skip; event gagal lalu retry berhasil; mismatch transaksi ditolak.
- Fulfillment: order PAID menghasilkan entitlement tepat secara logis; rekonsiliasi mengisi yang hilang.
- Refund: full vs partial.
- Unduhan: kuota habis; kedaluwarsa; request paralel tidak melewati kuota; token invalid.
- Order status: tanpa bukti akses -> tidak membocorkan token; email cocok; access-link valid/expired.
- Admin auth: token dicabut (`tokenVersion` naik) langsung tidak berlaku; role check.
- Upload: file non-PDF (mengaku PDF) ditolak.

**e2e smoke (Playwright):** buka landing -> buka niche -> buka checkout (mock/sandbox) -> halaman sukses.

---

## 8. CI (GitHub Actions)

- Job: `lint`, `typecheck`, `build`, `test` (Postgres service), `e2e` (opsional, dapat dijadwalkan).
- Tambah ESLint (belum ada konfigurasi lint) + script `lint` di masing-masing workspace & root.
- Cache npm; jalankan pada PR & push ke `main`.
- Gate rilis: semua job harus hijau.

---

## 9. Urutan Pengerjaan (Milestone)

1. **M0 - Fondasi**: migrasi skema (WebhookEvent, AdminUser.tokenVersion, ProductFile, AccessLink, Entitlement, AuditLog) + ESLint + Vitest setup.
2. **M1 - File aman**: T0.1, T0.2 + test upload/unduh.
3. **M2 - Fulfillment andal**: T0.3, T0.4 + test webhook.
4. **M3 - Akses pembeli**: T0.5, T1.6 + test status/access-link.
5. **M4 - Auth & abuse**: T1.1, T1.2 + test rate limit & revokasi.
6. **M5 - Refund & upload**: T1.3, T1.4 + test.
7. **M6 - Audit & CI**: T1.5, pipeline lengkap, dokumentasi diperbarui.

---

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Migrasi `ProductFile` merusak data lama | Migrasi bertahap + uji pada salinan DB; pertahankan `fileUrl` untuk legacy |
| Signed URL Cloudinary bocor/berumur panjang | Masa berlaku pendek + `type: authenticated` + rate limit unduh |
| Webhook tetap gagal (mis. salah config) | Status `FAILED` + attempts + rekonsiliasi + alert |
| Cek admin per request menambah beban DB | Query ringan terindeks; opsi cache singkat bila perlu |
| Email masuk spam | Provider terverifikasi (domain SPF/DKIM) |
| Secret sudah terpapar | Rotasi API key/token/webhook/DB + audit riwayat git |

---

## 11. Definition of Done (Tahap 0+1)

- Tidak ada jalur mengakses PDF berbayar tanpa entitlement.
- Order tidak membocorkan token tanpa bukti akses.
- Webhook idempotent, transaksional, dapat dicoba ulang; fulfillment tepat sekali secara logis.
- Detail transaksi Paddle divalidasi terhadap order lokal.
- Refund full/partial menyesuaikan entitlement dengan benar.
- Kuota unduh aman dari race condition.
- Admin: rate limit, revokasi sesi, cek role, kebijakan password; audit log aktif.
- Upload divalidasi (magic bytes/ekstensi/ukuran/jumlah).
- Seluruh lint, typecheck, build, test hijau di CI.
- Dokumentasi (`prd.md` + `docs/`) diperbarui mengikuti perubahan.

---

## 12. Pertanyaan Terbuka

- Provider email final: Resend (disarankan) atau SMTP/ lainnya?
- TTL signed URL Cloudinary dan TTL access-link (usulan 60 menit)?
- Autentikasi admin pindah ke cookie HttpOnly (perlu desain CSRF) atau tetap Bearer + revokasi?
- Perlukah partial refund mempertahankan entitlement (kebijakan bisnis)?

---

# Lampiran A — Desain Entity & Constraint Database

> Masukan desain lanjutan. Fondasi tabel saat ini sudah masuk akal, tetapi belum "matang untuk MVP yang siap menerima transaksi". Tujuannya: database kecil, relasi jelas, tanpa mengorbankan integritas transaksi. **Bukan rewrite total** — cukup rapikan bertahap lewat migrasi agar implementasi yang ada tidak rusak.

## A.1 Struktur entity yang direkomendasikan

Pertahankan konsep dasar, tetapi perjelas batas tanggung jawab tiap entity:

```
Niche (finance / business / psychology)
  |  1 niche -> banyak bundle
  v
Product / Bundle  (judul, slug, deskripsi, harga, status publikasi)
  |  1 bundle -> banyak file PDF
  v
ProductFile / BundleFile  (urutan PDF, title, storageKey, checksum, versi)

Order  (email pembeli, total, mata uang, status)
  |  1 order -> banyak item
  v
OrderItem  (snapshot harga & nama produk)
  + Payment  (transaksi Paddle, status pembayaran)
  + Entitlement  (hak pembelian)  ->  DownloadToken (akses file, masa berlaku, kuota)

WebhookEvent  (eventId unik, status pemrosesan, retry, error)
```

Ini desain konseptual yang direkomendasikan, bukan klaim bahwa diagram sudah sama persis dengan database saat ini.

## A.2 Tabel: dipertahankan atau diubah

| Entity | Rekomendasi | Alasan |
| --- | --- | --- |
| `Niche` | Pertahankan | Mengatur kategori & landing page per niche. |
| `Product` | Pertahankan, perjelas sebagai **bundle** | Hindari kebingungan antara 1 PDF dan 1 produk berisi banyak PDF. |
| `ProductFile` | Pertahankan atau pisahkan `BundleFile` + `AssetFile` | Memisahkan hubungan isi bundle dari metadata file fisik bila perlu. |
| `Order` | Pertahankan | Mewakili transaksi pembelian, bukan produk. |
| `OrderItem` | Pertahankan | Menyimpan snapshot produk & harga saat transaksi. |
| `DownloadToken` | Pertahankan dengan pengamanan | Token adalah sarana akses, **bukan bukti utama kepemilikan**. |
| `WebhookEvent` | Pertahankan, perkuat | Harus mendukung idempotensi, retry, dan pelacakan kegagalan. |
| `Payment` | **Tambahkan** bila belum ada | Memisahkan data transaksi eksternal dari status order. |
| `Entitlement` | **Tambahkan** | Catatan eksplisit hak akses atas produk yang dibeli. |

Prinsip: **jangan** membuat entity hanya karena terlihat lebih enterprise. Setiap tabel harus punya tanggung jawab & aturan integritas yang jelas.

## A.3 Keputusan desain paling penting

**A. Bedakan bundle, file PDF, dan file fisik.**
Contoh: niche Finance punya bundle "Personal Finance Mastery" berisi 12 PDF. Bundle = produk yang dibeli; tiap PDF = isi produk.
- `Product` - judul, deskripsi, slug, harga, cover, status publikasi.
- `ProductFile` - hubungan produk <-> file, urutan tampil, judul PDF.
- `AssetFile` - metadata file fisik: storageKey, ukuran, checksum, MIME.
Untuk MVP, `AssetFile` terpisah belum wajib bila tiap file hanya dipakai satu produk dan tanpa versioning. Pisahkan bila satu PDF dipakai ulang di beberapa bundle.

**B. Pisahkan Order dan Payment.**
- `Order` = apa yang dibeli. `Payment` = upaya/transaksi yang dikelola Paddle.
- Order `ORD-123` total USD 29.00; Payment menyimpan Paddle transaction ID, status, jumlah, mata uang, waktu konfirmasi.
- Order jadi `PAID` setelah transaksi valid terkonfirmasi.
- Berguna untuk transaksi tertunda, gagal, retry, rekonsiliasi. Untuk MVP: satu order -> satu payment aktif (tanpa abstraksi multi-provider).

**C. Entitlement adalah sumber hak akses.**
- Satu order punya banyak order item; satu order item yang dibayar menghasilkan satu entitlement untuk bundle itu.
- Entitlement menentukan produk yang berhak diakses + status; token download adalah mekanisme memakai hak tersebut.
- Bila pembeli kehilangan tautan, terbitkan tautan baru **tanpa** transaksi baru.

**D. Niche & subdomain jangan jadi tabel terpisah.**
- Gunakan `Niche.slug` sebagai identifier subdomain (`finance`, `business`, `psychology`); aplikasi baca hostname lalu cari niche cocok.
- Jangan simpan tiap subdomain sebagai produk atau tabel khusus.
- `slug` niche global `@unique` sudah cukup untuk One Section sekarang.

## A.4 Constraint & indeks yang wajib ada

| Tabel | Constraint / indeks |
| --- | --- |
| `Niche` | `slug` unik; indeks status publikasi |
| `Product` | `slug` unik; indeks `(nicheId, status)` |
| `ProductFile` | Unique `(productId, position)`; indeks `productId` |
| `AssetFile` | `storageKey` unik bila 1 record = 1 objek fisik |
| `Order` | `orderNumber` unik; indeks `(status, createdAt)` |
| `OrderItem` | FK ke order; snapshot harga & nama produk |
| `Payment` | `providerTransactionId` unik bila ada; indeks `orderId` |
| `WebhookEvent` | `eventId` unik; indeks `(status, receivedAt)` |
| `Entitlement` | Unique `(orderItemId)` bila 1 item -> 1 entitlement |
| `DownloadToken` | Hash token unik; indeks entitlement & masa berlaku |

Aturan tambahan:
- Uang pakai `Decimal`, **bukan** `Float`; simpan kode mata uang (`USD`) eksplisit.
- Foreign key + `onDelete` disengaja.
- **Hindari** menghapus order & histori pembayaran secara cascading.
- Pagination untuk tabel admin.
- Gunakan transaksi DB saat mengubah order, payment, dan entitlement yang harus konsisten.
- Constraint dirancang di tingkat database, bukan hanya validasi aplikasi.

## A.5 Skema Prisma konseptual (inti katalog/order/payment)

```prisma
enum PublishStatus { DRAFT PUBLISHED ARCHIVED }

enum OrderStatus { PENDING PAID FAILED CANCELED PARTIALLY_REFUNDED REFUNDED }

enum PaymentStatus { PENDING COMPLETED FAILED CANCELED REFUNDED }

model Niche {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(100)
  slug        String   @unique @db.VarChar(80)
  description String?  @db.Text
  status      PublishStatus @default(DRAFT)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  products    Product[]
  @@index([status, name])
}

model Product {
  id          String   @id @default(uuid()) @db.Uuid
  nicheId     String   @db.Uuid
  title       String   @db.VarChar(200)
  slug        String   @unique @db.VarChar(220)
  description String   @db.Text
  price       Decimal  @db.Decimal(12, 2)
  currency    String   @default("USD") @db.VarChar(3)
  coverKey    String?
  status      PublishStatus @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  niche       Niche    @relation(fields: [nicheId], references: [id], onDelete: Restrict)
  files       ProductFile[]
  @@index([nicheId, status, publishedAt])
}

model ProductFile {
  id         String   @id @default(uuid()) @db.Uuid
  productId  String   @db.Uuid
  title      String   @db.VarChar(200)
  storageKey String   @unique
  position   Int
  createdAt  DateTime @default(now())
  product    Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
  @@unique([productId, position])
  @@index([productId])
}

model Order {
  id            String   @id @default(uuid()) @db.Uuid
  orderNumber   String   @unique @db.VarChar(40)
  customerEmail String   @db.VarChar(320)
  status        OrderStatus @default(PENDING)
  total         Decimal  @db.Decimal(12, 2)
  currency      String   @db.VarChar(3)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  items         OrderItem[]
  payments      Payment[]
  @@index([customerEmail, createdAt])
  @@index([status, createdAt])
}

model OrderItem {
  id           String  @id @default(uuid()) @db.Uuid
  orderId      String  @db.Uuid
  productId    String? @db.Uuid
  productTitle String  @db.VarChar(200)
  unitPrice    Decimal @db.Decimal(12, 2)
  quantity     Int     @default(1)
  lineTotal    Decimal @db.Decimal(12, 2)
  order        Order   @relation(fields: [orderId], references: [id], onDelete: Restrict)
  @@index([orderId])
}

model Payment {
  id                    String   @id @default(uuid()) @db.Uuid
  orderId               String   @db.Uuid
  provider              String   @default("PADDLE")
  providerTransactionId String?  @unique
  status                PaymentStatus @default(PENDING)
  amount                Decimal  @db.Decimal(12, 2)
  currency              String   @db.VarChar(3)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  order                 Order    @relation(fields: [orderId], references: [id], onDelete: Restrict)
  @@index([orderId, status])
}
```

Catatan: contoh ini baru **inti katalog, order, dan payment**. Sebelum diterapkan, masih perlu dilengkapi `Entitlement`, `DownloadToken`, `WebhookEvent`, aturan transaksi, dan fulfillment. **Jangan menjalankan migrasi ini ke database produksi** hanya dengan contoh ini.

## A.6 Yang belum perlu dibuat (jaga MVP tetap bersih)

| Fitur | Keputusan |
| --- | --- |
| Cart & wishlist | Belum perlu (beli langsung per bundle) |
| Customer account | Opsional; email + akses aman cukup untuk awal |
| Subscription / recurring | Tidak perlu untuk one-time purchase |
| Coupon & affiliate | Tambahkan saat kebutuhan bisnis jelas |
| Multi-vendor / tenant | Tidak perlu (satu brand) |
| Payment abstraction generik | Belum perlu bila hanya Paddle |
| Audit log admin | Disarankan sejak awal (ubah harga & produk) |
| Entitlement & webhook retry | Perlu sejak MVP (uang & akses produk) |

## A.7 Tiga keputusan kunci & langkah aman

1. `Product` benar-benar merepresentasikan **bundle** yang dijual, tidak mencampur bundle dan PDF individual.
2. `Order`, `Payment`, dan `Entitlement` punya tanggung jawab masing-masing.
3. File fisik, token download, dan webhook punya kontrol keamanan serta pemulihan yang jelas.

Langkah aman: bandingkan desain ini dengan `schema.prisma` + seluruh query/service yang menggunakannya, lalu buat **migrasi bertahap** agar tidak merusak implementasi yang ada.
