# NARF

Platform pembelajaran IoT dan Arduino untuk siswa SMK, dikembangkan untuk LIDM 2026. NARF KIT menyediakan course berjenjang, kuis, jurnal refleksi, project kelompok, simulasi rangkaian, dan chatbot AI dengan pendekatan Socratic. Guru memiliki dashboard tersendiri untuk menilai dan memberikan umpan balik.

NARF KIT dirancang dengan mempertimbangkan sekolah di daerah 3T (terdepan, terluar, tertinggal), termasuk mode lokal untuk koneksi internet yang terbatas.

> **Status pengembangan:** Mode offline (Mode B) masih dalam pengembangan. Schema Supabase sedang disempurnakan, sehingga migration pada folder `supabase/` akan diekspor setelah schema final.

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Struktur Folder](#struktur-folder)
- [Prasyarat](#prasyarat)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Keamanan](#keamanan)
- [Deploy](#deploy)
- [Rencana Pengembangan](#rencana-pengembangan)
- [Pengembang](#pengembang)

## Fitur

- **Course**: modul berurutan dengan materi video, bacaan, dan PDF. Modul berikutnya terbuka setelah modul sebelumnya diselesaikan.
- **Kuis**: soal pilihan ganda dinilai otomatis, soal esai dinilai oleh guru.
- **Jurnal refleksi**: catatan belajar per modul yang dapat diberi umpan balik oleh guru.
- **Project akhir**: Business Model Canvas, analisis SWOT, dan pengumpulan project per kelompok.
- **Simulasi**: simulasi rangkaian dan kode mikrokontroler menggunakan Wokwi.
- **Chatbot AI**: pendamping belajar dengan pendekatan Socratic.
- **Dashboard guru** dan **tema terang/gelap**.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Front end | HTML, CSS, dan JavaScript (tanpa framework dan tanpa build step) |
| Backend | Supabase (Auth, PostgreSQL, Row Level Security, Edge Functions) |
| Library | `@supabase/supabase-js` 2.45.4, `DOMPurify` 3.1.6 |
| Font | Montserrat (Google Fonts) |

## Struktur Folder

```text
.
├── landingpage.html      # login dan registrasi
├── dashboardsiswa.html   # dashboard siswa
├── course.html           # katalog course, materi, kuis, jurnal, project
├── simulation.html       # simulasi rangkaian
├── chatbot.html          # chatbot AI
├── style.css
├── course.css
├── global.js
├── auth.js
├── siswa-nav.js
├── config.js             # URL dan anon key Supabase
├── vendor/               # (opsional) library lokal untuk Mode B
└── supabase/             # (opsional) migration untuk Supabase lokal
```

## Prasyarat

- Browser modern (Chrome, Edge, atau Firefox)
- Salah satu dari: Python 3, Node.js, atau ekstensi Live Server pada VS Code
- Khusus Mode B: [Docker](https://docs.docker.com/get-docker/) dan [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

## Menjalankan Secara Lokal

### Mode A: front end lokal, Supabase cloud (memerlukan internet)

Front end berjalan di komputer, sedangkan data tetap diambil dari Supabase cloud.

1. Clone repositori:

```bash
   git clone https://github.com/reskhadwii/NARFKIT.git
   cd NARFKIT
```

2. Isi `config.js` dengan URL dan **anon key** proyek Supabase (Supabase Dashboard → Project Settings → API Keys).

3. Jalankan server lokal. Hindari membuka file HTML langsung (`file://`) karena login dan sesi Supabase dapat bermasalah.

```bash
   # pilih salah satu
   python -m http.server 5500
   npx serve .
```

4. Buka `http://localhost:5500/landingpage.html`.

> Jika diperlukan, tambahkan `http://localhost:5500` pada Supabase → Authentication → URL Configuration → Redirect URLs.

### Mode B: mode offline untuk daerah dengan konektivitas terbatas (dalam pengembangan)

Mode ini dirancang untuk sekolah di daerah 3T yang koneksi internetnya terbatas atau tidak stabil. Seluruh komponen (front end dan Supabase) dijalankan di satu komputer, sehingga kegiatan belajar, kuis, jurnal, dan project tidak memerlukan internet setelah penyiapan awal.

Penyiapan awal memerlukan internet (untuk mengunduh Docker image dan library) dan sebaiknya dilakukan oleh guru atau teknisi sekolah pada satu komputer utama.

**1. Simpan library secara lokal**

```bash
mkdir -p vendor
curl -L -o vendor/supabase.min.js https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js
curl -L -o vendor/purify.min.js   https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js
```

Pada setiap file HTML yang memuat library tersebut (misalnya `course.html`), ganti:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js"></script>
```

menjadi:

```html
<script src="vendor/supabase.min.js"></script>
<script src="vendor/purify.min.js"></script>
```

**2. Jalankan Supabase lokal** (pastikan Docker aktif)

```bash
supabase start
supabase db reset   # menerapkan migration dan seed pada folder supabase/
```

Perintah `supabase start` menampilkan **API URL** (umumnya `http://127.0.0.1:54321`) dan **anon key** lokal.

**3. Arahkan `config.js` ke Supabase lokal**, lalu jalankan server lokal seperti pada Mode A.

**Fitur yang tetap memerlukan internet**

- Chatbot AI dan saran penilaian AI (memanggil layanan AI eksternal)
- Simulasi Wokwi (disematkan dari situs Wokwi)
- Font Montserrat (tanpa internet, tampilan memakai font cadangan)
- Materi video YouTube dan file Google Drive (gunakan file `.mp4` atau `.pdf` lokal agar dapat dibuka offline)

### Menyiapkan folder `supabase/`

Langkah ini dilakukan oleh pengembang setelah schema final, agar Mode B dapat dipakai pengguna lain.

```bash
supabase init
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db pull
git add supabase
git commit -m "Tambah migration Supabase"
```

`<PROJECT_REF>` terdapat pada URL dashboard Supabase. Migration hanya memuat struktur database. Agar Supabase lokal langsung berisi course dan soal, tambahkan data awal pada `supabase/seed.sql`. Dokumentasi: <https://supabase.com/docs/guides/local-development>

## Keamanan

- `config.js` **hanya boleh berisi URL dan anon key**. Jangan memasukkan `service_role` key atau API key layanan AI ke repositori.
- Akses data dibatasi dengan Row Level Security (RLS). Pastikan RLS aktif pada seluruh tabel.
- Kunci jawaban kuis tidak dikirim ke browser. Penilaian pilihan ganda dilakukan di sisi server melalui fungsi RPC.
- Login dan registrasi menggunakan akun Google. Registrasi guru memerlukan kode verifikasi.

## Deploy

NARF adalah situs statis sehingga dapat disajikan dari hosting statis mana pun. Data course, modul, materi, dan kuis dibaca dari Supabase saat halaman dibuka, sehingga perubahan konten tidak memerlukan deploy ulang. Deploy ulang hanya diperlukan ketika file `.html`, `.css`, atau `.js` berubah.

## Rencana Pengembangan

- Dukungan offline di sisi browser (cache halaman dan sinkronisasi data saat koneksi internet kembali tersedia)
- Penyelesaian migration dan data awal (`seed.sql`) untuk Mode B

## Pengembang

Dikembangkan oleh Reskha Dwi dan SELAMAT KEPADA TIM untuk IPDP LIDM 2026.
