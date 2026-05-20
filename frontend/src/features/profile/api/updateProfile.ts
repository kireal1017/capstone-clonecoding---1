import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';
import type { ProfileUser } from '@/types/domain';
import type { ProfileResponseData } from '@/features/profile/api/getProfile';

/**
 * PATCH /api/v1/profile (api-spec §6-2) — 닉네임 수정.
 * email 은 불변(요청 바디에 포함하지 않음). 성공: { user }.
 * 실패(422 VALIDATION_FAILED)는 axios 에러로 throw.
 */
export interface UpdateProfileBody {
  nickname: string;
}

export async function updateProfile(body: UpdateProfileBody): Promise<ProfileUser> {
  const response = await httpClient.patch<ApiResponse<ProfileResponseData>>('/profile', body);
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.user;
}
