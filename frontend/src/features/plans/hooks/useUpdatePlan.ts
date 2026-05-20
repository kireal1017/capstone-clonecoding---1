import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePlan, type UpdatePlanRequest } from '@/features/plans/api/updatePlan';
import { plansQueryKey } from '@/features/plans/hooks/usePlans';
import type { Plan } from '@/types/domain';

/**
 * 일정 수정 useMutation 훅 (PATCH /plans/:id).
 * 성공 시 `['plans']` 쿼리를 무효화해 메인 페이지 세 영역이 갱신되도록 한다.
 *
 * Step 10 에서는 PlanForm 의 수정 모드를 기능적으로 완성하지만, 수정 진입 UI
 * (PlanDetailModal 인라인 편집)는 Step 11 로 미룬다 — 본 훅은 그때 즉시 연결 가능.
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation<Plan, Error, UpdatePlanRequest>({
    mutationFn: updatePlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plansQueryKey });
    },
  });
}
