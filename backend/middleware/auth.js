const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Memverifikasi JWT token dari header Authorization.
 * Jika valid, data user (id, nama, email, role) disimpan di req.user.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login terlebih dahulu.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa. Silakan login kembali.' });
  }
}

/**
 * Membatasi akses endpoint hanya untuk role tertentu.
 * Contoh pemakaian: requireRole('admin') atau requireRole('admin', 'guru')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Belum terautentikasi.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Kamu tidak memiliki akses untuk melakukan aksi ini.' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
