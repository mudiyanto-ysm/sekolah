const express = require('express');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, requireRole('siswa'));

const URUTAN_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

function getSiswa(userId) {
  return db.prepare('SELECT * FROM siswa WHERE user_id = ?').get(userId);
}

// GET /api/siswa-portal/profil — data ringkas siswa yang login (dipakai header dashboard)
router.get('/profil', (req, res) => {
  const siswa = getSiswa(req.user.id);
  if (!siswa) return res.status(404).json({ message: 'Data siswa tidak ditemukan.' });

  const kelas = siswa.kelas_id ? db.prepare('SELECT nama_kelas FROM kelas WHERE id = ?').get(siswa.kelas_id) : null;

  res.json({
    data: {
      nama: req.user.nama,
      nis: siswa.nis,
      jurusan: siswa.jurusan,
      nama_kelas: kelas ? kelas.nama_kelas : null,
    },
  });
});

// GET /api/siswa-portal/nilai?semester=&tahun_ajaran=
router.get('/nilai', (req, res) => {
  const { semester, tahun_ajaran } = req.query;
  if (!semester || !tahun_ajaran) {
    return res.status(400).json({ message: 'semester dan tahun_ajaran wajib diisi.' });
  }

  const siswa = getSiswa(req.user.id);
  if (!siswa) return res.status(404).json({ message: 'Data siswa tidak ditemukan.' });

  const rows = db
    .prepare(`
      SELECT nilai.mapel_id, mapel.nama_mapel, nilai.jenis, nilai.nilai
      FROM nilai
      JOIN mapel ON mapel.id = nilai.mapel_id
      WHERE nilai.siswa_id = ? AND nilai.semester = ? AND nilai.tahun_ajaran = ?
    `)
    .all(siswa.id, semester, tahun_ajaran);

  const byMapel = {};
  for (const row of rows) {
    if (!byMapel[row.mapel_id]) {
      byMapel[row.mapel_id] = { mapel_id: row.mapel_id, nama_mapel: row.nama_mapel, tugas: null, uts: null, uas: null };
    }
    byMapel[row.mapel_id][row.jenis] = row.nilai;
  }

  const data = Object.values(byMapel).map((m) => {
    const { tugas, uts, uas } = m;
    const nilai_akhir =
      tugas != null && uts != null && uas != null
        ? Math.round((tugas * 0.3 + uts * 0.3 + uas * 0.4) * 100) / 100
        : null;
    return { ...m, nilai_akhir };
  });

  data.sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel));

  res.json({ data });
});

// GET /api/siswa-portal/absensi?bulan=&tahun=
router.get('/absensi', (req, res) => {
  const { bulan, tahun } = req.query;
  if (!bulan || !tahun) {
    return res.status(400).json({ message: 'bulan dan tahun wajib diisi.' });
  }

  const siswa = getSiswa(req.user.id);
  if (!siswa) return res.status(404).json({ message: 'Data siswa tidak ditemukan.' });

  const bulanStr = String(bulan).padStart(2, '0');
  const prefix = `${tahun}-${bulanStr}`;

  const rows = db
    .prepare('SELECT tanggal, status FROM absensi WHERE siswa_id = ? AND tanggal LIKE ? ORDER BY tanggal')
    .all(siswa.id, `${prefix}%`);

  const counts = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
  for (const row of rows) counts[row.status] += 1;

  const total = rows.length;
  const persentaseHadir = total > 0 ? Math.round((counts.hadir / total) * 1000) / 10 : null;

  res.json({ data: { rincian: rows, ringkasan: { total, ...counts, persentase_hadir: persentaseHadir } } });
});

// GET /api/siswa-portal/jadwal — jadwal pelajaran kelas siswa yang login
router.get('/jadwal', (req, res) => {
  const siswa = getSiswa(req.user.id);
  if (!siswa) return res.status(404).json({ message: 'Data siswa tidak ditemukan.' });

  if (!siswa.kelas_id) {
    return res.json({ data: [] });
  }

  const rows = db
    .prepare(`
      SELECT jadwal.hari, jadwal.jam_mulai, jadwal.jam_selesai,
        mapel.nama_mapel, users.nama AS nama_guru
      FROM jadwal
      JOIN mapel ON mapel.id = jadwal.mapel_id
      JOIN guru ON guru.id = jadwal.guru_id
      JOIN users ON users.id = guru.user_id
      WHERE jadwal.kelas_id = ?
    `)
    .all(siswa.kelas_id);

  rows.sort((a, b) => {
    const hariDiff = URUTAN_HARI.indexOf(a.hari) - URUTAN_HARI.indexOf(b.hari);
    if (hariDiff !== 0) return hariDiff;
    return a.jam_mulai.localeCompare(b.jam_mulai);
  });

  res.json({ data: rows });
});

module.exports = router;
