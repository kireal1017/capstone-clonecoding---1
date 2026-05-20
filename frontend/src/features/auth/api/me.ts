import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';

/**
 * GET /api/v1/auth/me (api-spec §3-5)
 * Bearer 인증. 부트스트랩(새로고침 복원) 시 현재 사용자 정보 로드에 사용.
 * 401(AUTH_UNAUTHORIZED)은 axios 에러로 throw.
 */
export interface MeResponseUser {
  id: number;
  email: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface MeResponseData {
  user: MeResponseUser;
}

export async function getMe(): Promise<MeResponseData> {
  const response = await httpClient.get<ApiResponse<MeResponseData>>('/auth/me');
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
