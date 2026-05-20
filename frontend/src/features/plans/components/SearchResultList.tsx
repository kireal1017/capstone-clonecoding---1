import { useMemo } from 'react';
import PlanCard from '@/features/plans/components/PlanCard';
import EmptyState from '@/components/ui/EmptyState';
import type { Plan, Priority } from '@/types/domain';

/**
 * 검색 모드 결과 목록 (wireframe §3 FE-03) — 캘린더·주간 바를 대체해 조건부 렌더링.
 *
 * 헤더: `"{keyword}" 검색 결과 (N건)`. 결과 카드는 읽기 전용(체크박스 없음)이며
 * 클릭 시 상세 모달(?planId=)을 연다. 결과 없음은 공통 EmptyState 로 표시한다.
 * 정렬은 서버 고정 규칙(BE-03)을 재현: 미완료 우선 → 중요도 → dueTime(NULLS LAST)
 * → createdAt. 검색은 전체 기간 대상(상위 usePlanFilters 에서 산출).
 */
interface SearchResultListProps {
  keyword: string;
  plans: Plan[];
  todayKst: string;
  onSelectPlan?: (planId: number) => void;
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

function compareServerOrder(a: Plan, b: Plan): number {
  if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
  const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (pr !== 0) return pr;
  if (a.dueTime !== b.dueTime) {
    if (a.dueTime === null) return 1;
    if (b.dueTime === null) return -1;
    return a.dueTime < b.dueTime ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

function SearchResultList({ keyword, plans, todayKst, onSelectPlan }: SearchResultListProps) {
  const sorted = useMemo(() => [...plans].sort(compareServerOrder), [plans]);

  return (
    <section aria-label="검색 결과" className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-charcoal">
        &quot;{keyword}&quot; 검색 결과 ({sorted.length}건)
      </h2>

      {sorted.length === 0 ? (
        <EmptyState message="검색 결과가 없습니다." description="다른 키워드로 검색해보세요." />
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((plan) => (
            <li key={plan.id}>
              <PlanCard
                plan={plan}
                todayKst={todayKst}
                {...(onSelectPlan ? { onSelect: onSelectPlan } : {})}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default SearchResultList;
