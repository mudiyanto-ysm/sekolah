const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { createAccountLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

const guruCreateRules = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi.'),
  body('email').trim().notEmpty().withMessage('Email wajib diisi.').isEmail().withMessage('Format email tidak valid.'),
  body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter.'),
  body('nip').trim().notEmpty().withMessage('NIP wajib diisi.'),
];

const guruUpdateRules = [
  body('email').optional().isEmail().withMessage('Format email tidak valid.'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password minimal 8 karakter.'),
];

const SELECT_GURU = `
  SELECT guru.id, guru.nip, users.id AS user_id, users.nama, users.email
  FROM guru
  JOIN users ON users.id = guru.user_id
`;

function getMengajarByGuruId(guruId) {
  return db
    .prepare(`
      SELECT guru_mengajar.id, kelas.id AS kelas_id, kelas.nama_kelas, mapel.id AS mapel_id, mapel.nama_mapel
      FROM guru_mengajar
      JOIN kelas ON kelas.id = guru_mengajar.kelas_id
      JOIN mapel ON mapel.id = guru_mengajar.mapel_id
      WHERE guru_mengajar.guru_id = ?
    `)
    .all(guruId);
}

// GET /api/guru?search=&page=&limit=
router.get('/', (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : null;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const offset = (page - 1) * limit;

  const whereSql = search ? 'WHERE (users.nama LIKE ? OR guru.nip LIKE ?)' : '';
  const params = search ? [search, search] : [];

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS total FROM guru JOIN users ON users.id = guru.user_id ${whereSql}`)
    .get(...params);

  const data = db
    .prepare(`${SELECT_GURU} ${whereSql} ORDER BY users.nama LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);

  const dataWithMengajar = data.map((g) => ({ ...g, mengajar: getMengajarByGuruId(g.id) }));

  res.json({
    data: dataWithMengajar,
    pagination: { page, limit, total: totalRow.total, totalPages: Math.ceil(totalRow.total / limit) },
  });
});

// GET /api/guru/:id
router.get('/:id', (req, res) => {
  const guru = db.prepare(`${SELECT_GURU} WHERE guru.id = ?`).get(req.params.id);
  if (!guru) return res.status(404).json({ message: 'Guru tidak ditemukan.' });
  res.json({ data: { ...guru, mengajar: getMengajarByGuruId(guru.id) } });
});

// POST /api/guru
router.post('/', createAccountLimiter, guruCreateRules, handleValidation, (req, res) => {
  const nama = req.body.nama.trim();
  const email = req.body.email.trim().toLowerCase();
  const { password, nip, mengajar } = req.body;

  const emailExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (emailExists) return res.status(409).json({ message: 'Email sudah terdaftar.' });

  const nipExists = db.prepare('SELECT id FROM guru WHERE nip = ?').get(nip);
  if (nipExists) return res.status(409).json({ message: 'NIP sudah terdaftar.' });

  const createGuru = db.transaction(() => {
    const passwordHash = bcrypt.hashSync(password, 10);
    const userResult = db
      .prepare('INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(nama, email, passwordHash, 'guru');

    const guruResult = db
      .prepare('INSERT INTO guru (user_id, nip) VALUES (?, ?)')
      .run(userResult.lastInsertRowid, nip);

    const guruId = guruResult.lastInsertRowid;

    if (Array.isArray(mengajar)) {
      const insertMengajar = db.prepare('INSERT INTO guru_mengajar (guru_id, kelas_id, mapel_id) VALUES (?, ?, ?)');
      for (const item of mengajar) {
        insertMengajar.run(guruId, item.kelas_id, item.mapel_id);
      }
    }

    return guruId;
  });

  const guruId = createGuru();
  const created = db.prepare(`${SELECT_GURU} WHERE guru.id = ?`).get(guruId);

  res.status(201).json({ message: 'Guru berhasil ditambahkan.', data: { ...created, mengajar: getMengajarByGuruId(guruId) } });
});

// PUT /api/guru/:id — update data dasar + ganti seluruh daftar mengajar (kalau dikirim)
router.put('/:id', guruUpdateRules, handleValidation, (req, res) => {
  const { nama, nip, password, mengajar } = req.body;
  const email = req.body.email ? req.body.email.trim().toLowerCase() : undefined;

  const existing = db.prepare('SELECT * FROM guru WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Guru tidak ditemukan.' });

  const updateGuru = db.transaction(() => {
    const userUpdates = [];
    const userParams = [];

    if (nama) { userUpdates.push('nama = ?'); userParams.push(nama); }
    if (email) { userUpdates.push('email = ?'); userParams.push(email); }
    if (password) {
      userUpdates.push('password_hash = ?');
      userParams.push(bcrypt.hashSync(password, 10));
    }

    if (userUpdates.length) {
      userParams.push(existing.user_id);
      db.prepare(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`).run(...userParams);
    }

    if (nip) {
      db.prepare('UPDATE guru SET nip = ? WHERE id = ?').run(nip, req.params.id);
    }

    if (Array.isArray(mengajar)) {
      db.prepare('DELETE FROM guru_mengajar WHERE guru_id = ?').run(req.params.id);
      const insertMengajar = db.prepare('INSERT INTO guru_mengajar (guru_id, kelas_id, mapel_id) VALUES (?, ?, ?)');
      for (const item of mengajar) {
        insertMengajar.run(req.params.id, item.kelas_id, item.mapel_id);
      }
    }
  });

  updateGuru();
  res.json({ message: 'Data guru berhasil diperbarui.' });
});

// DELETE /api/guru/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM guru WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Guru tidak ditemukan.' });

  db.prepare('DELETE FROM users WHERE id = ?').run(existing.user_id); // guru & guru_mengajar ikut terhapus (ON DELETE CASCADE)
  res.json({ message: 'Guru berhasil dihapus.' });
});

module.exports = router;
