import { usePlanStore } from '@/features/plans/stores/planStore';
import { useCategories } from '@/features/categories/hooks/useCategories';
import type { Priority } from '@/types/domain';

/**
 * 필터 칩 그룹 (wireframe §3 FE-02) — 검색바 바로 아래, 수평 스크롤 가능.
 *
 * 그룹: 카테고리(useCategories, 다중 OR) · 중요도(높음/보통/낮음, 다중 OR) ·
 *       완료 여부("미완료만" 단일 토글) · 초기화.
 * 선택 칩 = `bg-charcoal text-white`, 미선택 = `border border-soft-border`.
 * 선택된 칩에는 × 표시(재클릭/× 로 해제). 적용 로직은 usePlanFilters.
 */

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'normal', label: '보통' },
  { value: 'low', label: '낮음' },
];

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  /** 색상 점(카테고리용, 선택). */
  color?: string;
}

function FilterChip({ label, selected, onClick, color }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'inline-flex shrink-0 items-center gap-1 rounded px-2.5 py-1 text-xs transition-colors',
        selected ? 'bg-charcoal text-white' : 'border border-soft-border bg-white text-on-surface',
      ].join(' ')}
    >
      {color ? (
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      {label}
      {selected ? (
        <span aria-hidden className="ml-0.5">
          ×
        </span>
      ) : null}
    </button>
  );
}

function PlanFilterBar() {
  const { data: categories } = useCategories();

  const selectedCategoryIds = usePlanStore((s) => s.selectedCategoryIds);
  const uncategorizedSelected = usePlanStore((s) => s.uncategorizedSelected);
  const selectedPriorities = usePlanStore((s) => s.selectedPriorities);
  const completedFilter = usePlanStore((s) => s.completedFilter);

  const toggleCategory = usePlanStore((s) => s.toggleCategory);
  const toggleUncategorized = usePlanStore((s) => s.toggleUncategorized);
  const togglePriority = usePlanStore((s) => s.togglePriority);
  const setCompletedFilter = usePlanStore((s) => s.setCompletedFilter);
  const resetFilters = usePlanStore((s) => s.resetFilters);

  const hasActive =
    selectedCategoryIds.length > 0 ||
    uncategorizedSelected ||
    selectedPriorities.length > 0 ||
    completedFilter !== 'all';

  const incompleteOnly = completedFilter === 'incomplete';

  return (
    <div
      aria-label="일정 필터"
      className="flex items-center gap-2 overflow-x-auto py-1"
    >
      {(categories ?? []).map((category) => (
        <FilterChip
          key={category.id}
          label={category.name}
          color={category.color}
          selected={selectedCategoryIds.includes(category.id)}
          onClick={() => toggleCategory(category.id)}
        />
      ))}

      <FilterChip
        label="미분류"
        color="#7a776e"
        selected={uncategorizedSelected}
        onClick={toggleUncategorized}
      />

      {PRIORITY_OPTIONS.map((opt) => (
        <FilterChip
          key={opt.value}
          label={opt.label}
          selected={selectedPriorities.includes(opt.value)}
          onClick={() => togglePriority(opt.value)}
        />
      ))}

      <FilterChip
        label="미완료만"
        selected={incompleteOnly}
        onClick={() => setCompletedFilter(incompleteOnly ? 'all' : 'incomplete')}
      />

      {hasActive ? (
        <button
          type="button"
          onClick={resetFilters}
          className="shrink-0 rounded px-2.5 py-1 text-xs text-outline transition-colors hover:text-charcoal"
        >
          초기화
        </button>
      ) : null}
    </div>
  );
}

export default PlanFilterBar;
