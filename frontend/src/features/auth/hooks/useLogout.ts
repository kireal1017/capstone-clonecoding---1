import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '@/features/auth/api/logout';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * 로그아웃 useMutation 훅.
 * POST /auth/logout → 성공/실패와 무관하게 클라이언트 상태는 정리한다
 * (서버 호출이 실패해도 로컬 세션은 끊는 것이 안전).
 * 네비게이션(/login)은 호출 측(AppShell)이 onSuccess/onSettled 에서 수행한다.
 */
export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await logout();
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
