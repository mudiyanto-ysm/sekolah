const fs = require('fs');
const path = require('path');
const db = require('../config/db');

function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Menjalankan migrasi database...');
  db.exec(schemaSql);
  console.log('Migrasi selesai. Semua tabel sudah dibuat (atau sudah ada sebelumnya).');
}

migrate();
