const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

// GET /api/kelas — daftar semua kelas
router.get('/', (req, res) => {
  const kelas = db.prepare('SELECT * FROM kelas ORDER BY tingkat, nama_kelas').all();
  res.json({ data: kelas });
});

// GET /api/kelas/:id
router.get('/:id', (req, res) => {
  const kelas = db.prepare('SELECT * FROM kelas WHERE id = ?').get(req.params.id);
  if (!kelas) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
  res.json({ data: kelas });
});

// POST /api/kelas
router.post('/', (req, res) => {
  const { nama_kelas, tingkat, jurusan } = req.body;

  if (!nama_kelas || !tingkat) {
    return res.status(400).json({ message: 'nama_kelas dan tingkat wajib diisi.' });
  }
  if (!['X', 'XI', 'XII'].includes(tingkat)) {
    return res.status(400).json({ message: 'tingkat harus salah satu dari: X, XI, XII.' });
  }

  const result = db
    .prepare('INSERT INTO kelas (nama_kelas, tingkat, jurusan) VALUES (?, ?, ?)')
    .run(nama_kelas, tingkat, jurusan || null);

  res.status(201).json({ message: 'Kelas berhasil ditambahkan.', data: { id: result.lastInsertRowid, nama_kelas, tingkat, jurusan } });
});

// PUT /api/kelas/:id
router.put('/:id', (req, res) => {
  const { nama_kelas, tingkat, jurusan } = req.body;
  const existing = db.prepare('SELECT * FROM kelas WHERE id = ?').get(req.params.id);

  if (!existing) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });

  db.prepare('UPDATE kelas SET nama_kelas = ?, tingkat = ?, jurusan = ? WHERE id = ?').run(
    nama_kelas ?? existing.nama_kelas,
    tingkat ?? existing.tingkat,
    jurusan ?? existing.jurusan,
    req.params.id
  );

  res.json({ message: 'Kelas berhasil diperbarui.' });
});

// DELETE /api/kelas/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM kelas WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });

  const siswaCount = db.prepare('SELECT COUNT(*) AS total FROM siswa WHERE kelas_id = ?').get(req.params.id);
  if (siswaCount.total > 0) {
    return res.status(409).json({ message: `Kelas masih memiliki ${siswaCount.total} siswa. Pindahkan siswa terlebih dahulu.` });
  }

  db.prepare('DELETE FROM kelas WHERE id = ?').run(req.params.id);
  res.json({ message: 'Kelas berhasil dihapus.' });
});

module.exports = router;
