const bcrypt = require('bcryptjs');
const db = require('../config/db');

function seed() {
  const existingUsers = db.prepare('SELECT COUNT(*) AS total FROM users').get();
  if (existingUsers.total > 0) {
    console.log('Data sudah pernah di-seed sebelumnya. Hapus file database jika ingin seed ulang dari nol.');
    console.log('(File database ada di: backend/db/sekolah.db)');
    return;
  }

  console.log('Mulai seeding data dummy...');

  const insertUser = db.prepare(
    'INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  const insertKelas = db.prepare(
    'INSERT INTO kelas (nama_kelas, tingkat, jurusan) VALUES (?, ?, ?)'
  );
  const insertMapel = db.prepare(
    'INSERT INTO mapel (nama_mapel, kode_mapel) VALUES (?, ?)'
  );
  const insertGuru = db.prepare(
    'INSERT INTO guru (user_id, nip) VALUES (?, ?)'
  );
  const insertGuruMengajar = db.prepare(
    'INSERT INTO guru_mengajar (guru_id, kelas_id, mapel_id) VALUES (?, ?, ?)'
  );
  const insertSiswa = db.prepare(
    'INSERT INTO siswa (user_id, nis, kelas_id, jurusan, jenis_kelamin, tanggal_lahir) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const seedTransaction = db.transaction(() => {
    // Password default untuk semua akun dummy: "password123"
    // Admin pakai password terpisah: "admin123"
    const defaultHash = bcrypt.hashSync('password123', 10);
    const adminHash = bcrypt.hashSync('admin123', 10);

    // 1. Admin
    insertUser.run('Admin Sekolah', 'admin@sekolah.sch.id', adminHash, 'admin');

    // 2. Kelas
    const kelas1 = insertKelas.run('X IPA 1', 'X', 'IPA').lastInsertRowid;
    const kelas2 = insertKelas.run('XI IPA 1', 'XI', 'IPA').lastInsertRowid;
    const kelas3 = insertKelas.run('XI IPS 1', 'XI', 'IPS').lastInsertRowid;

    // 3. Mapel
    const mtk = insertMapel.run('Matematika', 'MTK').lastInsertRowid;
    const bindo = insertMapel.run('Bahasa Indonesia', 'BIND').lastInsertRowid;
    const bing = insertMapel.run('Bahasa Inggris', 'BING').lastInsertRowid;
    insertMapel.run('Fisika', 'FIS');
    insertMapel.run('Kimia', 'KIM');
    insertMapel.run('Ekonomi', 'EKO');

    // 4. Guru (2 orang)
    const userGuru1 = insertUser.run('Budi Santoso', 'budi.guru@sekolah.sch.id', defaultHash, 'guru').lastInsertRowid;
    const guru1 = insertGuru.run(userGuru1, '198001012005011001').lastInsertRowid;

    const userGuru2 = insertUser.run('Siti Aminah', 'siti.guru@sekolah.sch.id', defaultHash, 'guru').lastInsertRowid;
    const guru2 = insertGuru.run(userGuru2, '198203032006012002').lastInsertRowid;

    // 5. Penugasan mengajar
    insertGuruMengajar.run(guru1, kelas1, mtk);
    insertGuruMengajar.run(guru1, kelas2, mtk);
    insertGuruMengajar.run(guru1, kelas3, mtk);
    insertGuruMengajar.run(guru2, kelas1, bindo);
    insertGuruMengajar.run(guru2, kelas2, bindo);
    insertGuruMengajar.run(guru2, kelas3, bindo);
    insertGuruMengajar.run(guru2, kelas1, bing);

    // 6. Siswa (5 orang)
    const siswaData = [
      ['Ahmad Fauzi', 'ahmad.fauzi@siswa.sch.id', '2024001', kelas1, 'IPA', 'L', '2008-03-14'],
      ['Dewi Lestari', 'dewi.lestari@siswa.sch.id', '2024002', kelas1, 'IPA', 'P', '2008-07-22'],
      ['Rizky Pratama', 'rizky.pratama@siswa.sch.id', '2024003', kelas2, 'IPA', 'L', '2007-11-05'],
      ['Nur Aisyah', 'nur.aisyah@siswa.sch.id', '2024004', kelas3, 'IPS', 'P', '2007-01-30'],
      ['Farhan Hidayat', 'farhan.hidayat@siswa.sch.id', '2024005', kelas3, 'IPS', 'L', '2007-09-18'],
    ];

    for (const [nama, email, nis, kelasId, jurusan, jk, tglLahir] of siswaData) {
      const userId = insertUser.run(nama, email, defaultHash, 'siswa').lastInsertRowid;
      insertSiswa.run(userId, nis, kelasId, jurusan, jk, tglLahir);
    }
  });

  seedTransaction();

  console.log('Seeding selesai!\n');
  console.log('Akun yang bisa dipakai untuk login:');
  console.log('  Admin  -> admin@sekolah.sch.id / admin123');
  console.log('  Guru   -> budi.guru@sekolah.sch.id / password123');
  console.log('  Guru   -> siti.guru@sekolah.sch.id / password123');
  console.log('  Siswa  -> ahmad.fauzi@siswa.sch.id / password123');
  console.log('  (siswa lain pakai email masing-masing, password sama: password123)');
}

seed();
