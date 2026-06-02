import crypto from 'node:crypto';
import { getDb } from '../connection.js';

// 호실 + 건물 정보 (스냅샷 unit 메타)
export function getUnitWithBuilding(unitId) {
  const row = getDb().prepare(`
    SELECT
      u.id         AS id,
      u.unit_label AS label,
      b.id         AS buildingId,
      b.name       AS buildingName,
      b.address    AS buildingAddress
    FROM units u
    JOIN buildings b ON b.id = u.building_id
    WHERE u.id = ?
  `).get(unitId);
  if (!row) return null;
  return {
    id: row.id,
    label: row.label,
    building: {
      id: row.buildingId,
      name: row.buildingName,
      address: row.buildingAddress,
    },
  };
}

// 호실 참여자 (role별 첫 사용자)
export function getUnitParticipants(unitId) {
  const rows = getDb().prepare(`
    SELECT
      uu.role_in_unit AS roleInUnit,
      us.id           AS userId,
      us.name         AS name
    FROM unit_users uu
    JOIN users us ON us.id = uu.user_id
    WHERE uu.unit_id = ?
    ORDER BY uu.id
  `).all(unitId);

  const pick = (role) => {
    const r = rows.find((x) => x.roleInUnit === role);
    return r ? { id: r.userId, name: r.name } : null;
  };

  return {
    contractor: pick('contractor'),
    owner: pick('owner'),
    tenant: pick('tenant'),
  };
}

// 최신 AI 가이드 (response_json 파싱). 없거나 파싱 실패 시 null.
export function getLatestAiGuide(inspectionId) {
  const row = getDb().prepare(`
    SELECT response_json AS responseJson
    FROM ai_guides
    WHERE inspection_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(inspectionId);
  if (!row || row.responseJson == null) return null;
  try {
    return JSON.parse(row.responseJson);
  } catch {
    return null;
  }
}

// 이미 생성된 리포트 탐지용
export function findReportByInspectionId(inspectionId) {
  return getDb().prepare(`
    SELECT
      id,
      inspection_id      AS inspectionId,
      unit_id            AS unitId,
      contractor_user_id AS contractorUserId,
      inspection_type    AS inspectionType,
      grade,
      created_at         AS createdAt
    FROM reports
    WHERE inspection_id = ?
  `).get(inspectionId) ?? null;
}

// 리포트 + 스냅샷 생성 + inspection 상태 전이를 단일 트랜잭션으로 처리.
// snapshot은 OBJECT로 전달; 트랜잭션 내부에서 report.id를 주입한 뒤 stringify.
// 반환: 새 reportId (Number)
export function createReportWithSnapshot({
  inspectionId,
  unitId,
  contractorUserId,
  inspectionType,
  grade,
  snapshot,
}) {
  const db = getDb();
  const txn = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO reports
        (inspection_id, unit_id, contractor_user_id, inspection_type, grade)
      VALUES (?, ?, ?, ?, ?)
    `).run(inspectionId, unitId, contractorUserId, inspectionType, grade);
    const reportId = Number(result.lastInsertRowid);

    snapshot.report.id = reportId;
    db.prepare(`
      INSERT INTO report_snapshots (report_id, snapshot_json)
      VALUES (?, ?)
    `).run(reportId, JSON.stringify(snapshot));

    db.prepare(`
      UPDATE inspections
      SET status = 'reported', updated_at = (datetime('now'))
      WHERE id = ?
    `).run(inspectionId);

    return reportId;
  });
  return txn();
}

// ── B07: Report 조회 / 확인 / 공유 ──────────────────────────────

// 특정 호실에서 사용자의 role_in_unit. 여러 행이면 owner > tenant > contractor 우선.
export function getUserRoleOnUnit(userId, unitId) {
  const rows = getDb().prepare(`
    SELECT role_in_unit AS roleInUnit
    FROM unit_users
    WHERE unit_id = ? AND user_id = ?
  `).all(unitId, userId);
  const roles = new Set(rows.map((r) => r.roleInUnit));
  if (roles.has('owner')) return 'owner';
  if (roles.has('tenant')) return 'tenant';
  if (roles.has('contractor')) return 'contractor';
  return null;
}

