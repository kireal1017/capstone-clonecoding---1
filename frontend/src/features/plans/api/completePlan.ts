import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';

/**
 * PATCH /api/v1/plans/:id/complete (api-spec §4-6) — 완료 상태 토글.
 * 요청 본문 없음. 응답은 변경된 일부 필드만 반환한다.
 * 실패(404 PLAN_NOT_FOUND / 401)는 axios 에러로 throw → 호출 측에서 처리.
 */
export interface CompletePlanResponseData {
  plan: {
    id: number;
    isCompleted: boolean;
    updatedAt: string;
  };
}

export async function completePlan(planId: number): Promise<CompletePlanResponseData> {
  const response = await httpClient.patch<ApiResponse<CompletePlanResponseData>>(
    `/plans/${planId}/complete`,
  );
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
