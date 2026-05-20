import CalendarHeader from '@/features/calendar/components/CalendarHeader';
import CalendarCell from '@/features/calendar/components/CalendarCell';
import CalendarDayPopup from '@/features/calendar/components/CalendarDayPopup';
import { useCalendar } from '@/features/calendar/hooks/useCalendar';
import type { Plan } from '@/types/domain';

/**
 * 월간 캘린더 — 6×7 격자 + 월 이동 + 날짜 셀 미니 팝업(읽기 전용).
 * 일정은 dueDate 기준 배치(완료 포함). 오늘 셀 강조는 useCalendar 가 계산.
 */
interface MonthlyCalendarProps {
  plans: Plan[];
  /** 팝업 내 일정 클릭 시 상세 모달 오픈(?planId=). */
  onSelectPlan?: (planId: number) => void;
}

const WEEKDAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

function MonthlyCalendar({ plans, onSelectPlan }: MonthlyCalendarProps) {
  const { monthLabel, cells, selectedDate, setSelectedDate, goPrevMonth, goNextMonth } =
    useCalendar(plans);

  const handleSelect = (date: string): void => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  const selectedCell = cells.find((c) => c.date === selectedDate) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <CalendarHeader monthLabel={monthLabel} onPrev={goPrevMonth} onNext={goNextMonth} />

      <div className="grid grid-cols-7 text-center text-xs text-outline">
        {WEEKDAY_HEADERS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {cells.map((cell) => (
          <div key={cell.date} className="relative">
            <CalendarCell
              cell={cell}
              isSelected={cell.date === selectedDate}
              onSelect={handleSelect}
            />
            {selectedCell && selectedCell.date === cell.date ? (
              <CalendarDayPopup
                date={cell.date}
                plans={cell.plans}
                onClose={() => setSelectedDate(null)}
                {...(onSelectPlan
                  ? {
                      onSelectPlan: (planId: number) => {
                        setSelectedDate(null);
                        onSelectPlan(planId);
                      },
                    }
                  : {})}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MonthlyCalendar;
