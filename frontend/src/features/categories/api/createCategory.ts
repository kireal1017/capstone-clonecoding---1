import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { Category } from '@/types/domain';

/**
 * POST /api/v1/categories (api-spec §5-2) — 카테고리 추가.
 *
 * 요청 바디는 snake_case 계약. sort_order 생략 시 서버가 현재 최대값+1 부여.
 * 성공(201): { category }. 실패(422 / 409 CATEGORY_NAME_ALREADY_EXISTS)는 axios 에러로 throw.
 */
export interface CreateCategoryBody {
  name: string;
  color: string;
  sort_order?: number;
}

export interface CategoryResponseData {
  category: Category;
}

export async function createCategory(body: CreateCategoryBody): Promise<Category> {
  const response = await httpClient.post<ApiResponse<CategoryResponseData>>('/categories', body);
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.category;
}
