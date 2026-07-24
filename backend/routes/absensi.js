const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, requireRole('guru'));

function getGuruId(userId) {
  const guru = db.prepare('SELECT id FROM guru WHERE user_id = ?').get(userId);
  return guru ? guru.id : null;
}

function isGuruMengajarKelas(guruId, kelasId) {
  const row = db
    .prepare('SELECT id FROM guru_mengajar WHERE guru_id = ? AND kelas_id = ? LIMIT 1')
    .get(guruId, kelasId);
  return !!row;
}

// GET /api/absensi/kelas-saya — daftar kelas (unik) yang diajar guru yang login
router.get('/kelas-saya', (req, res) => {
  const guruId = getGuruId(req.user.id);
  if (!guruId) return res.status(404).json({ message: 'Data guru tidak ditemukan.' });

  const kelasList = db
    .prepare(`
      SELECT DISTINCT kelas.id, kelas.nama_kelas
      FROM guru_mengajar
      JOIN kelas ON kelas.id = guru_mengajar.kelas_id
      WHERE guru_mengajar.guru_id = ?
      ORDER BY kelas.nama_kelas
    `)
    .all(guruId);

  res.json({ data: kelasList });
});

// GET /api/absensi?kelas_id=&tanggal=YYYY-MM-DD
router.get('/', (req, res) => {
  const { kelas_id, tanggal } = req.query;

  if (!kelas_id || !tanggal) {
    return res.status(400).json({ message: 'kelas_id dan tanggal wajib diisi.' });
  }

  const guruId = getGuruId(req.user.id);
  if (!guruId || !isGuruMengajarKelas(guruId, kelas_id)) {
    return res.status(403).json({ message: 'Kamu tidak mengajar di kelas tersebut.' });
  }

  const siswaList = db
    .prepare(`
      SELECT siswa.id AS siswa_id, siswa.nis, users.nama
      FROM siswa
      JOIN users ON users.id = siswa.user_id
      WHERE siswa.kelas_id = ?
      ORDER BY users.nama
    `)
    .all(kelas_id);

  const absensiRows = db
    .prepare('SELECT siswa_id, status FROM absensi WHERE tanggal = ? AND siswa_id IN (SELECT id FROM siswa WHERE kelas_id = ?)')
    .all(tanggal, kelas_id);

  const statusMap = {};
  for (const row of absensiRows) statusMap[row.siswa_id] = row.status;

  const data = siswaList.map((siswa) => ({
    siswa_id: siswa.siswa_id,
    nis: siswa.nis,
    nama: siswa.nama,
    status: statusMap[siswa.siswa_id] || null,
  }));

  res.json({ data });
});

// POST /api/absensi/bulk — simpan absensi satu kelas untuk satu tanggal sekaligus
// Body: { kelas_id, tanggal, records: [{ siswa_id, status }] }
router.post('/bulk', (req, res) => {
  const { kelas_id, tanggal, records } = req.body;

  if (!kelas_id || !tanggal || !Array.isArray(records)) {
    return res.status(400).json({ message: 'kelas_id, tanggal, dan records wajib diisi.' });
  }

  const guruId = getGuruId(req.user.id);
  if (!guruId || !isGuruMengajarKelas(guruId, kelas_id)) {
    return res.status(403).json({ message: 'Kamu tidak mengajar di kelas tersebut.' });
  }

  const validStatus = ['hadir', 'izin', 'sakit', 'alpa'];
  for (const record of records) {
    if (!validStatus.includes(record.status)) {
      return res.status(400).json({ message: `Status tidak valid: ${record.status}` });
    }
  }

  const upsert = db.prepare(`
    INSERT INTO absensi (siswa_id, tanggal, status)
    VALUES (?, ?, ?)
    ON CONFLICT(siswa_id, tanggal) DO UPDATE SET status = excluded.status
  `);

  const saveAll = db.transaction(() => {
    for (const record of records) {
      upsert.run(record.siswa_id, tanggal, record.status);
    }
  });

  saveAll();
  res.json({ message: 'Absensi berhasil disimpan.' });
});

// GET /api/absensi/rekap?kelas_id=&bulan=MM&tahun=YYYY — rekap kehadiran bulanan per siswa
router.get('/rekap', (req, res) => {
  const { kelas_id, bulan, tahun } = req.query;

  if (!kelas_id || !bulan || !tahun) {
    return res.status(400).json({ message: 'kelas_id, bulan, dan tahun wajib diisi.' });
  }

  const guruId = getGuruId(req.user.id);
  if (!guruId || !isGuruMengajarKelas(guruId, kelas_id)) {
    return res.status(403).json({ message: 'Kamu tidak mengajar di kelas tersebut.' });
  }

  const bulanStr = String(bulan).padStart(2, '0');
  const prefix = `${tahun}-${bulanStr}`;

  const siswaList = db
    .prepare(`
      SELECT siswa.id AS siswa_id, siswa.nis, users.nama
      FROM siswa
      JOIN users ON users.id = siswa.user_id
      WHERE siswa.kelas_id = ?
      ORDER BY users.nama
    `)
    .all(kelas_id);

  const rekap = siswaList.map((siswa) => {
    const rows = db
      .prepare("SELECT status FROM absensi WHERE siswa_id = ? AND tanggal LIKE ?")
      .all(siswa.siswa_id, `${prefix}%`);

    const total = rows.length;
    const counts = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    for (const row of rows) counts[row.status] += 1;

    const persentaseHadir = total > 0 ? Math.round((counts.hadir / total) * 1000) / 10 : null;

    return {
      siswa_id: siswa.siswa_id,
      nis: siswa.nis,
      nama: siswa.nama,
      total_hari_tercatat: total,
      ...counts,
      persentase_hadir: persentaseHadir,
    };
  });

  res.json({ data: rekap });
});

module.exports = router;
