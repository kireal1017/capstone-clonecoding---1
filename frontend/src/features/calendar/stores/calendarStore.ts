import { create } from 'zustand';
import { getCurrentMonthKst } from '@/lib/date/kst';

/**
 * 캘린더 UI 상태(Zustand) — 표시 중인 월과 선택된 날짜(미니 팝업 대상).
 * 데이터(plans)는 React Query 가 보관하고, 여기서는 순수 UI 상태만 둔다.
 */
interface CalendarState {
  /** 현재 표시 월(`YYYY-MM`). 초기값은 KST 기준 이번 달. */
  month: string;
  /** 미니 팝업으로 펼쳐진 날짜(`YYYY-MM-DD`). null 이면 닫힘. */
  selectedDate: string | null;
  setMonth: (month: string) => void;
  setSelectedDate: (date: string | null) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  month: getCurrentMonthKst(),
  selectedDate: null,
  setMonth: (month) => set({ month, selectedDate: null }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));
