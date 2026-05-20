import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { ApiResponse } from '@/types/api';

/**
 * axios HTTP 클라이언트 — Step 7 골격 단계.
 *
 * - baseURL: VITE_API_BASE_URL (fallback '/api/v1')
 * - withCredentials: true — refresh 토큰(httpOnly 쿠키, Path=/api/v1/auth) 전송용.
 *   refresh 토큰은 절대 JS에서 읽지 않는다(브라우저가 자동 전송).
 * - 요청 인터셉터: authStore의 accessToken을 Bearer 헤더로 부착.
 * - 응답 인터셉터: 401 감지 시 refresh 구조만 마련(전체 재시도 큐는 Step 8).
 */

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const httpClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

/**
 * Refresh 토큰으로 새 accessToken을 발급받는 헬퍼.
 * refresh 토큰은 httpOnly 쿠키로 자동 전송되므로 본문/헤더에 직접 넣지 않는다.
 * Step 8에서 발급된 accessToken을 authStore.setAuth로 반영하는 흐름을 연결한다.
 */
export async function refreshAccessToken(): Promise<string> {
  const response = await httpClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
  const { data } = response;
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data.accessToken;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Step 8: full 401 refresh-and-retry flow (refresh → 원 요청 재시도 큐).
      // 현재는 구조만 마련하고, refresh 실패 시 강제 로그아웃 처리만 수행한다.
      try {
        await refreshAccessToken();
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error instanceof Error ? error : new AxiosError(String(error)));
  },
);
