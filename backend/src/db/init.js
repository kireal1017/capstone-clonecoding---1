import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb, closeDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_PATH = join(__dirname, 'schema.sql');
const FORCE = process.argv.includes('--force');

function dropAll(db) {
  const tables = [
    'share_links',
    'report_confirmations',
    'report_snapshots',
    'reports',
    'ai_guides',
    'inspection_images',
    'inspection_observations',
    'inspection_items',
    'inspections',
    'unit_users',
    'units',
    'buildings',
    'users',
  ];
  db.pragma('foreign_keys = OFF');
  for (const t of tables) {
    db.prepare(`DROP TABLE IF EXISTS ${t}`).run();
  }
  db.pragma('foreign_keys = ON');
}

function init() {
  const db = getDb();
  if (FORCE) {
    console.log('[db:init] --force: dropping all tables...');
    dropAll(db);
  }
  const sql = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(sql);
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    )
    .all()
    .map((r) => r.name);
  console.log(`[db:init] tables created (${tables.length}):`, tables.join(', '));
  closeDb();
}

init();
