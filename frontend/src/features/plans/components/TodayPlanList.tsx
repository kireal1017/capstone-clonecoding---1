import { useState } from 'react';
import PlanCard from '@/features/plans/components/PlanCard';
import EmptyState from '@/components/ui/EmptyState';
import { useCompletePlan } from '@/features/plans/hooks/useCompletePlan';
import { useToast } from '@/components/ui/Toast';
import type { Plan } from '@/types/domain';

/**
 * 오늘 할 일 목록 — displayDate == today(KST) AND 미완료(상위 usePlans 에서 분할).
 * 각 카드: 체크박스(완료 토글) + 제목 + 카테고리 칩 + 시간 + 중요도 + D-Day 배지.
 *
 * 완료 토글: PATCH /complete → 성공 시 plans 무효화(상위 영역 함께 갱신).
 * 더블클릭 가드: 토글 진행 중인 planId 를 set 으로 추적해 해당 체크박스를 disabled.
 * 빈 상태: 안내 2줄(wireframe §8-5).
 */
interface TodayPlanListProps {
  plans: Plan[];
  todayKst: string;
  /** 카드 클릭 시 상세 모달 오픈(?planId=). */
  onSelectPlan?: (planId: number) => void;
}

function TodayPlanList({ plans, todayKst, onSelectPlan }: TodayPlanListProps) {
  const { mutate, isPending } = useCompletePlan();
  const { showToast } = useToast();
  const [pendingId, setPendingId] = useState<number | null>(null);

  const handleToggle = (planId: number): void => {
    // 더블클릭/연타 가드: 이미 토글 중이면 무시.
    if (isPending && pendingId === planId) {
      return;
    }
    setPendingId(planId);
    mutate(planId, {
      onError: () => {
        showToast('완료 상태 변경에 실패했습니다.', 'error');
      },
      onSettled: () => {
        setPendingId(null);
      },
    });
  };

  if (plans.length === 0) {
    return (
      <EmptyState
        message="오늘 처리할 일정이 없습니다."
        description="오른쪽 하단 + 버튼으로 일정을 추가해보세요."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {plans.map((plan) => (
        <li key={plan.id}>
          <PlanCard
            plan={plan}
            todayKst={todayKst}
            showCheckbox
            isToggling={isPending && pendingId === plan.id}
            onToggle={handleToggle}
            {...(onSelectPlan ? { onSelect: onSelectPlan } : {})}
          />
        </li>
      ))}
    </ul>
  );
}

export default TodayPlanList;
