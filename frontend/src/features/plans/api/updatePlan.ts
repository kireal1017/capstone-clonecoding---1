import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { Plan, Priority } from '@/types/domain';

/**
 * PATCH /api/v1/plans/:id (api-spec §4-4) — 일정 부분 수정.
 *
 * 변경할 필드만 포함하는 Partial Update. 요청 바디는 snake_case 계약을 따른다.
 * PlanForm 의 수정 모드(useUpdatePlan)에서 camelCase 폼 값을 이 타입으로 매핑한다.
 *
 * 성공(200): { plan } 반환. 실패(404 PLAN_NOT_FOUND/422/404 CATEGORY_NOT_FOUND)는
 * axios 에러로 throw.
 */
export interface UpdatePlanBody {
  title?: string;
  due_date?: string;
  due_time?: string | null;
  display_date?: string;
  category_id?: number | null;
  priority?: Priority;
  memo?: string | null;
  is_remind?: boolean;
}

export interface UpdatePlanRequest {
  id: number;
  body: UpdatePlanBody;
}

export interface UpdatePlanResponseData {
  plan: Plan;
}

export async function updatePlan({ id, body }: UpdatePlanRequest): Promise<Plan> {
  const response = await httpClient.patch<ApiResponse<UpdatePlanResponseData>>(
    `/plans/${id}`,
    body,
  );
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.plan;
}
