# Aplikasi Manajemen Sekolah (SMA)

Struktur project ini terdiri dari dua bagian terpisah:
- `backend/` — API server (Node.js + Express + SQLite)
- `frontend/` — Antarmuka web (React + Vite + Tailwind CSS)

## Cara Menjalankan (di komputer kamu sendiri)

> Catatan: langkah `npm install` butuh koneksi internet untuk mengunduh
> package, jadi jalankan ini di komputer/laptop kamu, bukan di lingkungan
> tanpa akses internet.

### 1. Jalankan Backend

```bash
cd backend
npm install
```

**Buat tabel database & isi data dummy** (jalankan sekali saja):

```bash
npm run migrate   # membuat semua tabel dari db/schema.sql
npm run seed      # mengisi data dummy: 1 admin, 2 guru, 5 siswa, 3 kelas, 6 mapel
```

> Kalau ingin reset database dari nol (hapus semua data lalu buat ulang):
> `npm run db:reset`

Lalu jalankan servernya:

```bash
npm run dev
```

Backend akan berjalan di `http://localhost:5000`.
Cek apakah backend hidup dengan membuka `http://localhost:5000/api/health`
di browser — seharusnya muncul respons JSON status "ok".

**Akun dummy hasil seeding** (password sama untuk semua siswa/guru):

| Role  | Email                          | Password      |
|-------|--------------------------------|----------------|
| Admin | admin@sekolah.sch.id           | admin123       |
| Guru  | budi.guru@sekolah.sch.id       | password123    |
| Guru  | siti.guru@sekolah.sch.id       | password123    |
| Siswa | ahmad.fauzi@siswa.sch.id       | password123    |
| Siswa | dewi.lestari@siswa.sch.id      | password123    |
| Siswa | rizky.pratama@siswa.sch.id     | password123    |
| Siswa | nur.aisyah@siswa.sch.id        | password123    |
| Siswa | farhan.hidayat@siswa.sch.id    | password123    |

> Catatan: akun-akun ini baru bisa dipakai login setelah **Tahap 3 (Autentikasi)** dikerjakan. Untuk saat ini datanya sudah ada di database, tinggal menunggu endpoint login-nya dibuat.

## Menguji Login (Tahap 3)

Setelah backend & frontend jalan, buka `http://localhost:5173/login` lalu coba
login dengan salah satu akun dummy di atas. Kamu akan diarahkan otomatis ke
dashboard sesuai role (admin/guru/siswa).

Endpoint auth yang tersedia:
- `POST /api/auth/login` — body: `{ "email": "...", "password": "..." }`
- `GET /api/auth/me` — perlu header `Authorization: Bearer <token>`
- `POST /api/auth/register` — hanya bisa dipanggil oleh admin yang sudah login

