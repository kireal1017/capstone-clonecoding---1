import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../database/smart-inspection.sqlite');

let db = null;

export function getDb() {
  if (!db) {
    mkdirSync(join(__dirname, '../../database'), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

export function closeDb() {
  if (db) { db.close(); db = null; }
}

export { DB_PATH };
