import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';

/**
 * POST /api/v1/profile/avatar (api-spec §6-4) — 아바타 업로드(multipart/form-data).
 *
 * 필드명은 `avatar`. Content-Type 은 axios 가 FormData 로부터 boundary 와 함께
 * 자동 설정하므로 직접 지정하지 않는다. 성공: { avatarUrl }.
 * 실패(400 FILE_TOO_LARGE / 400 INVALID_FILE_TYPE / 422)는 axios 에러로 throw.
 */
export interface UploadAvatarResponseData {
  avatarUrl: string;
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await httpClient.post<ApiResponse<UploadAvatarResponseData>>(
    '/profile/avatar',
    formData,
  );
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.avatarUrl;
}