Contoh test cepat pakai curl:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sekolah.sch.id","password":"admin123"}'
```

## Data Master: Siswa, Guru, Kelas, Mapel (Tahap 4)

Login sebagai admin, lalu buka menu **Data Siswa**, **Data Guru**, **Data Kelas**,
atau **Mata Pelajaran** di sidebar untuk mengelola data (tambah/ubah/hapus).

Endpoint API (semua butuh login sebagai admin):
- `GET/POST/PUT/DELETE /api/kelas`
- `GET/POST/PUT/DELETE /api/mapel`
- `GET/POST/PUT/DELETE /api/siswa` — mendukung `?search=&page=&limit=&kelas_id=`, otomatis membuat akun login untuk siswa baru
- `GET/POST/PUT/DELETE /api/guru` — mendukung `?search=`, termasuk pengaturan penugasan mengajar (`mengajar: [{kelas_id, mapel_id}]`)

## Fitur Nilai (Tahap 5)

Login sebagai guru (misal `budi.guru@sekolah.sch.id` / `password123`), lalu buka
menu **Input Nilai**. Pilih kelas & mapel yang diampu, semester, dan tahun
ajaran, lalu isi nilai Tugas/UTS/UAS per siswa. Nilai akhir dihitung otomatis
(30% Tugas + 30% UTS + 40% UAS) begitu ketiga nilai terisi.

Endpoint API (butuh login sebagai guru):
- `GET /api/nilai/mengajar` — daftar kelas & mapel yang diampu guru yang login
- `GET /api/nilai?kelas_id=&mapel_id=&semester=&tahun_ajaran=` — daftar siswa + nilai di kelas/mapel tsb
- `POST /api/nilai` — tambah/ubah satu nilai (upsert), body: `{ siswa_id, mapel_id, jenis, nilai, semester, tahun_ajaran }`

> Guru hanya bisa input nilai untuk kelas & mapel yang memang ditugaskan
> kepadanya (diatur admin di menu Data Guru pada Tahap 4).

## Fitur Absensi (Tahap 6)

Di menu **Absensi**, guru bisa:
- **Input Harian** — pilih kelas & tanggal, tandai status tiap siswa (Hadir/Izin/Sakit/Alpa), lalu klik Simpan Absensi. Ada tombol "Tandai semua" untuk isi cepat kalau semua siswa hadir.
- **Rekap Bulanan** — pilih kelas, bulan, dan tahun untuk melihat jumlah hadir/izin/sakit/alpa dan persentase kehadiran tiap siswa.

Endpoint API (butuh login sebagai guru):
- `GET /api/absensi/kelas-saya` — daftar kelas yang diajar guru yang login
- `GET /api/absensi?kelas_id=&tanggal=` — status kehadiran semua siswa di kelas pada tanggal tsb
- `POST /api/absensi/bulk` — simpan/ubah absensi banyak siswa sekaligus, body: `{ kelas_id, tanggal, records: [{siswa_id, status}] }`
- `GET /api/absensi/rekap?kelas_id=&bulan=&tahun=` — rekap kehadiran bulanan per siswa

> Sama seperti nilai, guru hanya bisa mengakses absensi kelas yang memang diajarnya.

## Dashboard Siswa (Tahap 7)

Login sebagai siswa (misal `ahmad.fauzi@siswa.sch.id` / `password123`), siswa bisa lihat:
- **Nilai Saya** — nilai Tugas/UTS/UAS + nilai akhir per mapel, filter semester & tahun ajaran
- **Absensi Saya** — ringkasan hadir/izin/sakit/alpa & persentase kehadiran per bulan, plus rincian per tanggal
- **Jadwal Pelajaran** — jadwal mingguan kelasnya (Senin-Jumat)

Admin juga dapat menu baru **Jadwal Pelajaran** untuk mengatur jadwal per kelas
(pilih kelas, mapel, guru, hari, jam), supaya ada data yang muncul di sisi siswa.

Endpoint API:
- `GET/POST/PUT/DELETE /api/jadwal` — khusus admin
- `GET /api/siswa-portal/profil` — khusus siswa, data diri sendiri
- `GET /api/siswa-portal/nilai?semester=&tahun_ajaran=` — khusus siswa, nilai sendiri
- `GET /api/siswa-portal/absensi?bulan=&tahun=` — khusus siswa, absensi sendiri
- `GET /api/siswa-portal/jadwal` — khusus siswa, jadwal kelas sendiri

> Semua endpoint `siswa-portal` otomatis membatasi data hanya ke siswa yang login — tidak bisa lihat data siswa lain.

### 2. Jalankan Frontend

Buka terminal baru (biarkan backend tetap jalan):

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`.
Buka di browser — halaman akan otomatis mengecek koneksi ke backend
dan menampilkan status "Backend aplikasi sekolah berjalan dengan baik"
jika semuanya terhubung dengan benar.

## Struktur Folder

```
sekolah-app/
├── backend/
│   ├── config/
│   │   └── db.js          # Koneksi database SQLite
│   ├── db/
│   │   ├── schema.sql       # Definisi semua tabel
│   │   ├── migrate.js       # Script untuk membuat tabel (npm run migrate)
│   │   ├── seed.js          # Script untuk isi data dummy (npm run seed)
│   │   └── sekolah.db       # File database SQLite (dibuat otomatis, jangan commit)
│   ├── routes/              # Route API (diisi di tahap berikutnya)
│   ├── middleware/           # Middleware auth, dll (diisi di tahap berikutnya)
│   ├── server.js            # Entry point backend
│   ├── package.json
│   └── .env                 # Konfigurasi (JANGAN commit ke git)
│
└── frontend/
    ├── src/
    │   ├── pages/            # Halaman-halaman (diisi di tahap berikutnya)
    │   ├── components/        # Komponen reusable (diisi di tahap berikutnya)
    │   ├── context/           # Context API misal untuk auth (diisi nanti)
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## Status Tahap

- [x] Tahap 1: Setup project & struktur dasar
- [x] Tahap 2: Schema database
- [x] Tahap 3: Autentikasi
- [x] Tahap 4: CRUD data master (admin)
- [x] Tahap 5: Fitur nilai (guru)
- [x] Tahap 6: Fitur absensi (guru)
- [x] Tahap 7: Dashboard siswa
- [ ] Tahap 8: Polish & testing

## Troubleshooting

- **Frontend tidak bisa konek ke backend**: pastikan backend sudah
  jalan duluan (`npm run dev` di folder `backend`) sebelum membuka frontend.
- **Error `better-sqlite3` saat install**: package ini butuh build tools
  native. Di Windows, install "windows-build-tools" atau pastikan Visual
  Studio Build Tools terpasang. Di Mac/Linux biasanya langsung jalan.
- **Port sudah dipakai**: ubah `PORT` di file `backend/.env`, dan sesuaikan
  target proxy di `frontend/vite.config.js`.
