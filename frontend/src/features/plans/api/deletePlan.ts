import { httpClient } from '@/lib/api/httpClient';

/**
 * DELETE /api/v1/plans/:id (api-spec §4-5) — 일정 삭제(soft delete).
 *
 * 성공 시 서버는 **204 No Content** 로 응답한다(본문 없음). 따라서 응답 본문을
 * 파싱하지 않고 void 를 반환한다. 실패(404 PLAN_NOT_FOUND/401)는 axios 에러로 throw.
 */
export async function deletePlan(id: number): Promise<void> {
  await httpClient.delete(`/plans/${id}`);
}
