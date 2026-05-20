import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';

/**
 * POST /api/v1/auth/logout (api-spec §3-4)
 * 서버: refresh 쿠키 삭제 + refresh_token_hash NULL 처리.
 * 클라이언트: 호출 후 authStore.clearAuth (useLogout에서 수행).
 */
export interface LogoutResponseData {
  message: string;
}

export async function logout(): Promise<LogoutResponseData> {
  const response = await httpClient.post<ApiResponse<LogoutResponseData>>('/auth/logout');
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
