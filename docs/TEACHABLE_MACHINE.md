# Teachable Machine Simulation

Halaman untuk **menguji model machine learning** yang dilatih siswa di
[Teachable Machine](https://teachablemachine.withgoogle.com/) (Google).
Training **tidak** dilakukan di NARFKIT, siswa melatih model langsung di web Teachable Machine,
lalu menempelkan link modelnya ke NARFKIT untuk diuji pakai webcam laptop atau **ESP32-CAM**.

---

## Ringkasan perubahan

| File | Status | Keterangan |
|---|---|---|
| `teachablemachine.html` | **Baru** | Halaman stand-alone Teachable Machine (panduan, load model, uji coba kamera) |
| `teachablemachine.css` | **Baru** | Style halaman di atas, memakai variabel tema dari `global.css` |
| `simulation.html` | Diubah | Panel Teachable Machine **dipindah** ke halaman baru. Sekarang hanya berisi Wokwi + tab navigasi |
| `simulation.css` | Diubah | Panel Wokwi jadi full-width, style TM yang tidak terpakai dihapus, tambah style tab |
| `docs/TEACHABLE_MACHINE.md` | **Baru** | Dokumen ini |

### Navigasi
- Menu navbar **SIMULATION** tetap satu. Di dalamnya ada tab:
  **Wokwi Simulator** (`simulation.html`) ↔ **Teachable Machine** (`teachablemachine.html`).
- Tidak ada menu navbar baru, jadi halaman lain tidak perlu diubah.

---

## Alur pemakaian (sisi siswa)

1. Buka halaman **Simulation → tab Teachable Machine**.
2. Klik **Mulai Training di Teachable Machine** → buat *Image Project → Standard image model*.
3. Kumpulkan sampel per kelas, klik **Train Model**.
4. **Export Model → tab Tensorflow.js → Upload my model** → copy link
   (bentuknya `https://teachablemachine.withgoogle.com/models/xxxx/`).
5. Paste link di NARFKIT → **Load**.
6. Pilih **Sumber Kamera** (Webcam Laptop / ESP32-CAM) → **▶ Mulai Kamera**, atau **Upload Gambar**.
7. Hasil prediksi tampil sebagai *Prediksi Teratas* + bar persentase tiap kelas.

> Saat ini hanya **Image Model** yang didukung (bukan Audio/Pose).

---

## Sumber kamera ESP32-CAM

Siswa cukup mengisi IP ESP32-CAM (lihat di Serial Monitor Arduino), contoh `192.168.1.20`.

| Mode | URL yang dipakai | Keterangan |
|---|---|---|
| **Stream** (default) | `http://IP:81/stream` | Video MJPEG, paling mulus |
| **Snapshot** | `http://IP/capture` | Ambil foto berulang, untuk sketch tanpa stream |

- Bisa juga mengisi port (`192.168.1.20:8080`) atau link lengkap (`http://IP:81/stream`), dipakai apa adanya.
- URL default mengikuti sketch contoh Arduino **ESP32 → Camera → CameraWebServer**.
- IP terakhir disimpan di `localStorage` (`narfkit_espcam_ip`) supaya tidak perlu diketik ulang.

### Syarat agar ESP32-CAM bisa dipakai
1. **Header CORS**: sketch ESP harus mengirim `Access-Control-Allow-Origin: *`
   (CameraWebServer bawaan sudah punya). Tanpa ini browser menolak membaca gambar,
   dan halaman akan menampilkan pesan error CORS.
2. **Satu jaringan WiFi**: laptop dan ESP32-CAM harus di jaringan yang sama.
3. **NARFKIT dibuka lewat `http`/`localhost`, bukan `https`.** ESP32-CAM hanya `http`,
   browser memblokir request `http` dari halaman `https` (*mixed content*).
   ⚠️ Kalau NARFKIT nanti di-hosting dengan https, perlu solusi tambahan (mis. proxy).
4. **Tutup halaman web bawaan ESP** saat memakai mode Stream, karena ESP32-CAM hanya melayani satu klien stream.
   Saat tombol **Stop** ditekan, koneksi stream ke ESP ditutup otomatis.

---

## Di mana model dijalankan?

| Bagian | Device |
|---|---|
| Training model | Browser siswa (di web Teachable Machine) |
| Penyimpanan file model | Server Google (setelah *Upload my model*) |
| **Inference / prediksi** | **Browser siswa di laptop/PC**, pakai TensorFlow.js (GPU via WebGL, fallback CPU) |
| ESP32-CAM | Hanya kamera, mengirim frame JPEG lewat WiFi, **tidak** menjalankan model |
| Server NARFKIT | Hanya menyajikan file statis |

Cek backend di Console browser: `tf.getBackend()` → `"webgl"` (GPU) atau `"cpu"`.

---

## Catatan teknis (untuk developer)

- **Library**: `@tensorflow/tfjs@1.3.1` + `@teachablemachine/image@0.8.5` dari jsDelivr,
  sama dengan versi di snippet export resmi Teachable Machine. Sengaja di-*pin*, jangan diganti `@latest`.
- **Tema**: memakai `data-theme` di `<html>` + key `localStorage` `narfkit_theme`
  (sama seperti `dashboardsiswa.html`, `course.html`, `chatbot.html`).
  Catatan: `simulation.html` masih memakai cara lama (`body.light-theme`), belum diseragamkan.
- **Struktur JS** (semua inline di `teachablemachine.html`):
  - `loadModel()`: memuat `model.json` + `metadata.json` dari link TM.
  - `predict(source)`: menjalankan model, update bar persentase.
  - `startCamera()` / `stopCamera()` / `cameraLoop()`: loop kamera untuk kedua sumber.
  - `espUrls(input)`: mengubah IP menjadi URL stream/capture.
  - `loadEspImage()`: memuat frame ESP dengan `crossOrigin="anonymous"`.
- **Cara menjalankan lokal**: buka lewat web server lokal (mis. VS Code *Live Server*,
  atau `npx http-server`) agar izin webcam berjalan. Jangan dobel-klik file (`file://`).

## Belum ditangani / ide lanjutan
- Dukungan model **Audio** dan **Pose** Teachable Machine.
- Template Wokwi **LED Blink** (`327868576380387922`) di `simulation.html` saat ini mengembalikan 404 dari Wokwi (masalah lama, bukan dari perubahan ini).
- Navbar belum responsif di layar HP (berlaku untuk semua halaman).
