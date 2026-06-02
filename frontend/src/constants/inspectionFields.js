export const PROBLEM_FIELDS = [
  { category: 'interior',    label: '인테리어·마감', items: ['벽지 찢어짐', '벽지 오염', '바닥 찍힘', '몰딩 파손', '타일 균열'] },
  { category: 'window',      label: '샷시·창호',     items: ['방충망 찢어짐', '창문 작동 불량', '유리 파손', '실리콘 들뜸', '잠금장치 불량'] },
  { category: 'plumbing',    label: '설비·배관',     items: ['누수', '배수 불량', '수전 흔들림', '보일러 이상', '배관 부식'] },
  { category: 'electrical',  label: '전기',          items: ['콘센트 불량', '조명 미작동', '스위치 불량', '차단기 이상', '배선 노출'] },
  { category: 'fire_safety', label: '소방·안전',     items: ['감지기 미작동', '소화기 미비', '가스누설 의심', '비상등 불량', '안전 위험 요소'] },
]

export const DEFAULT_OBSERVATIONS = [
  '외부 충격 흔적',
  '부식·노후 흔적',
  '연결부 이상',
  '이전 수리 이력',
]

export const OBSERVATION_VALUES = [
  { value: 'present',    label: '있음' },
  { value: 'absent',     label: '없음' },
  { value: 'need_check', label: '확인 필요' },
]

export const ISSUE_STATES = [
  { value: 'caution',       label: '주의' },
  { value: 'repair_needed', label: '수리 필요' },
]

export function categoryLabel(category) {
  return PROBLEM_FIELDS.find((f) => f.category === category)?.label ?? category
}

export function problemItemsFor(category) {
  return PROBLEM_FIELDS.find((f) => f.category === category)?.items ?? []
}
