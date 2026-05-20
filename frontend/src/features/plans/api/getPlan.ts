import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { Plan } from '@/types/domain';

/**
 * GET /api/v1/plans/:id (api-spec §4-3) — 단건 일정 조회.
 *
 * 상세 모달이 `['plans']` 캐시에 대상 일정이 없을 때(예: 다른 페이지 진입 후
 * 새로고침) 폴백으로 사용한다. 실패(404 PLAN_NOT_FOUND/401)는 axios 에러로 throw.
 */
export interface GetPlanResponseData {
  plan: Plan;
}

export async function getPlan(id: number): Promise<Plan> {
  const response = await httpClient.get<ApiResponse<GetPlanResponseData>>(`/plans/${id}`);
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.plan;
}
