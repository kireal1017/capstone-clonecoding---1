import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';

/**
 * POST /api/v1/auth/register (api-spec §3-1)
 * 성공(201): { user } 반환. [BE-06] 토큰 미발급 — 가입 후 /login 리다이렉트.
 * 실패(409 EMAIL_ALREADY_EXISTS / 422 VALIDATION_FAILED / 429)는 axios 에러로 throw.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface RegisterResponseUser {
  id: number;
  email: string;
  nickname: string;
  createdAt: string;
}

export interface RegisterResponseData {
  user: RegisterResponseUser;
}

export async function register(payload: RegisterRequest): Promise<RegisterResponseData> {
  const response = await httpClient.post<ApiResponse<RegisterResponseData>>(
    '/auth/register',
    payload,
  );
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
