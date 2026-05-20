import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { Category } from '@/types/domain';
import type { CategoryResponseData } from '@/features/categories/api/createCategory';

/**
 * PUT /api/v1/categories/:id (api-spec §5-3, FE-01) — 카테고리 수정(전체 교체).
 *
 * **전체 교체**이므로 name·color·sort_order 를 모두 포함해야 한다(부분 수정 아님).
 * 성공(200): { category }. 실패(404 / 422 / 409 CATEGORY_NAME_ALREADY_EXISTS)는 throw.
 */
export interface UpdateCategoryBody {
  name: string;
  color: string;
  sort_order: number;
}

export interface UpdateCategoryRequest {
  id: number;
  body: UpdateCategoryBody;
}

export async function updateCategory({ id, body }: UpdateCategoryRequest): Promise<Category> {
  const response = await httpClient.put<ApiResponse<CategoryResponseData>>(
    `/categories/${id}`,
    body,
  );
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.category;
}
