import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteCategory,
  type DeleteCategoryResponseData,
} from '@/features/categories/api/deleteCategory';
import { categoriesQueryKey } from '@/features/categories/hooks/useCategories';
import { plansQueryKey } from '@/features/plans/hooks/usePlans';

/**
 * 카테고리 삭제 useMutation 훅 (DELETE /categories/:id, 200 + affectedPlans).
 *
 * 성공 시 `['categories']` + `['plans']` 모두 무효화 → 연결 일정이 "미분류"로
 * 표시되도록 한다(K-09=B). affectedPlans 안내(토스트)는 호출 컴포넌트가 수행한다.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<DeleteCategoryResponseData, Error, number>({
    mutationFn: deleteCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      void queryClient.invalidateQueries({ queryKey: plansQueryKey });
    },
  });
}