// 호실 접근 권한 존재 여부
export function hasUnitAccess(userId, unitId) {
  const row = getDb().prepare(`
    SELECT 1
    FROM unit_users
    WHERE unit_id = ? AND user_id = ?
    LIMIT 1
  `).get(unitId, userId);
  return !!row;
}

// 사용자가 접근 가능한 호실의 리포트 목록 (최신순)
export function listReportsForUser(userId) {
  const rows = getDb().prepare(`
    SELECT
      r.id              AS id,
      r.inspection_type AS inspectionType,
      r.grade           AS grade,
      r.created_at      AS createdAt,
      u.id              AS unitId,
      u.unit_label      AS unitLabel,
      b.id              AS buildingId,
      b.name            AS buildingName,
      b.address         AS buildingAddress
    FROM reports r
    JOIN units u     ON u.id = r.unit_id
    JOIN buildings b ON b.id = u.building_id
    WHERE r.unit_id IN (SELECT unit_id FROM unit_users WHERE user_id = ?)
    ORDER BY r.created_at DESC, r.id DESC
  `).all(userId);

  return rows.map((row) => ({
    id: row.id,
    inspectionType: row.inspectionType,
    grade: row.grade,
    createdAt: row.createdAt,
    unit: {
      id: row.unitId,
      label: row.unitLabel,
      building: {
        id: row.buildingId,
        name: row.buildingName,
        address: row.buildingAddress,
      },
    },
    roleInUnit: getUserRoleOnUnit(userId, row.unitId),
  }));
}

// 단일 리포트 행
export function getReportRow(reportId) {
  return getDb().prepare(`
    SELECT
      id,
      inspection_id      AS inspectionId,
      unit_id            AS unitId,
      contractor_user_id AS contractorUserId,
      inspection_type    AS inspectionType,
      grade,
      created_at         AS createdAt
    FROM reports
    WHERE id = ?
  `).get(reportId) ?? null;
}

// 스냅샷(JSON 파싱). 없거나 파싱 실패 시 null.
export function getSnapshotByReportId(reportId) {
  const row = getDb().prepare(`
    SELECT snapshot_json AS snapshotJson
    FROM report_snapshots
    WHERE report_id = ?
  `).get(reportId);
  if (!row || row.snapshotJson == null) return null;
  try {
    return JSON.parse(row.snapshotJson);
  } catch {
    return null;
  }
}

// 확인 내역 목록
export function listConfirmations(reportId) {
  return getDb().prepare(`
    SELECT
      c.user_id        AS userId,
      us.name          AS name,
      c.confirmed_role AS confirmedRole,
      c.confirmed_at   AS confirmedAt
    FROM report_confirmations c
    JOIN users us ON us.id = c.user_id
    WHERE c.report_id = ?
    ORDER BY c.confirmed_at
  `).all(reportId);
}

// 확인 추가 (멱등). 새로 삽입되면 inserted=true.
export function addConfirmation(reportId, userId, confirmedRole) {
  const result = getDb().prepare(`
    INSERT OR IGNORE INTO report_confirmations (report_id, user_id, confirmed_role)
    VALUES (?, ?, ?)
  `).run(reportId, userId, confirmedRole);
  return { inserted: result.changes > 0 };
}

// 공유 링크 생성
export function createShareLink(reportId, userId) {
  const token = crypto.randomBytes(16).toString('hex');
  const result = getDb().prepare(`
    INSERT INTO share_links (report_id, token, created_by_user_id)
    VALUES (?, ?, ?)
  `).run(reportId, token, userId);
  return { token, id: Number(result.lastInsertRowid) };
}

// 공유 링크 목록
export function listShareLinks(reportId) {
  return getDb().prepare(`
    SELECT
      token,
      created_by_user_id AS createdByUserId,
      created_at         AS createdAt
    FROM share_links
    WHERE report_id = ?
    ORDER BY id
  `).all(reportId);
}

// 토큰으로 리포트 탐색 (PUBLIC 공유 조회용)
export function findReportByShareToken(token) {
  return getDb().prepare(`
    SELECT
      r.id              AS reportId,
      r.inspection_id   AS inspectionId,
      r.unit_id         AS unitId,
      r.contractor_user_id AS contractorUserId,
      r.inspection_type AS inspectionType,
      r.grade           AS grade,
      r.created_at      AS createdAt
    FROM share_links s
    JOIN reports r ON r.id = s.report_id
    WHERE s.token = ?
  `).get(token) ?? null;
}
