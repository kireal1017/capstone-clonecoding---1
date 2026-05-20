import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, type UpdateProfileBody } from '@/features/profile/api/updateProfile';
import { profileQueryKey } from '@/features/profile/hooks/useProfile';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { ProfileUser } from '@/types/domain';

/**
 * 닉네임 수정 useMutation 훅 (PATCH /profile).
 * 성공 시 `['profile']` 무효화 + authStore.user 동기화(헤더 등 반영).
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<ProfileUser, Error, UpdateProfileBody>({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
      const { user: current, accessToken, setAuth } = useAuthStore.getState();
      if (current && accessToken) {
        setAuth({ ...current, nickname: user.nickname, avatarUrl: user.avatarUrl }, accessToken);
      }
    },
  });
}
