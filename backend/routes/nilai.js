const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, requireRole('guru'));

const BOBOT = { tugas: 0.3, uts: 0.3, uas: 0.4 };

function hitungNilaiAkhir({ tugas, uts, uas }) {
  if (tugas == null || uts == null || uas == null) return null;
  return Math.round((tugas * BOBOT.tugas + uts * BOBOT.uts + uas * BOBOT.uas) * 100) / 100;
}

function getGuruId(userId) {
  const guru = db.prepare('SELECT id FROM guru WHERE user_id = ?').get(userId);
  return guru ? guru.id : null;
}

function isGuruMengajar(guruId, kelasId, mapelId) {
  const row = db
    .prepare('SELECT id FROM guru_mengajar WHERE guru_id = ? AND kelas_id = ? AND mapel_id = ?')
    .get(guruId, kelasId, mapelId);
  return !!row;
}

// GET /api/nilai/mengajar — daftar kelas & mapel yang diampu guru yang sedang login
router.get('/mengajar', (req, res) => {
  const guruId = getGuruId(req.user.id);
  if (!guruId) return res.status(404).json({ message: 'Data guru tidak ditemukan.' });

  const mengajar = db
    .prepare(`
      SELECT guru_mengajar.id, kelas.id AS kelas_id, kelas.nama_kelas, mapel.id AS mapel_id, mapel.nama_mapel
      FROM guru_mengajar
      JOIN kelas ON kelas.id = guru_mengajar.kelas_id
      JOIN mapel ON mapel.id = guru_mengajar.mapel_id
      WHERE guru_mengajar.guru_id = ?
      ORDER BY kelas.nama_kelas, mapel.nama_mapel
    `)
    .all(guruId);

  res.json({ data: mengajar });
});

// GET /api/nilai?kelas_id=&mapel_id=&semester=&tahun_ajaran=
// Mengembalikan daftar siswa di kelas tsb beserta nilai mapel yang dipilih
router.get('/', (req, res) => {
  const { kelas_id, mapel_id, semester, tahun_ajaran } = req.query;

  if (!kelas_id || !mapel_id || !semester || !tahun_ajaran) {
    return res.status(400).json({ message: 'kelas_id, mapel_id, semester, dan tahun_ajaran wajib diisi.' });
  }

  const guruId = getGuruId(req.user.id);
  if (!guruId || !isGuruMengajar(guruId, kelas_id, mapel_id)) {
    return res.status(403).json({ message: 'Kamu tidak mengajar mapel ini di kelas tersebut.' });
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

  const nilaiRows = db
    .prepare(`
      SELECT siswa_id, jenis, nilai
      FROM nilai
      WHERE mapel_id = ? AND semester = ? AND tahun_ajaran = ?
        AND siswa_id IN (SELECT id FROM siswa WHERE kelas_id = ?)
    `)
    .all(mapel_id, semester, tahun_ajaran, kelas_id);

  const nilaiMap = {};
  for (const row of nilaiRows) {
    if (!nilaiMap[row.siswa_id]) nilaiMap[row.siswa_id] = {};
    nilaiMap[row.siswa_id][row.jenis] = row.nilai;
  }

  const data = siswaList.map((siswa) => {
    const nilai = nilaiMap[siswa.siswa_id] || {};
    return {
      siswa_id: siswa.siswa_id,
      nis: siswa.nis,
      nama: siswa.nama,
      nilai: {
        tugas: nilai.tugas ?? null,
        uts: nilai.uts ?? null,
        uas: nilai.uas ?? null,
      },
      nilai_akhir: hitungNilaiAkhir(nilai),
    };
  });

  res.json({ data });
});

// POST /api/nilai — tambah/ubah nilai satu siswa (upsert)
// Body: { siswa_id, mapel_id, jenis, nilai, semester, tahun_ajaran }
router.post('/', (req, res) => {
  const { siswa_id, mapel_id, jenis, nilai, semester, tahun_ajaran } = req.body;

  if (!siswa_id || !mapel_id || !jenis || nilai == null || !semester || !tahun_ajaran) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }
  if (!['tugas', 'uts', 'uas'].includes(jenis)) {
    return res.status(400).json({ message: 'jenis harus salah satu dari: tugas, uts, uas.' });
  }
  if (nilai < 0 || nilai > 100) {
    return res.status(400).json({ message: 'Nilai harus di antara 0 dan 100.' });
  }

  const siswa = db.prepare('SELECT * FROM siswa WHERE id = ?').get(siswa_id);
  if (!siswa) return res.status(404).json({ message: 'Siswa tidak ditemukan.' });

  const guruId = getGuruId(req.user.id);
  if (!guruId || !isGuruMengajar(guruId, siswa.kelas_id, mapel_id)) {
    return res.status(403).json({ message: 'Kamu tidak mengajar mapel ini di kelas siswa tersebut.' });
  }

  const existing = db
    .prepare('SELECT id FROM nilai WHERE siswa_id = ? AND mapel_id = ? AND jenis = ? AND semester = ? AND tahun_ajaran = ?')
    .get(siswa_id, mapel_id, jenis, semester, tahun_ajaran);

  if (existing) {
    db.prepare('UPDATE nilai SET nilai = ? WHERE id = ?').run(nilai, existing.id);
  } else {
    db.prepare(
      'INSERT INTO nilai (siswa_id, mapel_id, jenis, nilai, semester, tahun_ajaran) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(siswa_id, mapel_id, jenis, nilai, semester, tahun_ajaran);
  }

  res.json({ message: 'Nilai berhasil disimpan.' });
});

module.exports = router;
