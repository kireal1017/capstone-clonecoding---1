export const INSPECTION_TYPES = [
  {
    value: 'move_in',
    label: '입주 전 점검',
    description: '입주 전 집 상태를 기준 자료로 남깁니다.',
    flow: 'whole',
  },
  {
    value: 'periodic',
    label: '정기 점검',
    description: '노후화나 이상 징후를 주기적으로 확인합니다.',
    flow: 'whole',
  },
  {
    value: 'move_out_pre',
    label: '퇴거 전 점검',
    description: '퇴거 전에 문제 항목을 미리 확인합니다.',
    flow: 'issue',
  },
  {
    value: 'move_out_post',
    label: '퇴거 후 점검',
    description: '입주 전 기록과 비교할 상태를 남깁니다.',
    flow: 'issue',
  },
  {
    value: 'urgent',
    label: '긴급 점검',
    description: '누수, 정전, 파손 등 즉시 조치 상황을 기록합니다.',
    flow: 'issue',
  },
  {
    value: 'repair_pre',
    label: '수리 전 점검',
    description: '수리 범위와 상태를 확인합니다.',
    flow: 'issue',
  },
  {
    value: 'repair_post',
    label: '수리 후 점검',
    description: '수리 완료 상태를 확인합니다.',
    flow: 'issue',
  },
]

export function labelOf(value) {
  return INSPECTION_TYPES.find((t) => t.value === value)?.label ?? value
}

export function flowLabel(flow) {
  if (flow === 'whole') return '집 전체 빠른 확인'
  if (flow === 'issue') return '문제 항목 점검'
  return flow
}
