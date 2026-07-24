const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

// GET /api/mapel
router.get('/', (req, res) => {
  const mapel = db.prepare('SELECT * FROM mapel ORDER BY nama_mapel').all();
  res.json({ data: mapel });
});

// GET /api/mapel/:id
router.get('/:id', (req, res) => {
  const mapel = db.prepare('SELECT * FROM mapel WHERE id = ?').get(req.params.id);
  if (!mapel) return res.status(404).json({ message: 'Mapel tidak ditemukan.' });
  res.json({ data: mapel });
});

// POST /api/mapel
router.post('/', (req, res) => {
  const { nama_mapel, kode_mapel } = req.body;

  if (!nama_mapel || !kode_mapel) {
    return res.status(400).json({ message: 'nama_mapel dan kode_mapel wajib diisi.' });
  }

  const existing = db.prepare('SELECT id FROM mapel WHERE kode_mapel = ?').get(kode_mapel);
  if (existing) {
    return res.status(409).json({ message: 'Kode mapel sudah dipakai.' });
  }

  const result = db
    .prepare('INSERT INTO mapel (nama_mapel, kode_mapel) VALUES (?, ?)')
    .run(nama_mapel, kode_mapel);

  res.status(201).json({ message: 'Mapel berhasil ditambahkan.', data: { id: result.lastInsertRowid, nama_mapel, kode_mapel } });
});

// PUT /api/mapel/:id
router.put('/:id', (req, res) => {
  const { nama_mapel, kode_mapel } = req.body;
  const existing = db.prepare('SELECT * FROM mapel WHERE id = ?').get(req.params.id);

  if (!existing) return res.status(404).json({ message: 'Mapel tidak ditemukan.' });

  db.prepare('UPDATE mapel SET nama_mapel = ?, kode_mapel = ? WHERE id = ?').run(
    nama_mapel ?? existing.nama_mapel,
    kode_mapel ?? existing.kode_mapel,
    req.params.id
  );

  res.json({ message: 'Mapel berhasil diperbarui.' });
});

// DELETE /api/mapel/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM mapel WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Mapel tidak ditemukan.' });

  db.prepare('DELETE FROM mapel WHERE id = ?').run(req.params.id);
  res.json({ message: 'Mapel berhasil dihapus.' });
});

module.exports = router;
