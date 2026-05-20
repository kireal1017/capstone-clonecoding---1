/**
 * POST /api/v1/auth/refresh (api-spec §3-3)
 *
 * 실제 구현은 lib/api/httpClient.ts 의 `refreshAccessToken` 에 위치한다
 * (응답 인터셉터의 401 재시도 흐름과 단일 in-flight refresh 큐를 공유해야 하므로).
 * 이 파일은 features/auth/api 계층의 일관성을 위해 재노출(re-export)만 한다.
 */
export { refreshAccessToken } from '@/lib/api/httpClient';
