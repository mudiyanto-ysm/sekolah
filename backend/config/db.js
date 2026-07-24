const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || './db/sekolah.db');
const db = new Database(dbPath);

// Aktifkan foreign key constraint
db.pragma('foreign_keys = ON');

module.exports = db;
