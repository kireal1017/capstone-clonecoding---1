import { useMutation } from '@tanstack/react-query';
import {
  changePassword,
  type ChangePasswordBody,
  type ChangePasswordResponseData,
} from '@/features/profile/api/changePassword';

/**
 * 비밀번호 변경 useMutation 훅 (PATCH /profile/password).
 * 캐시 무효화 없음(서버 상태 캐싱 대상 아님). 성공/오류 처리는 폼이 수행한다.
 */
export function useChangePassword() {
  return useMutation<ChangePasswordResponseData, Error, ChangePasswordBody>({
    mutationFn: changePassword,
  });
}
