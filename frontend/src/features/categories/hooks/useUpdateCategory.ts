import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCategory, type UpdateCategoryRequest } from '@/features/categories/api/updateCategory';
import { categoriesQueryKey } from '@/features/categories/hooks/useCategories';
import { plansQueryKey } from '@/features/plans/hooks/usePlans';
import type { Category } from '@/types/domain';

/**
 * 카테고리 수정 useMutation 훅 (PUT /categories/:id, 전체 교체).
 * 성공 시 `['categories']` + `['plans']` 무효화(이름/색 변경이 일정 칩에 반영되도록).
 * 409(중복명) 처리는 폼 컴포넌트가 onError 에서 인라인 매핑한다.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, UpdateCategoryRequest>({
    mutationFn: updateCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      void queryClient.invalidateQueries({ queryKey: plansQueryKey });
    },
  });
}
