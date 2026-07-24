const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
require('dotenv').config();

const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { loginLimiter, createAccountLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email wajib diisi.').isEmail().withMessage('Format email tidak valid.'),
  body('password').notEmpty().withMessage('Password wajib diisi.'),
];

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Dibatasi rate limit (lihat middleware/rateLimit.js) untuk mencegah brute-force.
 */
router.post('/login', loginLimiter, loginRules, handleValidation, (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ message: 'Email atau password salah.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Email atau password salah.' });
  }

  const payload = {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.json({
    message: 'Login berhasil.',
    token,
    user: payload,
  });
});

/**
 * GET /api/auth/me
 * Mengembalikan data user yang sedang login (dipakai frontend untuk cek sesi).
 */
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

const registerRules = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi.').isLength({ max: 150 }).withMessage('Nama maksimal 150 karakter.'),
  body('email').trim().notEmpty().withMessage('Email wajib diisi.').isEmail().withMessage('Format email tidak valid.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter.'),
  body('role').isIn(['admin', 'guru', 'siswa']).withMessage('Role tidak valid. Gunakan: admin, guru, atau siswa.'),
];

/**
 * POST /api/auth/register
 * Hanya admin yang boleh membuat akun baru.
 * Body: { nama, email, password, role }
 */
router.post(
  '/register',
  verifyToken,
  requireRole('admin'),
  createAccountLimiter,
  registerRules,
  handleValidation,
  (req, res) => {
    const nama = req.body.nama.trim();
    const email = req.body.email.trim().toLowerCase();
    const { password, role } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db
      .prepare('INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(nama, email, passwordHash, role);

    res.status(201).json({
      message: 'Akun berhasil dibuat.',
      user: { id: result.lastInsertRowid, nama, email, role },
    });
  }
);

module.exports = router;
