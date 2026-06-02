PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  role        TEXT    NOT NULL CHECK (role IN ('contractor','owner','tenant')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 2. buildings
CREATE TABLE IF NOT EXISTS buildings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  address    TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 3. units
CREATE TABLE IF NOT EXISTS units (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_label  TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_units_building ON units(building_id);

-- 4. unit_users
CREATE TABLE IF NOT EXISTS unit_users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id      INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_unit TEXT    NOT NULL CHECK (role_in_unit IN ('owner','tenant','contractor')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (unit_id, user_id, role_in_unit)
);
CREATE INDEX IF NOT EXISTS idx_unit_users_user ON unit_users(user_id);
CREATE INDEX IF NOT EXISTS idx_unit_users_unit ON unit_users(unit_id);

-- 5. inspections
CREATE TABLE IF NOT EXISTS inspections (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id             INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  contractor_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  inspection_type     TEXT    NOT NULL CHECK (inspection_type IN ('move_in','periodic','move_out_pre','move_out_post','urgent','repair_pre','repair_post')),
  flow                TEXT    NOT NULL CHECK (flow IN ('whole','issue')),
  status              TEXT    NOT NULL CHECK (status IN ('draft','submitted','reported')) DEFAULT 'draft',
  inspected_at        TEXT,
  final_opinion       TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inspections_unit ON inspections(unit_id);
CREATE INDEX IF NOT EXISTS idx_inspections_contractor ON inspections(contractor_user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);

-- 6. inspection_items
CREATE TABLE IF NOT EXISTS inspection_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id   INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  space           TEXT,
  detail_item     TEXT,
  state           TEXT CHECK (state IN ('normal','caution','repair_needed')),
  category        TEXT CHECK (category IN ('interior','window','plumbing','electrical','fire_safety')),
  problem_item    TEXT,
  location        TEXT,
  description     TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_items_inspection ON inspection_items(inspection_id);

-- 7. inspection_observations
CREATE TABLE IF NOT EXISTS inspection_observations (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id       INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  inspection_item_id  INTEGER REFERENCES inspection_items(id) ON DELETE CASCADE,
  observation_key     TEXT    NOT NULL,
  value               TEXT    NOT NULL CHECK (value IN ('present','absent','need_check')),
  note                TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_obs_inspection ON inspection_observations(inspection_id);

-- 8. inspection_images
CREATE TABLE IF NOT EXISTS inspection_images (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id       INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  inspection_item_id  INTEGER REFERENCES inspection_items(id) ON DELETE CASCADE,
  base64_data         TEXT    NOT NULL,
  mime_type           TEXT    NOT NULL DEFAULT 'image/jpeg',
  photo_type          TEXT CHECK (photo_type IN ('overview','close_up','scale','before_after','temp_before','temp_after')),
  caption             TEXT,
  size_bytes          INTEGER,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_images_inspection ON inspection_images(inspection_id);

-- 9. ai_guides
CREATE TABLE IF NOT EXISTS ai_guides (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id   INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  response_json   TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ai_inspection ON ai_guides(inspection_id);

-- 10. reports
CREATE TABLE IF NOT EXISTS reports (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id       INTEGER NOT NULL UNIQUE REFERENCES inspections(id) ON DELETE RESTRICT,
  unit_id             INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  contractor_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  inspection_type     TEXT    NOT NULL,
  grade               TEXT    NOT NULL CHECK (grade IN ('A','B','C','D','E')),
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_unit_type ON reports(unit_id, inspection_type);

-- 11. report_snapshots
CREATE TABLE IF NOT EXISTS report_snapshots (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id     INTEGER NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  snapshot_json TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 12. report_confirmations
CREATE TABLE IF NOT EXISTS report_confirmations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id       INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmed_role  TEXT    NOT NULL CHECK (confirmed_role IN ('owner','tenant')),
  confirmed_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (report_id, user_id, confirmed_role)
);
CREATE INDEX IF NOT EXISTS idx_confirm_report ON report_confirmations(report_id);

-- 13. share_links
CREATE TABLE IF NOT EXISTS share_links (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id            INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  token                TEXT    NOT NULL UNIQUE,
  created_by_user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_share_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_report ON share_links(report_id);
