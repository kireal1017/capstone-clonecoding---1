import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { Category } from '@/types/domain';

/**
 * GET /api/v1/categories (api-spec §5-1) — 카테고리 목록 조회.
 *
 * 요청자 소유 카테고리만 sort_order 오름차순으로 반환된다.
 * Step 10 에서는 PlanForm 의 카테고리 칩 선택지 용도(읽기 전용)로만 사용한다.
 * (카테고리 관리 UI 는 Step 11.)
 */
export interface GetCategoriesResponseData {
  categories: Category[];
}

export async function getCategories(): Promise<Category[]> {
  const response =
    await httpClient.get<ApiResponse<GetCategoriesResponseData>>('/categories');
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.categories;
}
