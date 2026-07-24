const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { createAccountLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

const siswaCreateRules = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi.'),
  body('email').trim().notEmpty().withMessage('Email wajib diisi.').isEmail().withMessage('Format email tidak valid.'),
  body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter.'),
  body('nis').trim().notEmpty().withMessage('NIS wajib diisi.'),
];

const siswaUpdateRules = [
  body('email').optional().isEmail().withMessage('Format email tidak valid.'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password minimal 8 karakter.'),
];

const SELECT_SISWA = `
  SELECT
    siswa.id, siswa.nis, siswa.jurusan, siswa.jenis_kelamin, siswa.tanggal_lahir,
    users.id AS user_id, users.nama, users.email,
    kelas.id AS kelas_id, kelas.nama_kelas
  FROM siswa
  JOIN users ON users.id = siswa.user_id
  LEFT JOIN kelas ON kelas.id = siswa.kelas_id
`;

// GET /api/siswa?search=&page=&limit=&kelas_id=
router.get('/', (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : null;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const offset = (page - 1) * limit;
  const kelasId = req.query.kelas_id || null;

  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push('(users.nama LIKE ? OR siswa.nis LIKE ?)');
    params.push(search, search);
  }
  if (kelasId) {
    whereClauses.push('siswa.kelas_id = ?');
    params.push(kelasId);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS total FROM siswa JOIN users ON users.id = siswa.user_id ${whereSql}`)
    .get(...params);

  const data = db
    .prepare(`${SELECT_SISWA} ${whereSql} ORDER BY users.nama LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total: totalRow.total,
      totalPages: Math.ceil(totalRow.total / limit),
    },
  });
});

// GET /api/siswa/:id
router.get('/:id', (req, res) => {
  const siswa = db.prepare(`${SELECT_SISWA} WHERE siswa.id = ?`).get(req.params.id);
  if (!siswa) return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
  res.json({ data: siswa });
});

// POST /api/siswa — sekaligus membuat akun user dengan role 'siswa'
router.post('/', createAccountLimiter, siswaCreateRules, handleValidation, (req, res) => {
  const nama = req.body.nama.trim();
  const email = req.body.email.trim().toLowerCase();
  const { password, nis, kelas_id, jurusan, jenis_kelamin, tanggal_lahir } = req.body;

  const emailExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (emailExists) return res.status(409).json({ message: 'Email sudah terdaftar.' });

  const nisExists = db.prepare('SELECT id FROM siswa WHERE nis = ?').get(nis);
  if (nisExists) return res.status(409).json({ message: 'NIS sudah terdaftar.' });

  const createSiswa = db.transaction(() => {
    const passwordHash = bcrypt.hashSync(password, 10);
    const userResult = db
      .prepare('INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(nama, email, passwordHash, 'siswa');

    const siswaResult = db
      .prepare('INSERT INTO siswa (user_id, nis, kelas_id, jurusan, jenis_kelamin, tanggal_lahir) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userResult.lastInsertRowid, nis, kelas_id || null, jurusan || null, jenis_kelamin || null, tanggal_lahir || null);

    return siswaResult.lastInsertRowid;
  });

  const siswaId = createSiswa();
  const created = db.prepare(`${SELECT_SISWA} WHERE siswa.id = ?`).get(siswaId);

  res.status(201).json({ message: 'Siswa berhasil ditambahkan.', data: created });
});

// PUT /api/siswa/:id
router.put('/:id', siswaUpdateRules, handleValidation, (req, res) => {
  const { nama, nis, kelas_id, jurusan, jenis_kelamin, tanggal_lahir, password } = req.body;
  const email = req.body.email ? req.body.email.trim().toLowerCase() : undefined;

  const existing = db.prepare('SELECT * FROM siswa WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Siswa tidak ditemukan.' });

  const updateSiswa = db.transaction(() => {
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

    db.prepare('UPDATE siswa SET nis = ?, kelas_id = ?, jurusan = ?, jenis_kelamin = ?, tanggal_lahir = ? WHERE id = ?').run(
      nis ?? existing.nis,
      kelas_id ?? existing.kelas_id,
      jurusan ?? existing.jurusan,
      jenis_kelamin ?? existing.jenis_kelamin,
      tanggal_lahir ?? existing.tanggal_lahir,
      req.params.id
    );
  });

  updateSiswa();
  res.json({ message: 'Data siswa berhasil diperbarui.' });
});

// DELETE /api/siswa/:id — turut menghapus akun user-nya
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM siswa WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Siswa tidak ditemukan.' });

  db.prepare('DELETE FROM users WHERE id = ?').run(existing.user_id); // siswa ikut terhapus (ON DELETE CASCADE)
  res.json({ message: 'Siswa berhasil dihapus.' });
});

module.exports = router;
