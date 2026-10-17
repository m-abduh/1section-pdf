# Operations & Deployment — 1Section

> Panduan menjalankan, mengonfigurasi, dan men-deploy 1Section: prasyarat, env, skrip, setup database, subdomain/DNS, storage upload, dan catatan produksi.

---

## 1. Prasyarat

- **Node.js >= 20** (lihat `engines` di root `package.json`).
- **PostgreSQL** (lokal atau terkelola).
- **Akun Paddle** (sandbox untuk dev, production untuk rilis) + akses dashboard.
- npm (workspaces).

---

## 2. Instalasi

```bash
npm install            # dari root; meng-install seluruh workspace
```

Struktur workspace: `client` + `server`. Root mengorkestrasi via `concurrently`.

---

## 3. Environment

Salin contoh lalu isi:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### `server/.env`
| Var | Keterangan |
| --- | --- |
| `NODE_ENV` | `development` / `production` |
| `PORT` | default `4000` |
| `DATABASE_URL` | koneksi PostgreSQL |
| `CLIENT_URL` | origin client (dipakai untuk URL download lokal) |
| `ROOT_DOMAIN` | `1section.com` |
| `CORS_ORIGINS` | CSV origin tambahan |
| `JWT_SECRET` | string acak panjang (>=16) |
| `JWT_EXPIRES_IN` | default `7d` |
| `PADDLE_ENV` | `sandbox` / `production` |
| `PADDLE_API_KEY` | API key server |
| `PADDLE_WEBHOOK_SECRET` | signing secret webhook |
| `PADDLE_TAX_CATEGORY` | default `standard` |
| `DOWNLOAD_TOKEN_TTL_HOURS` | default `72` |
| `DOWNLOAD_MAX_HITS` | default `5` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | akun seed |

### `client/.env`
| Var | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL API |
| `NEXT_PUBLIC_ROOT_DOMAIN` | root domain |
| `NEXT_PUBLIC_SITE_NAME` | nama brand |
| `NEXT_PUBLIC_USE_SUBDOMAINS` | `true`/`false`/kosong (auto) |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox`/`production` |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | token publik Paddle.js |

> ⚠️ **Secrets:** file `.env` di-ignore git (`.gitignore`), tetapi jika kunci Paddle pernah ikut ter-commit/ter-share, **rotate** di dashboard Paddle. Dokumentasi ini sengaja tidak memuat nilai kunci.

---

## 4. Database

```bash
npm run prisma:generate     # generate Prisma Client
npm run prisma:migrate      # dev: buat/apply migration
npm run db:seed             # seed admin + niche + produk contoh
```

Produksi:
```bash
npm run prisma:deploy       # apply migration yang sudah ada
```

Migration yang ada (urut): `init` → `add_paddle_product_id` → `product_files_bundle`. Lihat `docs/data-model.md` §4.

---

## 5. Menjalankan

```bash
npm run dev            # server (4000) + client (3000) bersamaan
# atau terpisah
npm run dev:server
npm run dev:client
```

Build & start:
```bash
npm run build          # build server lalu client
npm run start -w server
npm run start -w client
npm run typecheck      # typecheck server + client
```

### Akses Dev
- Storefront: `http://localhost:3000`
- Niche: `http://finance.localhost:3000` **atau** `http://localhost:3000/niche/finance`
- Admin: `http://admin.localhost:3000` **atau** `http://localhost:3000/admin`

`*.localhost` otomatis diizinkan (Next `allowedDevOrigins`, CORS server, resolver subdomain proxy). Alternatif: `lvh.me`.

---

## 6. Skrip Root (ringkasan)

| Script | Fungsi |
| --- | --- |
| `npm run dev` | server + client |
| `npm run dev:server` / `dev:client` | salah satu |
| `npm run build` / `build:server` / `build:client` | build |
| `npm run typecheck` | typecheck keduanya |
| `npm run prisma:generate` / `prisma:migrate` / `prisma:deploy` | Prisma |
| `npm run db:seed` | seed |

---

## 7. Subdomain & DNS (Produksi)

Agar `finance.1section.com`, `admin.1section.com`, dsb. bekerja:
1. Arahkan domain apex ke layanan web (Next).
2. Tambahkan **wildcard DNS** `*.<domain>` → layanan web (untuk semua subdomain niche).
3. Konfigurasi TLS wildcard di host/reverse proxy.
4. Set `NEXT_PUBLIC_ROOT_DOMAIN=1section.com` dan `NEXT_PUBLIC_USE_SUBDOMAINS=true`.
5. Set `CORS_ORIGINS` & `ROOT_DOMAIN` di server; server otomatis mengizinkan `*.ROOT_DOMAIN`.

Endpoint API sebaiknya berada di host yang dijangkau client (mis. `api.1section.com`); set `NEXT_PUBLIC_API_URL` sesuai.

---

## 8. Storage Upload (PDF)

- PDF diunggah ke **filesystem lokal** `server/uploads/` dan diserve Express di `/uploads`.
- Folder dilacak git hanya lewat `server/uploads/.gitkeep`; semua file PDF diabaikan (`.gitignore`). Saat ini folder sudah berisi beberapa PDF hasil upload.
- Client me-rewrite `/uploads/*` ke server.

**Catatan produksi penting:**
- Filesystem platform serverless (mis. Vercel Functions) bersifat **ephemeral** → file hilang saat redeploy/restart. Untuk produksi gunakan **disk persisten** (VPS + volume) atau **object storage** (S3/R2/GCS) dan simpan URL absolut pada `ProductFile.fileUrl` (backend sudah mendukung redirect untuk `http(s)://`).
- Backup folder uploads secara berkala.

---

## 9. Deployment (pola umum)

1. **Database:** sediakan PostgreSQL terkelola; jalankan `prisma migrate deploy`.
2. **Server API:** deploy `server` (build `tsc` → `dist`, start `node dist/index.js`), set env produksi, pastikan disk uploads persisten.
3. **Client:** deploy `client` ke hosting Next.js; set `NEXT_PUBLIC_*` (di-bake saat build) dan wildcard domain.
4. **Webhook:** daftarkan URL publik `https://<api-host>/api/webhooks/paddle` di Paddle, subscribe event, simpan secret.
5. **Seed admin** sekali (atau buat admin manual) dan ganti password default.
6. Verifikasi end-to-end di sandbox sebelum production.

---

## 10. Healthcheck & Monitoring

- API: `GET /api/health` → `{ status: "ok", time }`.
- Log: `morgan` (combined di produksi).
- Perhatikan tabel `webhook_events` untuk audit event Paddle yang masuk.
- Pantau `orders` status `PENDING` yang menggantung (indikasi webhook bermasalah).

---

## 11. Checklist Rilis

- [ ] `JWT_SECRET` kuat & unik produksi.
- [ ] API key/token/webhook secret Paddle **production** (bukan sandbox).
- [ ] `NEXT_PUBLIC_USE_SUBDOMAINS=true` + wildcard DNS + TLS.
- [ ] `CORS_ORIGINS`/`ROOT_DOMAIN` benar.
- [ ] Migration ter-apply (`prisma migrate deploy`).
- [ ] Storage upload persisten + backup.
- [ ] Password admin default diganti.
- [ ] Webhook terdaftar & terverifikasi.
- [ ] `npm run typecheck` & `npm run build` lulus.
- [ ] Uji checkout sandbox → production dengan transaksi kecil.
