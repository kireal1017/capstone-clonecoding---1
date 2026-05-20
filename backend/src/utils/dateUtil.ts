// 근거: docs/04-design/data-model.md §0, design-review.md §6 (DB-02, DB-14)
// 모든 타임스탬프 컬럼(createdAt/updatedAt/deletedAt)은 이 함수의 반환값으로 명시 전달함.
// SQLite의 CURRENT_TIMESTAMP는 UTC를 반환하므로 직접 사용 금지.
//
// C안 (2026-05-20): date-fns-tz → KST 고정 오프셋(+09:00, DST 없음) 산술 기반으로 재구현.
// KST는 UTC+09:00 고정(DST 없음)이므로 +09:00 오프셋을 상수로 사용한다.
// date-fns / date-fns-tz ESM 서브패스 해석 오류(Vite 리졸버 누락 .mjs)를 원천 차단.

const KST_OFFSET_MINUTES = 9 * 60; // 540분

/**
 * 현재 시각을 KST(Asia/Seoul) ISO 8601 문자열로 반환.
 * 형식: "YYYY-MM-DDTHH:mm:ss+09:00"
 * 예:  "2026-05-20T17:00:00+09:00"
 */
export function nowKST(): string {
  const now = new Date();
  // UTC 기준 ms에 KST 오프셋(9시간)을 더해 KST 순간을 만든다.
  const kstMs = now.getTime() + KST_OFFSET_MINUTES * 60 * 1000;
  const kst = new Date(kstMs);

  const yyyy = kst.getUTCFullYear();
  const MM = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  const HH = String(kst.getUTCHours()).padStart(2, '0');
  const mm = String(kst.getUTCMinutes()).padStart(2, '0');
  const ss = String(kst.getUTCSeconds()).padStart(2, '0');

  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}+09:00`;
}
