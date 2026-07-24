const { validationResult } = require('express-validator');

/**
 * Dipasang setelah rules express-validator (mis. body('email').isEmail()).
 * Kalau ada error validasi, langsung balas 400 dengan daftar pesan error
 * dan handler route di bawahnya tidak akan dijalankan.
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Input tidak valid.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { handleValidation };
