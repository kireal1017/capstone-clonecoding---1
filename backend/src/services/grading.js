// 등급 산출 — 규칙 기반 (AI 미사용). 순수 함수, DB 접근 없음.
//
// items: [{ state, category }] (issue flow 항목은 state가 null일 수 있음)
// 반환: 'A' | 'B' | 'C' | 'D' | 'E'

export function computeGrade({ flow, inspectionType, items }) {
  const list = Array.isArray(items) ? items : [];

  // Auto-E (두 flow 공통, 가장 먼저 평가): 소방·안전 수리 필요 → E
  const isFireSafetyRepair = list.some(
    (i) => i.category === 'fire_safety' && i.state === 'repair_needed',
  );
  if (isFireSafetyRepair) return 'E';

  const caution = list.filter((i) => i.state === 'caution').length;
  const repair = list.filter((i) => i.state === 'repair_needed').length;

  if (flow === 'whole') {
    if (repair >= 2) return 'D';
    if (caution >= 3 || repair === 1) return 'C';
    if (caution >= 1) return 'B';
    return 'A';
  }

  // flow === 'issue'
  if (inspectionType === 'urgent' && repair >= 1) return 'E'; // 긴급 조치 필요
  if (repair >= 1) return 'D'; // 수리 필요
  if (caution >= 1) return 'C'; // 추가 확인 필요
  return 'B'; // 경미한 기록 필요 (issue flow는 'A'를 반환하지 않음)
}
