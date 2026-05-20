import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlan, type CreatePlanRequest } from '@/features/plans/api/createPlan';
import { plansQueryKey } from '@/features/plans/hooks/usePlans';
import type { Plan } from '@/types/domain';

/**
 * 일정 등록 useMutation 훅 (POST /plans).
 * 성공 시 `['plans']` 쿼리를 무효화해 메인 페이지 세 영역이 갱신되도록 한다.
 * 성공 후 네비게이션은 폼/페이지가 onSuccess 콜백에서 수행한다.
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation<Plan, Error, CreatePlanRequest>({
    mutationFn: createPlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plansQueryKey });
    },
  });
}
