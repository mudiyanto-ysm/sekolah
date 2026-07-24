const rateLimit = require('express-rate-limit');

/**
 * Rate limiter khusus untuk login.
 * Mencegah brute-force: maksimal 10 percobaan per 15 menit per IP.
 * Percobaan yang berhasil tidak dihitung (skipSuccessfulRequests).
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.' },
});

/**
 * Rate limiter umum untuk seluruh API.
 * Cukup longgar (300 request / 15 menit / IP) — tujuannya hanya menahan
 * penyalahgunaan otomatis (bot/script), bukan membatasi pemakaian normal.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak permintaan dari jaringan ini. Silakan coba lagi sebentar lagi.' },
});

/**
 * Rate limiter untuk endpoint yang membuat akun (register, tambah guru/siswa).
 * Lebih ketat daripada apiLimiter karena berkaitan dengan pembuatan kredensial.
 */
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak permintaan pembuatan akun. Silakan coba lagi dalam 1 jam.' },
});

module.exports = { loginLimiter, apiLimiter, createAccountLimiter };
