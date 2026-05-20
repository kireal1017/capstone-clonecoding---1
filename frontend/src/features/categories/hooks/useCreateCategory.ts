import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, type CreateCategoryBody } from '@/features/categories/api/createCategory';
import { categoriesQueryKey } from '@/features/categories/hooks/useCategories';
import type { Category } from '@/types/domain';

/**
 * 카테고리 생성 useMutation 훅 (POST /categories).
 * 성공 시 `['categories']` 무효화 → 목록·PlanForm 칩 갱신.
 * 409(중복명) 처리는 폼 컴포넌트가 onError 에서 인라인 매핑한다.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, CreateCategoryBody>({
    mutationFn: createCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    },
  });
}
