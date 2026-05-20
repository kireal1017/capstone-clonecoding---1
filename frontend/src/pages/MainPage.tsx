import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import MonthlyCalendar from '@/features/calendar/components/MonthlyCalendar';
import WeeklyPlanBar from '@/features/plans/components/WeeklyPlanBar';
import TodayPlanList from '@/features/plans/components/TodayPlanList';
import PlanFilterBar from '@/features/plans/components/PlanFilterBar';
import SearchResultList from '@/features/plans/components/SearchResultList';
import CreatePlanFAB from '@/features/plans/components/CreatePlanFAB';
import PlanDetailModal from '@/features/plans/components/PlanDetailModal';
import { usePlans, selectTodayPlans } from '@/features/plans/hooks/usePlans';
import { usePlanFilters } from '@/features/plans/hooks/usePlanFilters';
import { usePlanStore } from '@/features/plans/stores/planStore';
import { getTodayKst } from '@/lib/date/kst';

/**
 * 메인 대시보드 페이지 (보호, `/`) — Step 9 + Step 12(검색·필터·빈 상태).
 *
 * 섹션 순서(K-05=B): 검색바 → 필터 칩 → 월간 캘린더 → 주간 일정 바 → 오늘 할 일. + FAB.
 * 데이터: 단일 GET /plans(파라미터 없음)로 전체 미삭제 일정을 받아 클라이언트 분할.
 *  - 검색/필터는 캐시된 전체 세트 위에서 클라이언트로 적용(재요청 없음, api-spec §4-1/DB-07 의미).
 *  - 활성 필터는 분할 전에 적용 → 캘린더 점·주간 바 개수·오늘 목록에 공통 반영.
 *  - 캘린더: dueDate 기준(완료 포함, 단 "미완료만" 필터 시 완료 제외)
 *  - 주간 바: displayDate 기준 집계
 *  - 오늘 할 일: displayDate == today(KST) AND 미완료(완료는 항상 제외)
 *  - 검색 모드(검색어 비어있지 않음): 캘린더+주간 바를 SearchResultList 로 조건부 교체.
 *    오늘 할 일 섹션은 검색 모드에서도 유지(FE-03).
 * 상태: 로딩(Spinner) / 오류(메시지 + 재시도) / 빈 상태(EmptyState).
 * 401 은 httpClient(refresh→retry, 실패 시 clearAuth→ProtectedRoute 리다이렉트)가 처리.
 */
function MainPage() {
  const todayKst = useMemo(() => getTodayKst(), []);
  const { data, isLoading, isError, error, refetch, isFetching } = usePlans();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchKeywordState = usePlanStore((s) => s.searchKeyword);
  const setSearchKeyword = usePlanStore((s) => s.setSearchKeyword);

  const plans = useMemo(() => data?.plans ?? [], [data]);
  const { isSearchMode, filteredPlans, searchResults, filtersActive } = usePlanFilters(plans);

  const planIdParam = searchParams.get('planId');
  const parsedPlanId = planIdParam !== null ? Number(planIdParam) : null;
  const openPlanId =
    parsedPlanId !== null && Number.isInteger(parsedPlanId) && parsedPlanId > 0
      ? parsedPlanId
      : null;

  // 일정 클릭 → URL 에 ?planId= 부여(SSoT). 상세 모달이 이를 읽어 열린다.
  const handleSelectPlan = (id: number): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('planId', String(id));
        return next;
      },
      { replace: false },
    );
  };

  // 모달 닫기 → ?planId 제거.
  const handleCloseDetail = (): void => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('planId');
        return next;
      },
      { replace: false },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status">
        <Spinner size={28} className="text-charcoal" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-error">{error?.message ?? '일정을 불러오지 못했습니다.'}</p>
        <Button onClick={() => void refetch()} isLoading={isFetching}>
          다시 시도
        </Button>
      </div>
    );
  }

  // 오늘 할 일: 활성 필터 적용 후 분할(완료는 항상 제외 — selectTodayPlans 내부 규칙).
  const todayPlans = selectTodayPlans(filteredPlans, todayKst);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SearchBar value={searchKeywordState} onDebouncedChange={setSearchKeyword} />
        <PlanFilterBar />
      </div>

      {isSearchMode ? (
        <SearchResultList
          keyword={searchKeywordState.trim()}
          plans={searchResults}
          todayKst={todayKst}
          onSelectPlan={handleSelectPlan}
        />
      ) : (
        <>
          <section aria-label="월간 캘린더" data-testid="monthly-calendar">
            <MonthlyCalendar plans={filteredPlans} onSelectPlan={handleSelectPlan} />
          </section>

          <section
            aria-label="주간 일정 바"
            data-testid="weekly-plan-bar"
            className="flex flex-col gap-3"
          >
            <h2 className="text-sm font-medium text-charcoal">주간 할 일</h2>
            <WeeklyPlanBar
              plans={filteredPlans}
              todayKst={todayKst}
              onSelectPlan={handleSelectPlan}
            />
          </section>
        </>
      )}

      <section
        aria-label="오늘 할 일 목록"
        data-testid="today-plan-list"
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-charcoal">오늘 할 일</h2>
          <span className="text-xs text-outline">{todayKst.replaceAll('-', '.')}</span>
        </div>
        {todayPlans.length === 0 && filtersActive ? (
          <EmptyState message="조건에 맞는 일정이 없습니다." description="필터를 조정해보세요." />
        ) : (
          <TodayPlanList
            plans={todayPlans}
            todayKst={todayKst}
            onSelectPlan={handleSelectPlan}
          />
        )}
      </section>

      <CreatePlanFAB />

      {openPlanId !== null ? (
        <PlanDetailModal planId={openPlanId} onClose={handleCloseDetail} />
      ) : null}
    </div>
  );
}

export default MainPage;
