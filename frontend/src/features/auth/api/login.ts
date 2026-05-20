import { httpClient } from '@/lib/api/httpClient';
import type { ApiResponse } from '@/types/api';

/**
 * POST /api/v1/auth/login (api-spec §3-2)
 * 성공: { accessToken, user } 반환. Refresh 토큰은 Set-Cookie(httpOnly)로 별도 전달.
 * 실패(401/422/429)는 axios 에러로 throw → 호출 측(useLogin)에서 처리.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseUser {
  id: number;
  email: string;
  nickname: string;
  avatarUrl?: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: LoginResponseUser;
}

export async function login(payload: LoginRequest): Promise<LoginResponseData> {
  const response = await httpClient.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
