import { create } from 'zustand';

/**
 * 일정 영역 UI 상태(Zustand) — 주간 바에서 펼쳐진 요일 인덱스.
 * 데이터(plans)는 React Query 가 보관하고, 여기서는 순수 UI 상태만 둔다.
 */
interface PlanState {
  /** 주간 바에서 선택(펼침)된 요일 인덱스(0=월 ... 6=일). null 이면 접힘. */
  selectedWeekday: number | null;
  /** 같은 요일 재클릭 시 접힘(toggle). 다른 요일이면 그 요일로 펼침. */
  toggleWeekday: (index: number) => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  selectedWeekday: null,
  toggleWeekday: (index) =>
    set((state) => ({
      selectedWeekday: state.selectedWeekday === index ? null : index,
    })),
}));
