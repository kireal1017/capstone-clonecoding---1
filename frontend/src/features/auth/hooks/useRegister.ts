import { useMutation } from '@tanstack/react-query';
import {
  register,
  type RegisterRequest,
  type RegisterResponseData,
} from '@/features/auth/api/register';

/**
 * 회원가입 useMutation 훅.
 * [BE-06] 가입 성공 시 토큰 미발급 — authStore 변경 없음.
 * 성공 후 /login 리다이렉트는 폼 컴포넌트가 onSuccess 콜백에서 수행한다.
 */
export function useRegister() {
  return useMutation<RegisterResponseData, Error, RegisterRequest>({
    mutationFn: register,
  });
}
