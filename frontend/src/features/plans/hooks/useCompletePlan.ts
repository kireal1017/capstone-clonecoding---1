import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completePlan, type CompletePlanResponseData } from '@/features/plans/api/completePlan';
import { plansQueryKey } from '@/features/plans/hooks/usePlans';

/**
 * 완료 상태 토글 useMutation 훅 (PATCH /plans/:id/complete).
 *
 * 성공 시 plans 쿼리를 무효화 → 캘린더·오늘 할 일·주간 바가 함께 갱신된다.
 * 더블클릭 가드는 호출 컴포넌트가 `isPending` + 토글 중인 planId 로 처리한다
 * (여기서는 단일 mutation 이므로, 컴포넌트 측에서 per-plan 가드를 둔다).
 */
export function useCompletePlan() {
  const queryClient = useQueryClient();

  return useMutation<CompletePlanResponseData, Error, number>({
    mutationFn: completePlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plansQueryKey });
    },
  });
}
