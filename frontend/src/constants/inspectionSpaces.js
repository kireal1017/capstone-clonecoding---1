export const WHOLE_SPACES = [
  { key: 'entrance',    label: '현관',    items: ['현관문', '도어락', '문틀', '신발장'] },
  { key: 'living',      label: '거실',    items: ['벽지', '바닥', '창호', '콘센트'] },
  { key: 'kitchen',     label: '주방',    items: ['싱크대', '수전', '배수', '후드'] },
  { key: 'room1',       label: '방1',     items: ['벽지', '바닥', '창호', '콘센트'] },
  { key: 'room2',       label: '방2',     items: ['벽지', '바닥', '창호', '콘센트'] },
  { key: 'bathroom',    label: '화장실',  items: ['세면대', '변기', '수전', '배수'] },
  { key: 'balcony',     label: '베란다',  items: ['창호', '바닥', '배수', '누수 흔적'] },
  { key: 'boilerroom',  label: '보일러룸', items: ['보일러', '배관', '밸브', '누수 흔적'] },
]

export const STATES = [
  { value: 'normal',       label: '정상' },
  { value: 'caution',      label: '주의' },
  { value: 'repair_needed', label: '수리 필요' },
]

/**
 * Returns a flat array of default item objects for the whole-flow template.
 * Every space × detailItem is initialised to state='normal'.
 */
export function buildDefaultItems() {
  const result = []
  for (const space of WHOLE_SPACES) {
    for (const detailItem of space.items) {
      result.push({
        space:       space.label,
        detailItem,
        state:       'normal',
        location:    '',
        description: '',
        category:    null,
        problemItem: null,
      })
    }
  }
  return result
}
