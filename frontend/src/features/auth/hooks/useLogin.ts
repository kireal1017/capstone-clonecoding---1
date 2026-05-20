import { useMutation } from '@tanstack/react-query';
import { login, type LoginRequest, type LoginResponseData } from '@/features/auth/api/login';
import { useAuthStore, type AuthUser } from '@/features/auth/stores/authStore';

/**
 * 로그인 useMutation 훅.
 * 성공 시 authStore.setAuth(user, accessToken) → isAuthenticated=true.
 * 네비게이션(원래 가려던 곳/홈)은 폼 컴포넌트가 onSuccess 콜백에서 수행한다.
 */
function toAuthUser(user: LoginResponseData['user']): AuthUser {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl ?? null,
  };
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<LoginResponseData, Error, LoginRequest>({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(toAuthUser(data.user), data.accessToken);
    },
  });
}
