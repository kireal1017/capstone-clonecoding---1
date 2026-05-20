/**
 * 카테고리 태그 칩 — 색상 점 + 카테고리명(미분류는 "미분류").
 * design-reference "Serene Productivity": 색은 점으로만 절제 표현, 본문은 outline 톤.
 */
interface ChipProps {
  /** 카테고리명. null/undefined 이면 "미분류". */
  name?: string | null;
  /** 카테고리 색(HEX). 없으면 outline 회색 점. */
  color?: string | null;
}

function Chip({ name, color }: ChipProps) {
  const label = name ?? '미분류';
  const dotColor = color ?? '#7a776e';

  return (
    <span className="inline-flex items-center gap-1 rounded border border-soft-border bg-white px-2 py-0.5 text-xs text-on-surface">
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      {label}
    </span>
  );
}

export default Chip;
