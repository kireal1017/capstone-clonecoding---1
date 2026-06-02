import { getDb } from '../connection.js';

// AI 가이드 JSON 문자열을 저장한다. reports.getLatestAiGuide() 가 파싱 가능해야 하므로
// 반드시 JSON.stringify 한 문자열로 저장한다. 반환: 새 id (Number).
export function saveAiGuide(inspectionId, guideObject) {
  const result = getDb().prepare(`
    INSERT INTO ai_guides (inspection_id, response_json)
    VALUES (?, ?)
  `).run(inspectionId, JSON.stringify(guideObject));
  return Number(result.lastInsertRowid);
}

// 해당 inspection 이 존재하는지 여부.
export function inspectionExists(inspectionId) {
  return !!getDb().prepare('SELECT 1 FROM inspections WHERE id = ?').get(inspectionId);
}
