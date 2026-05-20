import { create } from 'zustand';
import type { Priority } from '@/types/domain';

/**
 * 완료 여부 필터(단일 선택, api-spec §4-1 `completed`).
 * - 'incomplete': 미완료만(완료 항목 제외)
 * - 'all': 완료 포함(완료 여부로 거르지 않음)
 */
export type CompletedFilter = 'incomplete' | 'all';

/**
 * 검색/필터 UI 상태(클라이언트 측). 데이터는 React Query 의 `['plans']` 캐시가
 * 전체 미삭제 세트를 보관하므로, 여기서는 검색어와 선택된 필터만 둔다.
 * 필터 적용/조합 로직은 usePlanFilters 가 담당한다.
 */
interface PlanFilterState {
  /** 검색어(title+memo substring). 비어 있으면 검색 모드 미진입. */
  searchKeyword: string;
  /** 선택된 카테고리 ID 집합(OR). */
  selectedCategoryIds: number[];
  /** 미분류 선택 여부(category_id IS NULL). 카테고리와 함께 시 OR. */
  uncategorizedSelected: boolean;
  /** 선택된 중요도 집합(OR). */
  selectedPriorities: Priority[];
  /** 완료 여부 필터(단일). 기본값 'all'(완료 포함). */
  completedFilter: CompletedFilter;
}

/**
 * 일정 영역 UI 상태(Zustand) — 주간 바 펼침 요일 + 검색/필터.
 * 데이터(plans)는 React Query 가 보관하고, 여기서는 순수 UI 상태만 둔다.
 */
interface PlanState extends PlanFilterState {
  /** 주간 바에서 선택(펼침)된 요일 인덱스(0=월 ... 6=일). null 이면 접힘. */
  selectedWeekday: number | null;
  /** 같은 요일 재클릭 시 접힘(toggle). 다른 요일이면 그 요일로 펼침. */
  toggleWeekday: (index: number) => void;

  /** 검색어 설정(SearchBar debounce 후 호출). */
  setSearchKeyword: (keyword: string) => void;
  /** 카테고리 ID 토글(있으면 제거, 없으면 추가). */
  toggleCategory: (id: number) => void;
  /** 미분류 토글. */
  toggleUncategorized: () => void;
  /** 중요도 토글. */
  togglePriority: (priority: Priority) => void;
  /** 완료 여부 필터 설정. */
  setCompletedFilter: (value: CompletedFilter) => void;
  /** 필터(검색 제외)만 초기화 — "초기화" 버튼. */
  resetFilters: () => void;
}

const initialFilterState: PlanFilterState = {
  searchKeyword: '',
  selectedCategoryIds: [],
  uncategorizedSelected: false,
  selectedPriorities: [],
  completedFilter: 'all',
};

export const usePlanStore = create<PlanState>((set) => ({
  selectedWeekday: null,
  ...initialFilterState,

  toggleWeekday: (index) =>
    set((state) => ({
      selectedWeekday: state.selectedWeekday === index ? null : index,
    })),

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  toggleCategory: (id) =>
    set((state) => ({
      selectedCategoryIds: state.selectedCategoryIds.includes(id)
        ? state.selectedCategoryIds.filter((c) => c !== id)
        : [...state.selectedCategoryIds, id],
    })),

  toggleUncategorized: () =>
    set((state) => ({ uncategorizedSelected: !state.uncategorizedSelected })),

  togglePriority: (priority) =>
    set((state) => ({
      selectedPriorities: state.selectedPriorities.includes(priority)
        ? state.selectedPriorities.filter((p) => p !== priority)
        : [...state.selectedPriorities, priority],
    })),

  setCompletedFilter: (value) => set({ completedFilter: value }),

  resetFilters: () =>
    set({
      selectedCategoryIds: [],
      uncategorizedSelected: false,
      selectedPriorities: [],
      completedFilter: 'all',
    }),
}));
