const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { apiLimiter } = require('./middleware/rateLimit');

// --- Validasi konfigurasi penting sebelum server menyala ---
const DEFAULT_SECRET_PLACEHOLDER = 'ganti_dengan_secret_yang_aman_dan_panjang';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_SECRET_PLACEHOLDER) {
  if (process.env.NODE_ENV === 'production') {
    // Di production, jangan pernah jalan dengan secret default/kosong.
    console.error('FATAL: JWT_SECRET belum diisi dengan nilai yang aman. Set variabel lingkungan JWT_SECRET terlebih dahulu.');
    process.exit(1);
  } else {
    console.warn('PERINGATAN: JWT_SECRET masih memakai nilai default/placeholder. Ganti sebelum deploy ke production!');
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Kalau backend dijalankan di belakang reverse proxy (Nginx, Codespaces, dsb),
// aktifkan ini supaya rate limiter membaca IP asli, bukan IP proxy.
app.set('trust proxy', 1);

// --- Middleware keamanan ---
app.use(helmet());

// CORS dibatasi ke origin frontend saja. Set FRONTEND_URL di .env untuk production
// (mis. https://sekolah-app.sekolahku.sch.id). Kalau kosong, default ke localhost dev.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(express.json({ limit: '1mb' }));

// Rate limit umum untuk seluruh endpoint /api, mencegah penyalahgunaan otomatis.
app.use('/api', apiLimiter);

// Health check route — untuk memastikan backend hidup
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend aplikasi sekolah berjalan dengan baik',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/siswa', require('./routes/siswa'));
app.use('/api/guru', require('./routes/guru'));
app.use('/api/kelas', require('./routes/kelas'));
app.use('/api/mapel', require('./routes/mapel'));
app.use('/api/nilai', require('./routes/nilai'));
app.use('/api/absensi', require('./routes/absensi'));
app.use('/api/jadwal', require('./routes/jadwal'));
app.use('/api/siswa-portal', require('./routes/siswa-portal'));

// 404 — route tidak dikenal
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// --- Error handler terpusat ---
// Menangkap semua error yang dilempar (termasuk error sinkron dari better-sqlite3
// di dalam route handler) supaya: (1) server tidak crash, (2) client tidak pernah
// menerima stack trace atau detail internal, (3) semua error tetap tercatat di log.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format JSON pada body request tidak valid.' });
  }

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan pada server. Silakan coba lagi nanti.'
      : err.message || 'Terjadi kesalahan pada server.';

  res.status(err.status || 500).json({ message });
});

app.listen(PORT, () => {
  console.log(`Server backend berjalan di http://localhost:${PORT}`);
});
