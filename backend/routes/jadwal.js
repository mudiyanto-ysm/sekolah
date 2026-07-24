const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

const SELECT_JADWAL = `
  SELECT jadwal.id, jadwal.hari, jadwal.jam_mulai, jadwal.jam_selesai,
    kelas.id AS kelas_id, kelas.nama_kelas,
    mapel.id AS mapel_id, mapel.nama_mapel,
    guru.id AS guru_id, users.nama AS nama_guru
  FROM jadwal
  JOIN kelas ON kelas.id = jadwal.kelas_id
  JOIN mapel ON mapel.id = jadwal.mapel_id
  JOIN guru ON guru.id = jadwal.guru_id
  JOIN users ON users.id = guru.user_id
`;

const URUTAN_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

function sortJadwal(rows) {
  return rows.sort((a, b) => {
    const hariDiff = URUTAN_HARI.indexOf(a.hari) - URUTAN_HARI.indexOf(b.hari);
    if (hariDiff !== 0) return hariDiff;
    return a.jam_mulai.localeCompare(b.jam_mulai);
  });
}

// GET /api/jadwal?kelas_id=
router.get('/', (req, res) => {
  const { kelas_id } = req.query;
  const whereSql = kelas_id ? 'WHERE jadwal.kelas_id = ?' : '';
  const params = kelas_id ? [kelas_id] : [];

  const rows = db.prepare(`${SELECT_JADWAL} ${whereSql}`).all(...params);
  res.json({ data: sortJadwal(rows) });
});

// POST /api/jadwal
router.post('/', (req, res) => {
  const { kelas_id, mapel_id, guru_id, hari, jam_mulai, jam_selesai } = req.body;

  if (!kelas_id || !mapel_id || !guru_id || !hari || !jam_mulai || !jam_selesai) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }
  if (!URUTAN_HARI.includes(hari)) {
    return res.status(400).json({ message: 'Hari harus salah satu dari: ' + URUTAN_HARI.join(', ') });
  }

  const result = db
    .prepare('INSERT INTO jadwal (kelas_id, mapel_id, guru_id, hari, jam_mulai, jam_selesai) VALUES (?, ?, ?, ?, ?, ?)')
    .run(kelas_id, mapel_id, guru_id, hari, jam_mulai, jam_selesai);

  res.status(201).json({ message: 'Jadwal berhasil ditambahkan.', data: { id: result.lastInsertRowid } });
});

// PUT /api/jadwal/:id
router.put('/:id', (req, res) => {
  const { kelas_id, mapel_id, guru_id, hari, jam_mulai, jam_selesai } = req.body;
  const existing = db.prepare('SELECT * FROM jadwal WHERE id = ?').get(req.params.id);

  if (!existing) return res.status(404).json({ message: 'Jadwal tidak ditemukan.' });

  db.prepare(`
    UPDATE jadwal SET kelas_id = ?, mapel_id = ?, guru_id = ?, hari = ?, jam_mulai = ?, jam_selesai = ?
    WHERE id = ?
  `).run(
    kelas_id ?? existing.kelas_id,
    mapel_id ?? existing.mapel_id,
    guru_id ?? existing.guru_id,
    hari ?? existing.hari,
    jam_mulai ?? existing.jam_mulai,
    jam_selesai ?? existing.jam_selesai,
    req.params.id
  );

  res.json({ message: 'Jadwal berhasil diperbarui.' });
});

// DELETE /api/jadwal/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM jadwal WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Jadwal tidak ditemukan.' });

  db.prepare('DELETE FROM jadwal WHERE id = ?').run(req.params.id);
  res.json({ message: 'Jadwal berhasil dihapus.' });
});

module.exports = router;
