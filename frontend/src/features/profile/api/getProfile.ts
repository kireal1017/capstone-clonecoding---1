import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { ProfileUser } from '@/types/domain';

/**
 * GET /api/v1/profile (api-spec §6-1) — 프로필 조회.
 * 성공: { user }. 실패(401)는 axios 에러로 throw(httpClient 가 refresh 처리).
 */
export interface ProfileResponseData {
  user: ProfileUser;
}

export async function getProfile(): Promise<ProfileUser> {
  const response = await httpClient.get<ApiResponse<ProfileResponseData>>('/profile');
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.user;
}
