import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { ApiResponse } from '@/types/api';

/**
 * axios HTTP 클라이언트 — Step 8 인증 연동 완료.
 *
 * - baseURL: VITE_API_BASE_URL (fallback '/api/v1')
 * - withCredentials: true — refresh 토큰(httpOnly 쿠키, Path=/api/v1/auth) 전송용.
 *   refresh 토큰은 절대 JS에서 읽지 않는다(브라우저가 자동 전송).
 * - 요청 인터셉터: authStore의 accessToken을 Bearer 헤더로 부착.
 * - 응답 인터셉터: 401 감지 시 refresh 1회 → 원 요청 재시도.
 *   동시 401은 단일 in-flight refresh Promise 를 공유(중복 호출 방지),
 *   refresh 실패 시 clearAuth. refresh 엔드포인트 자체는 재시도하지 않는다(무한 루프 방지).
 */

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const httpClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

/** 401 재시도를 한 번만 수행하도록 표시하는 확장 설정. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

/** 진행 중인 refresh 요청 Promise (동시 401 디듀프용). null 이면 진행 중 아님. */
let inFlightRefresh: Promise<string> | null = null;

/**
 * Refresh 토큰으로 새 accessToken을 발급받는 헬퍼.
 * refresh 토큰은 httpOnly 쿠키로 자동 전송되므로 본문/헤더에 직접 넣지 않는다.
 * 동시 호출 시 단일 in-flight Promise 를 공유한다.
 * 성공 시 authStore 의 accessToken 을 갱신한다.
 */
export function refreshAccessToken(): Promise<string> {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = (async () => {
    // baseURL 만 공유하는 별도 인스턴스로 호출해 응답 인터셉터(401 재시도) 재진입을 피한다.
    const response = await axios.post<ApiResponse<{ accessToken: string }>>(
      '/auth/refresh',
      undefined,
      { baseURL, withCredentials: true },
    );
    const { data } = response;
    if (!data.success) {
      throw new Error(data.error.message);
    }
    const { accessToken } = data.data;
    const { user, setAuth } = useAuthStore.getState();
    if (user) {
      setAuth(user, accessToken);
    } else {
      useAuthStore.setState({ accessToken });
    }
    return accessToken;
  })();

  const pending = inFlightRefresh;
  // 완료(성공/실패) 후 in-flight 슬롯 해제. 정리용 체인은 거부를 삼켜
  // unhandled rejection 을 만들지 않는다(실제 거부는 호출자가 await 로 처리).
  void pending
    .catch(() => undefined)
    .finally(() => {
      inFlightRefresh = null;
    });

  return pending;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error instanceof Error ? error : new AxiosError(String(error)));
    }

    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const requestUrl = original?.url ?? '';

    // 인증 진입 엔드포인트(login/register/refresh)의 401 은 토큰 만료가 아니라
    // 자격 증명 실패/세션 부재이므로 refresh 재시도 대상이 아니다.
    // (refresh 재진입은 무한 루프, login/register 재시도는 불필요한 호출·잘못된 의미.)
    const isAuthEntryCall =
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    if (status === 401 && original && !original._retried && !isAuthEntryCall) {
      original._retried = true;
      try {
        const newToken = await refreshAccessToken();
        const headers = AxiosHeaders.from(original.headers);
        headers.set('Authorization', `Bearer ${newToken}`);
        original.headers = headers;
        return httpClient.request(original as AxiosRequestConfig);
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }

    return Promise.reject(error);
  },
);
