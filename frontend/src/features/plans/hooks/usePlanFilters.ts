import { useMemo } from 'react';
import { usePlanStore, type CompletedFilter } from '@/features/plans/stores/planStore';
import type { Plan, Priority } from '@/types/domain';

/**
 * 검색·필터 로직(클라이언트 측, api-spec §4-1 / DB-07 의미 재현).
 *
 * 데이터 소스는 React Query `['plans']` 캐시가 보관하는 전체 미삭제 세트이며,
 * 여기서 메모리상으로 거른다(재요청 없음). 따라서 "검색 = 전체 기간"이
 * 자연히 성립한다(월 한정 없음).
 *
 * 조합 규칙(DB-07):
 *  - 카테고리: 그룹 내 OR
 *  - 중요도: 그룹 내 OR
 *  - 완료 여부: 단일
 *  - 세 그룹 간: AND
 *  - 미분류 + 카테고리: OR (category_id IS NULL OR category_id IN ids)
 *  - 검색(search): title + memo substring, 별도 AND 조건으로 결합
 */

/** 선택된 필터(검색 제외) 표현 — 순수 함수 입력용. */
export interface ActiveFilters {
  categoryIds: number[];
  uncategorized: boolean;
  priorities: Priority[];
  completed: CompletedFilter;
}

/** 검색어 정규화(trim + 소문자). 빈 문자열이면 검색 비활성. */
export function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

/** title + memo substring 매칭(대소문자 무시). 키워드 공백뿐이면 항상 true. */
export function matchesSearch(plan: Plan, normalizedKeyword: string): boolean {
  if (normalizedKeyword === '') return true;
  const haystack = `${plan.title} ${plan.memo ?? ''}`.toLowerCase();
  return haystack.includes(normalizedKeyword);
}

/** 카테고리 그룹(카테고리 OR + 미분류 OR) 매칭. 그룹 미선택 시 통과. */
export function matchesCategoryGroup(
  plan: Plan,
  categoryIds: number[],
  uncategorized: boolean,
): boolean {
  if (categoryIds.length === 0 && !uncategorized) return true;
  const byId = plan.categoryId !== null && categoryIds.includes(plan.categoryId);
  const byUncategorized = uncategorized && plan.categoryId === null;
  return byId || byUncategorized;
}

/** 중요도 그룹(OR) 매칭. 그룹 미선택 시 통과. */
export function matchesPriorityGroup(plan: Plan, priorities: Priority[]): boolean {
  if (priorities.length === 0) return true;
  return priorities.includes(plan.priority);
}

/** 완료 여부(단일). 'all' 이면 통과, 'incomplete' 이면 미완료만. */
export function matchesCompleted(plan: Plan, completed: CompletedFilter): boolean {
  if (completed === 'all') return true;
  return !plan.isCompleted;
}

/**
 * 활성 필터(검색 제외)만 적용. 캘린더·주간 바·오늘 할 일이 공통으로 사용한다.
 * 세 그룹은 AND 로 결합.
 */
export function applyFilters(plans: Plan[], filters: ActiveFilters): Plan[] {
  const hasAny =
    filters.categoryIds.length > 0 ||
    filters.uncategorized ||
    filters.priorities.length > 0 ||
    filters.completed !== 'all';
  if (!hasAny) return plans;
  return plans.filter(
    (plan) =>
      matchesCategoryGroup(plan, filters.categoryIds, filters.uncategorized) &&
      matchesPriorityGroup(plan, filters.priorities) &&
      matchesCompleted(plan, filters.completed),
  );
}

/**
 * 검색 + 활성 필터 모두 적용(검색 모드 결과 목록용).
 * 검색은 별도 AND 조건(전체 기간 대상).
 */
export function applySearchAndFilters(
  plans: Plan[],
  keyword: string,
  filters: ActiveFilters,
): Plan[] {
  const normalized = normalizeKeyword(keyword);
  return applyFilters(plans, filters).filter((plan) => matchesSearch(plan, normalized));
}

/** 활성 필터가 하나라도 선택되었는지(초기화 버튼 노출/비활성 판단). */
export function hasActiveFilters(filters: ActiveFilters): boolean {
  return (
    filters.categoryIds.length > 0 ||
    filters.uncategorized ||
    filters.priorities.length > 0 ||
    filters.completed !== 'all'
  );
}

/**
 * 스토어에서 검색/필터 상태를 읽어 파생값을 계산하는 훅.
 * - filters: 순수 함수 입력용 객체
 * - searchKeyword / isSearchMode: 검색 모드 분기
 * - filteredPlans: 활성 필터만 적용(메인 3영역 공통)
 * - searchResults: 검색 + 필터 적용(검색 모드 결과)
 * - filtersActive: 초기화 버튼 활성 여부
 */
export function usePlanFilters(plans: Plan[]) {
  const searchKeyword = usePlanStore((s) => s.searchKeyword);
  const selectedCategoryIds = usePlanStore((s) => s.selectedCategoryIds);
  const uncategorizedSelected = usePlanStore((s) => s.uncategorizedSelected);
  const selectedPriorities = usePlanStore((s) => s.selectedPriorities);
  const completedFilter = usePlanStore((s) => s.completedFilter);

  const filters = useMemo<ActiveFilters>(
    () => ({
      categoryIds: selectedCategoryIds,
      uncategorized: uncategorizedSelected,
      priorities: selectedPriorities,
      completed: completedFilter,
    }),
    [selectedCategoryIds, uncategorizedSelected, selectedPriorities, completedFilter],
  );

  const isSearchMode = normalizeKeyword(searchKeyword) !== '';

  const filteredPlans = useMemo(() => applyFilters(plans, filters), [plans, filters]);
  const searchResults = useMemo(
    () => applySearchAndFilters(plans, searchKeyword, filters),
    [plans, searchKeyword, filters],
  );

  return {
    filters,
    searchKeyword,
    isSearchMode,
    filteredPlans,
    searchResults,
    filtersActive: hasActiveFilters(filters),
  };
}
