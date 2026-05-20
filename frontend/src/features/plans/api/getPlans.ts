import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { Plan } from '@/types/domain';

/**
 * GET /api/v1/plans (api-spec §4-1) — 일정 목록 조회.
 *
 * 메인 페이지는 세 영역(캘린더=dueDate, 오늘=displayDate, 주간=displayDate)이
 * 서로 다른 날짜 기준을 사용하고, 캘린더는 dueDate 로 배치하지만 서버 `month`
 * 필터는 displayDate 기준이라 어긋난다. 따라서 본 Step 에서는 파라미터 없이
 * (month/completed 미지정) 사용자의 전체 미삭제 일정을 한 번에 받아 클라이언트에서
 * 영역별로 분할한다(완료/미완료 모두 포함되어 캘린더에 완료 일정도 표시 가능).
 * 서버 고정 정렬(isCompleted→priority→dueTime→createdAt)이 적용된 상태로 반환된다.
 */
export interface GetPlansResponseData {
  plans: Plan[];
  total: number;
}

export async function getPlans(): Promise<GetPlansResponseData> {
  const response = await httpClient.get<ApiResponse<GetPlansResponseData>>('/plans');
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
