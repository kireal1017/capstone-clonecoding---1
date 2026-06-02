import { getDb, closeDb } from './connection.js';

// 1x1 transparent PNG placeholder (Base64)
const PLACEHOLDER_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function seed() {
  const db = getDb();

  db.transaction(() => {
    // ── 기존 데이터 초기화 (자식 → 부모 순) ────────────────
    const childTables = [
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
    for (const t of childTables) {
      db.prepare(`DELETE FROM ${t}`).run();
      db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(t);
    }

    // ── users ─────────────────────────────────────────────
    db.prepare(`INSERT INTO users (id, name, role) VALUES (1, '이시공', 'contractor')`).run();
    db.prepare(`INSERT INTO users (id, name, role) VALUES (2, '김임대', 'owner')`).run();
    db.prepare(`INSERT INTO users (id, name, role) VALUES (3, '박임차', 'tenant')`).run();

    // ── buildings ─────────────────────────────────────────
    db.prepare(`INSERT INTO buildings (id, name, address) VALUES (1, '노원 햇살아파트', '서울특별시 노원구 햇살로 12')`).run();
    db.prepare(`INSERT INTO buildings (id, name, address) VALUES (2, '강남 푸른빌라', '서울특별시 강남구 푸른길 34')`).run();

    // ── units ─────────────────────────────────────────────
    db.prepare(`INSERT INTO units (id, building_id, unit_label) VALUES (1, 1, '1203호')`).run();
    db.prepare(`INSERT INTO units (id, building_id, unit_label) VALUES (2, 2, '201호')`).run();
    db.prepare(`INSERT INTO units (id, building_id, unit_label) VALUES (3, 1, '703호')`).run();

    // ── unit_users ────────────────────────────────────────
    const uu = db.prepare(`INSERT INTO unit_users (unit_id, user_id, role_in_unit) VALUES (?, ?, ?)`);
    uu.run(1, 2, 'owner');       // 김임대 → 1203호 owner
    uu.run(1, 3, 'tenant');      // 박임차 → 1203호 tenant
    uu.run(1, 1, 'contractor');  // 이시공 → 1203호 contractor
    uu.run(2, 2, 'owner');       // 김임대 → 201호 owner
    uu.run(2, 1, 'contractor');  // 이시공 → 201호 contractor
    uu.run(3, 2, 'owner');       // 김임대 → 703호 owner
    uu.run(3, 1, 'contractor');  // 이시공 → 703호 contractor

    // ── inspections ───────────────────────────────────────
    const insStmt = db.prepare(`
      INSERT INTO inspections (id, unit_id, contractor_user_id, inspection_type, flow, status, inspected_at, final_opinion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // ID 1: 1203호 입주전 → reported (B등급, 비교 대상 #1)
    insStmt.run(1, 1, 1, 'move_in', 'whole', 'reported', '2025-11-15',
      '입주 전 점검 결과 거실 창호와 화장실 수전에 경미한 주의 사항이 확인되었습니다. 추가 확인이 필요합니다.');

    // ID 2: 1203호 정기 → reported (C등급)
    insStmt.run(2, 1, 1, 'periodic', 'whole', 'reported', '2026-04-10',
      '정기 점검 결과 거실 창호 수리 필요, 콘센트와 수전에 주의 사항이 확인되었습니다.');

    // ID 3: 1203호 입주전 → reported (A등급, 비교 대상 #2 — id 1과 같은 호실+유형)
    insStmt.run(3, 1, 1, 'move_in', 'whole', 'reported', '2026-05-20',
      '재점검 결과 이전 주의 사항이 모두 해소되어 모든 항목이 정상으로 확인되었습니다.');

    // ID 4: 1203호 정기 → draft (작성 중)
    insStmt.run(4, 1, 1, 'periodic', 'whole', 'draft', null, null);

    // ID 5: 1203호 긴급 → submitted (제출 대기)
    insStmt.run(5, 1, 1, 'urgent', 'issue', 'submitted', '2026-05-28',
      '화장실 천장에서 누수 흔적이 확인되었습니다. 이전 수리 이력 확인이 필요합니다.');

    // ── inspection_items ──────────────────────────────────
    const itemStmt = db.prepare(`
      INSERT INTO inspection_items
        (inspection_id, space, detail_item, state, category, problem_item, location, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Inspection 1 (move_in, B등급 — caution 2)
    itemStmt.run(1, 'living',    '창호',   'caution', null, null, '거실 동측',    '실리콘 들뜸 흔적');
    itemStmt.run(1, 'bathroom',  '수전',   'caution', null, null, '화장실 세면대', '수전 흔들림 미세함');
    itemStmt.run(1, 'entrance',  '현관문', 'normal',  null, null, null, null);
    itemStmt.run(1, 'kitchen',   '싱크대', 'normal',  null, null, null, null);
    itemStmt.run(1, 'room1',     '벽지',   'normal',  null, null, null, null);
    itemStmt.run(1, 'room2',     '벽지',   'normal',  null, null, null, null);

    // Inspection 2 (periodic, C등급 — repair_needed 1 + caution 2)
    itemStmt.run(2, 'living',       '창호',   'repair_needed', null, null, '거실 동측',  '실리콘 박리 진행');
    itemStmt.run(2, 'living',       '콘센트', 'caution',       null, null, '거실 TV 옆', '흔들림');
    itemStmt.run(2, 'bathroom',     '수전',   'caution',       null, null, '화장실',     '흔들림 지속');
    itemStmt.run(2, 'entrance',     '현관문', 'normal',        null, null, null, null);
    itemStmt.run(2, 'kitchen',      '싱크대', 'normal',        null, null, null, null);
    itemStmt.run(2, 'boiler_room',  '보일러', 'normal',        null, null, null, null);

    // Inspection 3 (move_in, A등급 — 전체 normal)
    itemStmt.run(3, 'entrance',  '현관문', 'normal', null, null, null, null);
    itemStmt.run(3, 'living',    '창호',   'normal', null, null, null, null);
    itemStmt.run(3, 'kitchen',   '싱크대', 'normal', null, null, null, null);
    itemStmt.run(3, 'bathroom',  '수전',   'normal', null, null, null, null);
    itemStmt.run(3, 'balcony',   '배수',   'normal', null, null, null, null);

    // Inspection 4 (draft, 일부만)
    itemStmt.run(4, 'entrance', '현관문', 'normal',  null, null, null, null);
    itemStmt.run(4, 'living',   '창호',   'caution', null, null, '거실 동측', '작성 중');

    // Inspection 5 (urgent, issue)
    const { lastInsertRowid: item5Id } = itemStmt.run(
      5, null, null, null, 'plumbing', '누수', '화장실 천장', '누수 흔적 확인'
    );

    // ── inspection_observations ───────────────────────────
    db.prepare(`
      INSERT INTO inspection_observations (inspection_id, inspection_item_id, observation_key, value, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(5, item5Id, '누수 진행 여부', 'present', '현장 확인 시 진행 흔적 보임');

    // ── inspection_images ─────────────────────────────────
    const imgStmt = db.prepare(`
      INSERT INTO inspection_images
        (inspection_id, inspection_item_id, base64_data, mime_type, photo_type, caption, size_bytes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const PNG = PLACEHOLDER_PNG;
    // Inspection 1: 2장
    imgStmt.run(1, null, PNG, 'image/png', 'close_up', null, 100);
    imgStmt.run(1, null, PNG, 'image/png', 'overview', null, 100);
    // Inspection 2: 2장
    imgStmt.run(2, null, PNG, 'image/png', 'close_up', null, 100);
    imgStmt.run(2, null, PNG, 'image/png', 'overview', null, 100);
    // Inspection 3: 1장
    imgStmt.run(3, null, PNG, 'image/png', 'overview', null, 100);
    // Inspection 5: 1장
    imgStmt.run(5, item5Id, PNG, 'image/png', 'close_up', '화장실 천장 누수 지점', 100);

    // ── reports ───────────────────────────────────────────
    const rptStmt = db.prepare(`
      INSERT INTO reports (id, inspection_id, unit_id, contractor_user_id, inspection_type, grade)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    rptStmt.run(1, 1, 1, 1, 'move_in',  'B');
    rptStmt.run(2, 2, 1, 1, 'periodic', 'C');
    rptStmt.run(3, 3, 1, 1, 'move_in',  'A');

    // ── report_snapshots ──────────────────────────────────
    const snapStmt = db.prepare(`INSERT INTO report_snapshots (report_id, snapshot_json) VALUES (?, ?)`);

    const unitMeta = {
      id: 1, label: '1203호',
      building: { id: 1, name: '노원 햇살아파트', address: '서울특별시 노원구 햇살로 12' },
    };
    const participants = {
      contractor: { id: 1, name: '이시공' },
      owner:      { id: 2, name: '김임대' },
      tenant:     { id: 3, name: '박임차' },
    };
    const caution = '본 리포트는 점검 기록 보조용이며 법적 책임 판단 자료가 아닙니다.';

    snapStmt.run(1, JSON.stringify({
      report: { id: 1, grade: 'B', createdAt: new Date().toISOString() },
      inspection: { id: 1, type: 'move_in', flow: 'whole', inspectedAt: '2025-11-15', status: 'reported' },
      unit: unitMeta, participants,
      items: [
        { space: 'living',   detailItem: '창호',   state: 'caution',  location: '거실 동측',    description: '실리콘 들뜸 흔적' },
        { space: 'bathroom', detailItem: '수전',   state: 'caution',  location: '화장실 세면대', description: '수전 흔들림 미세함' },
        { space: 'entrance', detailItem: '현관문', state: 'normal' },
        { space: 'kitchen',  detailItem: '싱크대', state: 'normal' },
        { space: 'room1',    detailItem: '벽지',   state: 'normal' },
        { space: 'room2',    detailItem: '벽지',   state: 'normal' },
      ],
      observations: [],
      images: [{ photoType: 'close_up' }, { photoType: 'overview' }],
      finalOpinion: '입주 전 점검 결과 거실 창호와 화장실 수전에 경미한 주의 사항이 확인되었습니다. 추가 확인이 필요합니다.',
      caution,
    }));

    snapStmt.run(2, JSON.stringify({
      report: { id: 2, grade: 'C', createdAt: new Date().toISOString() },
      inspection: { id: 2, type: 'periodic', flow: 'whole', inspectedAt: '2026-04-10', status: 'reported' },
      unit: unitMeta, participants,
      items: [
        { space: 'living',      detailItem: '창호',   state: 'repair_needed', location: '거실 동측',  description: '실리콘 박리 진행' },
        { space: 'living',      detailItem: '콘센트', state: 'caution',       location: '거실 TV 옆', description: '흔들림' },
        { space: 'bathroom',    detailItem: '수전',   state: 'caution',       location: '화장실',     description: '흔들림 지속' },
        { space: 'entrance',    detailItem: '현관문', state: 'normal' },
        { space: 'kitchen',     detailItem: '싱크대', state: 'normal' },
        { space: 'boiler_room', detailItem: '보일러', state: 'normal' },
      ],
      observations: [],
      images: [{ photoType: 'close_up' }, { photoType: 'overview' }],
      finalOpinion: '정기 점검 결과 거실 창호 수리 필요, 콘센트와 수전에 주의 사항이 확인되었습니다.',
      caution,
    }));

    snapStmt.run(3, JSON.stringify({
      report: { id: 3, grade: 'A', createdAt: new Date().toISOString() },
      inspection: { id: 3, type: 'move_in', flow: 'whole', inspectedAt: '2026-05-20', status: 'reported' },
      unit: unitMeta, participants,
      items: [
        { space: 'entrance', detailItem: '현관문', state: 'normal' },
        { space: 'living',   detailItem: '창호',   state: 'normal' },
        { space: 'kitchen',  detailItem: '싱크대', state: 'normal' },
        { space: 'bathroom', detailItem: '수전',   state: 'normal' },
        { space: 'balcony',  detailItem: '배수',   state: 'normal' },
      ],
      observations: [],
      images: [{ photoType: 'overview' }],
      finalOpinion: '재점검 결과 이전 주의 사항이 모두 해소되어 모든 항목이 정상으로 확인되었습니다.',
      caution,
    }));

  })();

  // ── 결과 요약 ─────────────────────────────────────────
  const counts = {};
  for (const t of [
    'users','buildings','units','unit_users','inspections',
    'inspection_items','inspection_observations','inspection_images',
    'ai_guides','reports','report_snapshots','report_confirmations','share_links',
  ]) {
    counts[t] = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
  }
  console.log('[db:seed] seed complete:', JSON.stringify(counts, null, 2));

  const comparable = db.prepare(`
    SELECT unit_id, inspection_type, COUNT(*) AS n
    FROM reports
    GROUP BY unit_id, inspection_type
    HAVING n >= 2
  `).all();
  console.log('[db:seed] comparable groups:', JSON.stringify(comparable));

  closeDb();
}

seed();
