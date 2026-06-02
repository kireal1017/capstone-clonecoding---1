// units + 권한 매핑 쿼리
import { getDb } from '../connection.js';

export function listUnitsForUser(userId, roleInUnit) {
  const rows = getDb().prepare(`
    SELECT
      u.id           AS id,
      u.unit_label   AS unit_label,
      b.id           AS building_id,
      b.name         AS building_name,
      b.address      AS building_address,
      uu.role_in_unit AS role_in_unit
    FROM units u
    JOIN unit_users uu ON uu.unit_id = u.id
    JOIN buildings b   ON b.id = u.building_id
    WHERE uu.user_id = ? AND uu.role_in_unit = ?
    ORDER BY u.id
  `).all(userId, roleInUnit);

  return rows.map(r => ({
    id: r.id,
    unitLabel: r.unit_label,
    building: {
      id: r.building_id,
      name: r.building_name,
      address: r.building_address,
    },
    roleInUnit: r.role_in_unit,
  }));
}
