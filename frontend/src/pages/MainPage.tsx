import { useMemo } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import MonthlyCalendar from '@/features/calendar/components/MonthlyCalendar';
import WeeklyPlanBar from '@/features/plans/components/WeeklyPlanBar';
import TodayPlanList from '@/features/plans/components/TodayPlanList';
import CreatePlanFAB from '@/features/plans/components/CreatePlanFAB';
import { usePlans, selectTodayPlans } from '@/features/plans/hooks/usePlans';
import { getTodayKst } from '@/lib/date/kst';

/**
 * 메인 대시보드 페이지 (보호, `/`) — Step 9.
 *
 * 섹션 순서(K-05=B): 월간 캘린더 → 주간 일정 바 → 오늘 할 일. + 우하단 FAB.
 * 데이터: 단일 GET /plans(파라미터 없음)로 전체 미삭제 일정을 받아 클라이언트 분할.
 *  - 캘린더: dueDate 기준 배치(완료 포함)
 *  - 주간 바: displayDate 기준 집계(이번 주 월~일, KST)
 *  - 오늘 할 일: displayDate == today(KST) AND 미완료
 * 상태: 로딩(Spinner) / 오류(메시지 + 재시도) / 빈 상태(오늘 할 일 섹션 내부 처리).
 * 401 은 httpClient(refresh→retry, 실패 시 clearAuth→ProtectedRoute 리다이렉트)가 처리.
 */
function MainPage() {
  const todayKst = useMemo(() => getTodayKst(), []);
  const { data, isLoading, isError, error, refetch, isFetching } = usePlans();

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
        <p className="text-sm text-error">
          {error?.message ?? '일정을 불러오지 못했습니다.'}
        </p>
        <Button onClick={() => void refetch()} isLoading={isFetching}>
          다시 시도
        </Button>
      </div>
    );
  }

  const plans = data?.plans ?? [];
  const todayPlans = selectTodayPlans(plans, todayKst);

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="월간 캘린더">
        <MonthlyCalendar plans={plans} />
      </section>

      <section aria-label="주간 일정 바" className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-charcoal">주간 할 일</h2>
        <WeeklyPlanBar plans={plans} todayKst={todayKst} />
      </section>

      <section aria-label="오늘 할 일 목록" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-charcoal">오늘 할 일</h2>
          <span className="text-xs text-outline">{todayKst.replaceAll('-', '.')}</span>
        </div>
        <TodayPlanList plans={todayPlans} todayKst={todayKst} />
      </section>

      <CreatePlanFAB />
    </div>
  );
}

export default MainPage;
