# SIBER-PM: Sistem Supervisi Akademik & Pembelajaran Mendalam

Aplikasi Web Terpadu Supervisi Akademik Guru berbasis Implementasi Kurikulum Merdeka dan Pembelajaran Mendalam (Deep Learning / PM). Dirancang untuk 4 peran pengguna: **Admin Dinas Pendidikan**, **Pengawas Sekolah**, **Kepala Sekolah**, dan **Guru**.

---

## 🚀 Fitur Utama

- **Dashboard Berbasis Peran (RBAC)**:
  - **Guru**: Portal mandiri dengan agenda observasi kelas, tautan modul ajar Google Drive, checklist 17 dokumen administrasi ajar, pemetaan pola pikir (Growth Mindset), dan capaian 10 aspek Pembelajaran Mendalam (PM).
  - **Pengawas Sekolah**: Verifikasi & penilaian instrumen supervisi tatap muka, pemberian catatan resmi pengawas, monitoring sekolah binaan, dan kalender supervisi.
  - **Kepala Sekolah**: Pengajuan jadwal supervisi sekolah, penelaahan modul ajar, dan monitoring kelengkapan guru satuan pendidikan.
  - **Admin Dinas**: Rekapitulasi agregat seluruh satuan pendidikan di wilayah kabupaten/kota, manajemen pengguna, dan export laporan (Excel/PDF).
- **Integrasi Cloud & Google Drive**: Tautan langsung modul ajar dan dokumen administrasi perangkat ajar via Google Drive.
- **Rapor & Grafik Analisis**: Grafik radar 6 dimensi kompetensi guru, distribusi pola pikir, dan evaluasi 10 aspek pembelajaran mendalam.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Motion
- **Backend**: Express.js (Node.js) terintegrasi Vite middleware untuk development mode dan compiled bundle untuk production
- **Build System**: Vite 6 + esbuild untuk single-file backend bundle (`dist/server.cjs`)

---

## 💻 Menjalankan di Lingkungan Lokal

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Jalankan Mode Pengembangan (Dev)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan pada `http://localhost:3000`.

3. **Cek Validasi Kode (Lint)**:
   ```bash
   npm run lint
   ```

4. **Kompilasi Produksi (Build)**:
   ```bash
   npm run build
   ```
   Perintah ini akan membangun aset statis frontend di `dist/` dan membundel backend Express ke `dist/server.cjs`.

5. **Menjalankan Server Produksi**:
   ```bash
   npm start
   ```

---

## 🌐 Panduan Sinkronisasi dengan GitHub & Deploy

### Metode 1: Melalui Menu Ekspor Google AI Studio (Paling Mudah)
1. Di layar kerja **Google AI Studio**, klik menu **Settings** / tombol titik tiga (kanan atas).
2. Pilih **Export to GitHub** (atau **Download ZIP**).
3. Hubungkan akun GitHub Anda dan pilih repository tujuan (Create new repo).
4. Kode akan otomatis tersinkronisasi ke repository GitHub Anda.

### Metode 2: Push Melalui Git CLI
Jika Anda ingin menyinkronkan langsung ke repository GitHub milik Anda:

```bash
# 1. Pastikan commit lokal sudah dibuat
git add .
git commit -m "feat: inisialisasi aplikasi SI-SUPERVISI PM siap deploy"

# 2. Tambahkan URL repository GitHub Anda
git remote add origin https://github.com/USERNAME/NAMA-REPO.git

# 3. Ganti nama branch utama ke main (jika belum)
git branch -M main

# 4. Push ke GitHub
git push -u origin main
```

---

## ☁️ Konfigurasi Deployment (Cloud Run / Vercel / VPS / Docker / Render)

Saat melakukan deploy di platform cloud (Google Cloud Run, Railway, Render, VPS, dll.), pastikan konfigurasi berikut digunakan:

| Konfigurasi | Nilai | Keterangan |
|---|---|---|
| **Node Version** | `>= 20.x` | Node LTS didukung penuh |
| **Build Command** | `npm run build` | Membangun frontend dan `dist/server.cjs` |
| **Start Command** | `npm start` | Menjalankan `node dist/server.cjs` |
| **Port** | `3000` (atau sesuai env `$PORT`) | Server mengikat pada host `0.0.0.0` |

---

## 🔒 Variabel Lingkungan (.env)

Lihat `.env.example` untuk variabel yang dibutuhkan.
- `GEMINI_API_KEY`: API Key Google Gemini (opsional, jika menggunakan fitur AI)
- `APP_URL`: URL publik aplikasi setelah dideploy
