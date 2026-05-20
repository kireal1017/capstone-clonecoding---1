import type { Category } from '@/types/domain';

/**
 * 카테고리 표시 칩 — 색상 점 + 이름. 카테고리 관리 목록의 표시 단위.
 * (선택 가능한 폼 칩은 PlanForm 내부 CategoryChipButton 이 별도로 담당.)
 */
interface CategoryChipProps {
  category: Pick<Category, 'name' | 'color'>;
}

function CategoryChip({ category }: CategoryChipProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-on-surface">
      <span
        aria-hidden
        className="inline-block h-3 w-3 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}

export default CategoryChip;
