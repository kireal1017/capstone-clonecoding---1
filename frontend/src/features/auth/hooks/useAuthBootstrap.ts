import { useEffect, useRef } from 'react';
import { refreshAccessToken } from '@/lib/api/httpClient';
import { getMe } from '@/features/auth/api/me';
import { useAuthStore, type AuthStatus } from '@/features/auth/stores/authStore';

/**
 * 앱 부트스트랩(세션 복원) 훅 — 새로고침/최초 진입 시 1회 실행.
 *
 * 흐름:
 *  1. status = 'loading'
 *  2. POST /auth/refresh (httpOnly 쿠키 자동 전송) → 새 accessToken
 *     (refreshAccessToken 이 authStore.accessToken 을 갱신)
 *  3. GET /auth/me → 사용자 정보 → setAuth
 *  4. 어느 단계든 실패하면 clearAuth (로그아웃 상태 유지)
 *
 * ProtectedRoute / PublicOnlyRoute 는 status 가 'loading'/'idle' 인 동안
 * 리다이렉트를 보류해 깜빡임을 막는다. 무한 대기는 하지 않으며 위 흐름은 항상 종료된다.
 *
 * @returns 현재 부트스트랩 status
 */
export function useAuthBootstrap(): AuthStatus {
  const status = useAuthStore((state) => state.status);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const { setStatus, setAuth, clearAuth } = useAuthStore.getState();

    setStatus('loading');

    // 부트스트랩은 전역 스토어를 갱신하므로 컴포넌트 언마운트와 무관하게 항상 끝까지 수행한다.
    // (React StrictMode 의 mount→unmount→remount 더블 인보크에서 startedRef 가드로 중복 실행만 막고,
    //  진행 중이던 단일 비동기 흐름은 취소하지 않아 status 가 'loading' 에 갇히지 않게 한다.)
    void (async () => {
      try {
        const accessToken = await refreshAccessToken();
        const { user } = await getMe();
        setAuth(
          {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl ?? null,
            createdAt: user.createdAt,
          },
          accessToken,
        );
      } catch {
        clearAuth();
      }
    })();
  }, []);

  return status;
}
