# Design System — 1Section

> Sistem desain aktual yang dipakai di `client/`. Semua nilai diambil langsung dari `client/src/app/globals.css`, komponen `client/src/components/ui/*`, dan pola yang dipakai di halaman. Tema: **monokrom editorial** (hitam/putih/abu) dengan aksen kontras, gaya "cinematic" (grid, spotlight, noise, teks gradien).

---

## 1. Prinsip Desain

1. **Monokrom & kontras tinggi** — palet hampir seluruhnya netral; "accent" adalah kebalikan dari foreground (di light mode accent = hitam, di dark mode accent = putih).
2. **Editorial / cinematic** — tipografi tebal, teks gradien, layer grid + spotlight + noise halus di hero.
3. **Minimal & lapang** — radius besar (rounded-xl/2xl/3xl), border tipis 1px, bayangan lembut.
4. **Dark-mode-first class support** — semua warna via CSS variable, otomatis menyesuaikan `.dark`.
5. **Motion halus** — animasi masuk `fade-up`/`fade-in`/`rise`, dihormati `prefers-reduced-motion`.

---

## 2. Design Tokens (CSS Variables)

Didefinisikan di `:root` (light) dan `.dark`, lalu diekspos ke Tailwind v4 lewat `@theme inline`. Dengan begitu tersedia utility seperti `bg-surface`, `text-fg-muted`, `border-border`, `bg-accent`, `text-accent-fg`, dll.

### Palet Light (`:root`)
| Token | Nilai | Kegunaan |
| --- | --- | --- |
| `--surface` | `#ffffff` | Latar utama halaman |
| `--surface-muted` | `#f4f4f5` | Latar sekunder / section pembeda |
| `--card` | `#ffffff` | Latar kartu, input, modal |
| `--border` | `#e4e4e7` | Garis border |
| `--fg` | `#09090b` | Teks utama |
| `--fg-muted` | `#71717a` | Teks sekunder |
| `--accent` | `#09090b` | Warna aksen/CTA (hitam) |
| `--accent-fg` | `#fafafa` | Teks di atas accent |
| `--ring` | `#d4d4d8` | Ring fokus |
| `color-scheme` | `light` | Kontrol native form |

### Palet Dark (`.dark`)
| Token | Nilai |
| --- | --- |
| `--surface` | `#060606` |
| `--surface-muted` | `#101012` |
| `--card` | `#0d0d0f` |
| `--border` | `#232327` |
| `--fg` | `#fafafa` |
| `--fg-muted` | `#a1a1aa` |
| `--accent` | `#fafafa` |
| `--accent-fg` | `#09090b` |
| `--ring` | `#333338` |
| `color-scheme` | `dark` |

### Legacy "safety net"
`--color-brand-50..900` dan `--color-ink-*` disediakan sebagai palet monokrom untuk kelas brand/ink lama (agar tidak ada warna non-monokrom yang bocor). Ini bukan warna brand asli — hanya pengaman.

