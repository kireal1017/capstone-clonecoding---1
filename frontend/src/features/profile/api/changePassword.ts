import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';

/**
 * PATCH /api/v1/profile/password (api-spec §6-3) — 비밀번호 변경.
 * 성공: { message }. 실패(401 AUTH_INVALID_CREDENTIALS / 422)는 axios 에러로 throw.
 */
export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export interface ChangePasswordResponseData {
  message: string;
}

export async function changePassword(body: ChangePasswordBody): Promise<ChangePasswordResponseData> {
  const response = await httpClient.patch<ApiResponse<ChangePasswordResponseData>>(
    '/profile/password',
    body,
  );
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
