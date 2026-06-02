export const PHOTO_TYPES = [
  { value: 'overview',     label: '전체 위치' },
  { value: 'close_up',     label: '근접' },
  { value: 'scale',        label: '크기 기준' },
  { value: 'before_after', label: '전후 사진' },
  { value: 'temp_before',  label: '임시 조치 전' },
  { value: 'temp_after',   label: '임시 조치 후' },
]

export function photoTypeLabel(v) {
  return PHOTO_TYPES.find((t) => t.value === v)?.label ?? v
}
