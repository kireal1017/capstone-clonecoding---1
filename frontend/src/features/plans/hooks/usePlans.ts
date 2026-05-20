import { useQuery } from '@tanstack/react-query';
import { getPlans, type GetPlansResponseData } from '@/features/plans/api/getPlans';
import type { Plan, Priority } from '@/types/domain';

/**
 * 일정 목록 useQuery 훅 + 영역별 분할 헬퍼.
 *
 * 단일 GET /plans(파라미터 없음)로 사용자의 전체 미삭제 일정을 받아
 * 캘린더(dueDate)·오늘 할 일(displayDate)·주간 바(displayDate)로 클라이언트 분할한다.
 * 완료 토글 등 변경 후 동일 queryKey 를 무효화하면 세 영역이 함께 갱신된다.
 */
export const plansQueryKey = ['plans'] as const;

export function usePlans() {
  return useQuery<GetPlansResponseData, Error>({
    queryKey: plansQueryKey,
    queryFn: getPlans,
    staleTime: 30_000,
  });
}

/** dueDate(`YYYY-MM-DD`) → 해당 날짜 Plan 목록(완료 포함). 캘린더 배치용. */
export function groupByDueDate(plans: Plan[]): Map<string, Plan[]> {
  const map = new Map<string, Plan[]>();
  for (const plan of plans) {
    const list = map.get(plan.dueDate);
    if (list) {
      list.push(plan);
    } else {
      map.set(plan.dueDate, [plan]);
    }
  }
  return map;
}

/** displayDate(`YYYY-MM-DD`) → 해당 날짜 Plan 목록. */
export function groupByDisplayDate(plans: Plan[]): Map<string, Plan[]> {
  const map = new Map<string, Plan[]>();
  for (const plan of plans) {
    const list = map.get(plan.displayDate);
    if (list) {
      list.push(plan);
    } else {
      map.set(plan.displayDate, [plan]);
    }
  }
  return map;
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

/** 오늘 할 일 정렬(PRD §22-2): priority → dueTime(null 최하위) → createdAt. */
function compareTodayPlans(a: Plan, b: Plan): number {
  const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (pr !== 0) return pr;
  if (a.dueTime !== b.dueTime) {
    if (a.dueTime === null) return 1;
    if (b.dueTime === null) return -1;
    return a.dueTime < b.dueTime ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

/**
 * 오늘 할 일: displayDate == today(KST) AND 미완료.
 * (task SCOPE §4 — 완료 항목은 오늘 할 일에서 제외.)
 */
export function selectTodayPlans(plans: Plan[], todayKst: string): Plan[] {
  return plans.filter((p) => p.displayDate === todayKst && !p.isCompleted).sort(compareTodayPlans);
}

/**
 * 주간 바 집계(displayDate 기준, PRD §24-1).
 * weekDates(월~일) 각 날짜에 대응하는 Plan 목록 배열을 반환(인덱스 1:1).
 */
export function selectWeeklyPlans(plans: Plan[], weekDates: string[]): Plan[][] {
  const byDisplay = groupByDisplayDate(plans);
  return weekDates.map((d) => byDisplay.get(d) ?? []);
}
