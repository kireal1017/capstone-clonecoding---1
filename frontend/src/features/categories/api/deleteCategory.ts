import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';

/**
 * DELETE /api/v1/categories/:id (api-spec §5-4, K-09=B) — 카테고리 삭제.
 *
 * 일정 DELETE(204)와 달리 **200 + JSON 본문**을 반환한다. 연결된 일정의
 * category_id 가 NULL(미분류)로 일괄 처리되며, 그 건수를 `affectedPlans` 로 알려준다.
 * 성공: { message, affectedPlans }. 실패(404 CATEGORY_NOT_FOUND)는 axios 에러로 throw.
 */
export interface DeleteCategoryResponseData {
  message: string;
  affectedPlans: number;
}

export async function deleteCategory(id: number): Promise<DeleteCategoryResponseData> {
  const response = await httpClient.delete<ApiResponse<DeleteCategoryResponseData>>(
    `/categories/${id}`,
  );
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
