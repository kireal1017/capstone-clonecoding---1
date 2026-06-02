import { getDb } from '../connection.js';

const SELECT_INSPECTION = `
  SELECT
    id,
    unit_id            AS unitId,
    contractor_user_id AS contractorUserId,
    inspection_type    AS inspectionType,
    flow,
    status,
    inspected_at       AS inspectedAt,
    final_opinion      AS finalOpinion,
    created_at         AS createdAt,
    updated_at         AS updatedAt
  FROM inspections
  WHERE id = ?
`;

const SELECT_ITEMS = `
  SELECT
    id,
    inspection_id AS inspectionId,
    space,
    detail_item   AS detailItem,
    state,
    category,
    problem_item  AS problemItem,
    location,
    description
  FROM inspection_items
  WHERE inspection_id = ?
  ORDER BY id
`;

const SELECT_OBS = `
  SELECT
    id,
    inspection_id      AS inspectionId,
    inspection_item_id AS inspectionItemId,
    observation_key    AS observationKey,
    value,
    note
  FROM inspection_observations
  WHERE inspection_id = ?
  ORDER BY id
`;

const SELECT_IMAGES = `
  SELECT
    id,
    inspection_id      AS inspectionId,
    inspection_item_id AS inspectionItemId,
    base64_data        AS base64Data,
    mime_type          AS mimeType,
    photo_type         AS photoType,
    caption,
    size_bytes         AS sizeBytes
  FROM inspection_images
  WHERE inspection_id = ?
  ORDER BY id
`;

export function findInspectionById(id) {
  const db = getDb();
  const insp = db.prepare(SELECT_INSPECTION).get(id);
  if (!insp) return null;
  insp.items = db.prepare(SELECT_ITEMS).all(id);
  insp.observations = db.prepare(SELECT_OBS).all(id);
  insp.images = db.prepare(SELECT_IMAGES).all(id);
  return insp;
}

const SELECT_INSPECTIONS_FOR_CONTRACTOR = `
  SELECT
    i.id,
    i.unit_id         AS unitId,
    i.inspection_type AS inspectionType,
    i.flow,
    i.status,
    i.inspected_at    AS inspectedAt,
    i.created_at      AS createdAt,
    i.updated_at      AS updatedAt,
    u.unit_label      AS unitLabel,
    b.id              AS buildingId,
    b.name            AS buildingName
  FROM inspections i
  JOIN units u     ON u.id = i.unit_id
  JOIN buildings b ON b.id = u.building_id
  WHERE i.contractor_user_id = ?
    AND i.status != 'reported'
  ORDER BY i.updated_at DESC, i.id DESC
`;

/**
 * List the contractor's own in-progress inspections (draft/submitted, not reported).
 * Used by the contractor home (작성 중 / 제출 대기). Returns lightweight rows with
 * a nested unit/building (no items/images) to keep the payload small.
 */
export function listInspectionsForContractor(userId) {
  const rows = getDb().prepare(SELECT_INSPECTIONS_FOR_CONTRACTOR).all(userId);
  return rows.map((r) => ({
    id: r.id,
    unitId: r.unitId,
    inspectionType: r.inspectionType,
    flow: r.flow,
    status: r.status,
    inspectedAt: r.inspectedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    unit: {
      id: r.unitId,
      unitLabel: r.unitLabel,
      building: { id: r.buildingId, name: r.buildingName },
    },
  }));
}

export function hasContractorPermissionOnUnit(userId, unitId) {
  return !!getDb().prepare(`
    SELECT 1 FROM unit_users
    WHERE unit_id = ? AND user_id = ? AND role_in_unit = 'contractor'
  `).get(unitId, userId);
}

export function createInspection({ unitId, contractorUserId, inspectionType, flow, inspectedAt }) {
  const db = getDb();
  const txn = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO inspections
        (unit_id, contractor_user_id, inspection_type, flow, status, inspected_at)
      VALUES (?, ?, ?, ?, 'draft', ?)
    `).run(unitId, contractorUserId, inspectionType, flow, inspectedAt ?? null);
    return Number(result.lastInsertRowid);
  });
  return txn();
}

export function updateInspectionMeta(id, { inspectedAt, finalOpinion, status }) {
  const db = getDb();
  const sets = [];
  const args = [];
  if (inspectedAt !== undefined) { sets.push('inspected_at = ?'); args.push(inspectedAt); }
  if (finalOpinion !== undefined) { sets.push('final_opinion = ?'); args.push(finalOpinion); }
  if (status !== undefined) { sets.push('status = ?'); args.push(status); }
  sets.push("updated_at = (datetime('now'))");
  if (args.length === 0) return;
  args.push(id);
  db.prepare(`UPDATE inspections SET ${sets.join(', ')} WHERE id = ?`).run(...args);
}

export function deleteInspection(id) {
  return getDb().prepare('DELETE FROM inspections WHERE id = ?').run(id).changes > 0;
}

export function replaceItems(inspectionId, items) {
  const db = getDb();
  db.prepare('DELETE FROM inspection_items WHERE inspection_id = ?').run(inspectionId);
  if (!items?.length) return;
  const stmt = db.prepare(`
    INSERT INTO inspection_items
      (inspection_id, space, detail_item, state, category, problem_item, location, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const it of items) {
    stmt.run(
      inspectionId,
      it.space ?? null,
      it.detailItem ?? null,
      it.state ?? null,
      it.category ?? null,
      it.problemItem ?? null,
      it.location ?? null,
      it.description ?? null,
    );
  }
}

export function replaceObservations(inspectionId, observations) {
  const db = getDb();
  db.prepare('DELETE FROM inspection_observations WHERE inspection_id = ?').run(inspectionId);
  if (!observations?.length) return;
  const stmt = db.prepare(`
    INSERT INTO inspection_observations
      (inspection_id, inspection_item_id, observation_key, value, note)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const o of observations) {
    stmt.run(
      inspectionId,
      o.inspectionItemId ?? null,
      o.observationKey,
      o.value,
      o.note ?? null,
    );
  }
}

export function replaceImages(inspectionId, images) {
  const db = getDb();
  db.prepare('DELETE FROM inspection_images WHERE inspection_id = ?').run(inspectionId);
  if (!images?.length) return;
  const stmt = db.prepare(`
    INSERT INTO inspection_images
      (inspection_id, inspection_item_id, base64_data, mime_type, photo_type, caption, size_bytes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const img of images) {
    stmt.run(
      inspectionId,
      img.inspectionItemId ?? null,
      img.base64Data,
      img.mimeType ?? 'image/jpeg',
      img.photoType ?? null,
      img.caption ?? null,
      img.sizeBytes ?? null,
    );
  }
}
