// 근거: docs/04-design/data-model.md §0, design-review.md §6 (DB-02, DB-14)
// 모든 타임스탬프 컬럼(createdAt/updatedAt/deletedAt)은 이 함수의 반환값으로 명시 전달함.
// SQLite의 CURRENT_TIMESTAMP는 UTC를 반환하므로 직접 사용 금지.

import { formatInTimeZone } from 'date-fns-tz';

const KST_TIMEZONE = 'Asia/Seoul';
const ISO_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX";

/**
 * 현재 시각을 KST(Asia/Seoul) ISO 8601 문자열로 반환.
 * 예: "2026-05-20T17:00:00+09:00"
 */
export function nowKST(): string {
  return formatInTimeZone(new Date(), KST_TIMEZONE, ISO_FORMAT);
}
