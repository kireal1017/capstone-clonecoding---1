import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/features/categories/api/getCategories';
import type { Category } from '@/types/domain';

/**
 * 카테고리 목록 useQuery 훅 (query key `['categories']`).
 * PlanForm 의 카테고리 칩 선택지에 사용한다(읽기 전용).
 */
export const categoriesQueryKey = ['categories'] as const;

export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: categoriesQueryKey,
    queryFn: getCategories,
    staleTime: 60_000,
  });
}