### Tipografi
- Font: `--font-sans` = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` (system font stack, tanpa web font eksternal).
- Rendering: `antialiased`, `text-rendering: optimizeLegibility`.

### Radius, Border, Shadow (pola, bukan token)
- Radius: kartu `rounded-2xl`/`rounded-3xl`, tombol/input `rounded-lg`, pill `rounded-full`, ikon `rounded-xl`.
- Border: selalu `border border-border` (1px).
- Shadow: `shadow-sm` (kontrol), `shadow-2xl shadow-black/5` (kartu produk), `dark:shadow-black/40`.

---

## 3. Mode Gelap (Theming)

- Implementasi: `client/src/components/theme-provider.tsx`.
- Variabel `dark` class via `@custom-variant dark (&:where(.dark, .dark *))`.
- Simpan preferensi di `localStorage` key **`section-theme`**.
- Nilai awal: dari localStorage, kalau tidak ada ikut `prefers-color-scheme`.
- **Anti-flash**: script inline `themeScript` di `<head>` (`app/layout.tsx`) menambahkan class `dark` sebelum render.
- API hook: `useTheme()` → `{ theme, setTheme, toggle }`.
- Komponen: `ThemeToggle` (ikon sun/moon, `aria-label` dinamis).

---

## 4. Motion & Efek

Animasi didefinisikan sebagai `--animate-*` di `@theme inline`:

| Utility | Keyframes | Nilai | Pemakaian |
| --- | --- | --- | --- |
| `animate-fade-up` | `fade-up` | `0.8s cubic-bezier(0.16,1,0.3,1) both` | Hero title/subtitle/CTA |
| `animate-fade-in` | `fade-in` | `1s ease both` | Elemen pendukung |
| `animate-rise` | `rise` | `1.1s cubic-bezier(0.16,1,0.3,1) both` | Elemen besar |

Efek "cinematic" (helper class di `globals.css`):
- `.cinema-grid` — grid 64px dari garis `fg` 7% opacity.
- `.cinema-spotlight` — radial gradient dari atas-tengah.
- `.cinema-noise` — SVG `feTurbulence` fractal noise (opacity dipakai di markup).
- `.text-gradient` — `background-clip: text` gradien fg → fg 45%.

Aksesibilitas gerak: `@media (prefers-reduced-motion: reduce)` mematikan ketiga animasi.

---

## 5. Komponen UI (primitives) — `client/src/components/ui/`

### `Button` (`button.tsx`)
- `forwardRef<HTMLButtonElement>`, meneruskan seluruh props native.
- **Variant:** `primary` (bg-accent), `secondary` (bg-card + ring border), `ghost` (transparan, hover surface), `danger` (red-600). Default `primary`.
- **Size:** `sm` (`px-3 py-1.5 text-sm`), `md` (`px-4 py-2 text-sm`, default), `lg` (`px-6 py-3 text-base`).
- Base: `inline-flex items-center justify-center gap-2 rounded-lg font-medium`, focus-visible ring accent, disabled opacity.

### `Input` / `Textarea` / `Field` (`input.tsx`)
- `Input` & `Textarea` forwardRef, style `baseField`:
  `w-full rounded-lg border-0 bg-card px-3 py-2 text-sm text-fg shadow-sm ring-1 ring-inset ring-border placeholder:text-fg-muted focus:ring-2 focus:ring-accent disabled:bg-surface-muted`.
- `Field` — wrapper label: label (text-sm font-medium) + children + hint (text-xs muted) atau error (text-xs merah `text-red-600`).

### `Spinner` (`spinner.tsx`)
- `role="status"`, `aria-label="Loading"`, `animate-spin`, border 2 + `border-t-transparent`, default `size-4`.

### `StatusBadge` & `Badge` (`badge.tsx`)
- `StatusBadge` untuk `OrderStatus` dengan warna: `PENDING`/`CANCELED` (muted), `PAID` (invers: bg-fg text-surface), `FAILED` (outline fg/40), `REFUNDED` (muted + text fg).
- `Badge` generik tone `brand`/`neutral`/`success` (semua monokrom).

---

## 6. Komponen Storefront — `client/src/components/site/`

| Komponen | Fungsi & catatan visual |
| --- | --- |
| `SiteHeader` | Header sticky `backdrop-blur-xl`, logo kotak "1S" (bg-accent), nav niche (maks 5, sembunyikan < md), ThemeToggle, tombol "Browse bundles". |
| `SiteFooter` | 3 kolom: brand + deskripsi, daftar niche, "Company" (Payments secured by Paddle, Instant delivery, Retrieve a purchase). |
| `NicheCard` | Kartu link ke `nicheUrl(slug)`. Ikon huruf dari inisial nama, judul, tagline, jumlah bundle (`_count.products`), CTA "View bundles →". Hover: `-translate-y-1` + shadow. |
| `ProductCard` | Layout 2 kolom (md+): kiri = Badge jumlah PDF, judul, summary, daftar fitur (cek lingkaran accent), harga (+ compare-at dicoret + label "one-time"), `BuyButton`, trust text. Kanan = cover image grayscale atau panel placeholder cinema-grid. |
| `BuyButton` | Client component memanggil `useCheckout`. Label default "Buy once, download instantly". Menampilkan spinner saat pending & error di bawah tombol. |

---

## 7. Komponen Admin — `client/src/components/admin/`

| Komponen | Fungsi & catatan visual |
| --- | --- |
| `AdminShell` | Layout sidebar (w-60, desktop) + header. Nav: Dashboard, Niches, Products, Orders (ikon glyph). Menampilkan email user + tombol Sign out (merah). Nav versi mobile di header. |
| `AuthGuard` | Proteksi route admin; spinner full-screen saat loading; redirect ke `/admin/login`. |
| `Modal` | Overlay `bg-black/50 backdrop-blur-sm`, tutup via Esc/klik tombol ✕. Prop `wide` → `max-w-3xl` (vs `max-w-xl`). Catatan: belum ada focus trap & klik di luar tidak menutup. |
| `NicheForm` | Form niche (react-hook-form + zod). Field: name, slug, tagline, description, heroImage, sortOrder, featured, active, accentColor. |
| `ProductForm` | Form produk; input harga dalam dolar (dikonversi ×100), features 1 baris per fitur, upload multi-PDF dengan daftar file + rename label + hapus. |
| `StatCard` | Kartu statistik dashboard (label uppercase, nilai besar, hint opsional). |

---

## 8. Layout & Responsivitas

- **Container:** `mx-auto max-w-6xl px-4 sm:px-6`.
- **Grid:** `sm:grid-cols-2 lg:grid-cols-3` (kartu niche), `md:grid-cols-3` (steps/trust), `sm:grid-cols-2` (form).
- **Breakpoint utama:** `md` (>=768px) untuk sidebar admin & split ProductCard; `sm` untuk grid.
- **Sticky header** storefront dengan `z-40`; modal `z-50`.

---

## 9. Aksesibilitas

- `aria-label` pada ThemeToggle, Spinner, tombol Close.
- `focus-visible:outline` konsisten (accent) di Button.
- `role="status"` untuk loading.
- Mendukung `prefers-reduced-motion`.
- Catatan gap: Modal belum ada focus trap/role dialog; beberapa glyph nav memakai karakter teks.

---

## 10. Ringkasan Kelas Utility yang Sering Dipakai

```
Latar:        bg-surface, bg-surface-muted, bg-card
Teks:         text-fg, text-fg-muted, text-accent-fg, text-gradient
Border/ring:  border-border, ring-border, ring-accent
Aksen:        bg-accent, text-accent-fg
Efek:         cinema-grid, cinema-spotlight, cinema-noise, animate-fade-up
```
