/**
 * 캘린더 헤더 — 월 이동 버튼(< >)과 "YYYY년 M월" 라벨(wireframe §3).
 */
interface CalendarHeaderProps {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
}

function CalendarHeader({ monthLabel, onPrev, onNext }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onPrev}
        aria-label="이전 달"
        className="px-2 text-lg text-outline hover:text-charcoal"
      >
        &lt;
      </button>
      <h2 className="text-base font-medium text-charcoal">{monthLabel}</h2>
      <button
        type="button"
        onClick={onNext}
        aria-label="다음 달"
        className="px-2 text-lg text-outline hover:text-charcoal"
      >
        &gt;
      </button>
    </div>
  );
}

export default CalendarHeader;
