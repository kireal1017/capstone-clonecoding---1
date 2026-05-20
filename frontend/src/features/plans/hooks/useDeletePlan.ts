import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePlan } from '@/features/plans/api/deletePlan';
import { plansQueryKey } from '@/features/plans/hooks/usePlans';

/**
 * 일정 삭제 useMutation 훅 (DELETE /plans/:id, 204).
 *
 * 성공 시 `['plans']` 쿼리를 무효화 → 메인 페이지 세 영역에서 해당 일정이 사라진다.
 * 더블클릭 가드는 호출 컴포넌트가 `isPending` 으로 삭제 버튼을 비활성화해 처리한다.
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deletePlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plansQueryKey });
    },
  });
}
