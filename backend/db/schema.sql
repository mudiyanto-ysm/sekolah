-- Schema database aplikasi manajemen sekolah (SMA)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kelas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_kelas TEXT NOT NULL,        -- contoh: "X IPA 1"
  tingkat TEXT NOT NULL,            -- X, XI, XII
  jurusan TEXT                      -- IPA, IPS, Bahasa (boleh kosong untuk kelas X)
);

CREATE TABLE IF NOT EXISTS mapel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_mapel TEXT NOT NULL,
  kode_mapel TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS siswa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  kelas_id INTEGER,
  jurusan TEXT,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P')),
  tanggal_lahir TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS guru (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nip TEXT UNIQUE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Menyimpan mapel + kelas apa saja yang diampu oleh seorang guru
CREATE TABLE IF NOT EXISTS guru_mengajar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guru_id INTEGER NOT NULL,
  kelas_id INTEGER NOT NULL,
  mapel_id INTEGER NOT NULL,
  FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id) REFERENCES mapel(id) ON DELETE CASCADE,
  UNIQUE (guru_id, kelas_id, mapel_id)
);

CREATE TABLE IF NOT EXISTS nilai (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siswa_id INTEGER NOT NULL,
  mapel_id INTEGER NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('tugas', 'uts', 'uas')),
  nilai REAL NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  tahun_ajaran TEXT NOT NULL,        -- contoh: "2025/2026"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id) REFERENCES mapel(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS absensi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siswa_id INTEGER NOT NULL,
  tanggal TEXT NOT NULL,              -- format YYYY-MM-DD
  status TEXT NOT NULL CHECK (status IN ('hadir', 'izin', 'sakit', 'alpa')),
  FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
  UNIQUE (siswa_id, tanggal)
);

CREATE TABLE IF NOT EXISTS jadwal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kelas_id INTEGER NOT NULL,
  mapel_id INTEGER NOT NULL,
  guru_id INTEGER NOT NULL,
  hari TEXT NOT NULL CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat')),
  jam_mulai TEXT NOT NULL,            -- format "07:00"
  jam_selesai TEXT NOT NULL,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id) REFERENCES mapel(id) ON DELETE CASCADE,
  FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE
);

-- Index untuk mempercepat query yang sering dipakai
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai(siswa_id);
CREATE INDEX IF NOT EXISTS idx_absensi_siswa_tanggal ON absensi(siswa_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas ON jadwal(kelas_id);
