import { useMemo } from 'react';
import { useCalendarStore } from '@/features/calendar/stores/calendarStore';
import {
  formatMonthLabel,
  getMonthGridDates,
  getTodayKst,
  shiftMonth,
} from '@/lib/date/kst';
import { groupByDueDate } from '@/features/plans/hooks/usePlans';
import type { Plan } from '@/types/domain';

/** 캘린더 한 셀의 표현(날짜 + 그 날 dueDate 인 일정들 + 메타). */
export interface CalendarCellData {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  plans: Plan[];
}

/**
 * 캘린더 표시 로직 — 표시 월의 6×7 격자 셀 데이터와 월 이동 액션을 제공한다.
 * 일정은 dueDate 기준으로 셀에 배치한다(완료 포함).
 */
export function useCalendar(plans: Plan[]) {
  const month = useCalendarStore((s) => s.month);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setMonth = useCalendarStore((s) => s.setMonth);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);

  const today = getTodayKst();
  const monthPrefix = `${month}-`; // "YYYY-MM-"

  const byDueDate = useMemo(() => groupByDueDate(plans), [plans]);

  const cells = useMemo<CalendarCellData[]>(() => {
    const gridDates = getMonthGridDates(month);
    return gridDates.map((date) => ({
      date,
      dayNumber: Number(date.slice(8, 10)),
      isCurrentMonth: date.startsWith(monthPrefix),
      isToday: date === today,
      plans: byDueDate.get(date) ?? [],
    }));
  }, [month, monthPrefix, today, byDueDate]);

  const monthLabel = formatMonthLabel(month);

  const goPrevMonth = (): void => setMonth(shiftMonth(month, -1));
  const goNextMonth = (): void => setMonth(shiftMonth(month, 1));

  return {
    month,
    monthLabel,
    cells,
    selectedDate,
    setSelectedDate,
    goPrevMonth,
    goNextMonth,
  };
}
