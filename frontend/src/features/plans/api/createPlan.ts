import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { Plan, Priority } from '@/types/domain';

/**
 * POST /api/v1/plans (api-spec §4-2) — 일정 등록.
 *
 * 요청 바디는 snake_case 계약을 따른다. 폼(camelCase)에서 받은 값을
 * createPlan 호출부(useCreatePlan/PlanForm)에서 이 타입으로 매핑한다.
 * 빈 선택값(dueTime/memo)은 호출부에서 null/생략으로 정규화한다.
 *
 * 성공(201): { plan } 반환. 실패(422/404 CATEGORY_NOT_FOUND/401)는 axios 에러로 throw.
 */
export interface CreatePlanRequest {
  title: string;
  due_date: string;
  due_time?: string | null;
  display_date: string;
  category_id: number | null;
  priority: Priority;
  memo?: string | null;
  is_remind: boolean;
}

export interface CreatePlanResponseData {
  plan: Plan;
}

export async function createPlan(payload: CreatePlanRequest): Promise<Plan> {
  const response = await httpClient.post<ApiResponse<CreatePlanResponseData>>('/plans', payload);
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.plan;
}
