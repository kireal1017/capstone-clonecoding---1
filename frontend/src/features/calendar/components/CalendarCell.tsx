import type { CalendarCellData } from '@/features/calendar/hooks/useCalendar';

/**
 * 캘린더 날짜 셀 — 일자 숫자 + 카테고리 색상 점(최대 3, 초과 시 "+N").
 * 오늘: charcoal 원형 배경(흰 글자). 다른 달: outline(비활성) 톤.
 * 클릭 시 상위(MonthlyCalendar)가 미니 팝업 토글.
 *
 * 색상 점은 dueDate 기준으로 배치된 일정(완료 포함). 색상 중복 제거 후 표시.
 */
interface CalendarCellProps {
  cell: CalendarCellData;
  isSelected: boolean;
  onSelect: (date: string) => void;
}

const MAX_DOTS = 3;

function CalendarCell({ cell, isSelected, onSelect }: CalendarCellProps) {
  const { date, dayNumber, isCurrentMonth, isToday, plans } = cell;

  // 카테고리 색상(미분류는 outline). 중복 색상 제거, 최대 3개 + "+N".
  const colors = Array.from(new Set(plans.map((p) => p.category?.color ?? '#7a776e')));
  const visibleColors = colors.slice(0, MAX_DOTS);
  const extraCount = colors.length - visibleColors.length;

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-label={`${dayNumber}일 일정 ${plans.length}건`}
      aria-pressed={isSelected}
      className={[
        'flex h-14 flex-col items-center gap-1 rounded p-1 text-sm transition-colors',
        isCurrentMonth ? 'text-on-surface' : 'text-outline',
        isSelected ? 'bg-surface-container-low' : 'hover:bg-surface-container-low',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-7 w-7 items-center justify-center rounded-full',
          isToday ? 'bg-charcoal text-white' : '',
        ].join(' ')}
      >
        {dayNumber}
      </span>
      <span className="flex items-center gap-0.5">
        {visibleColors.map((color, i) => (
          <span
            key={`${color}-${i}`}
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
        {extraCount > 0 ? <span className="text-[10px] text-outline">+{extraCount}</span> : null}
      </span>
    </button>
  );
}

export default CalendarCell;
