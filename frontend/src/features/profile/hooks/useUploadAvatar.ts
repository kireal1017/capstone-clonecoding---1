import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadAvatar } from '@/features/profile/api/uploadAvatar';
import { profileQueryKey } from '@/features/profile/hooks/useProfile';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * 아바타 업로드 useMutation 훅 (POST /profile/avatar, multipart).
 * 성공 시 `['profile']` 무효화 + authStore.user.avatarUrl 동기화(헤더 반영).
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, File>({
    mutationFn: uploadAvatar,
    onSuccess: (avatarUrl) => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
      const { user: current, accessToken, setAuth } = useAuthStore.getState();
      if (current && accessToken) {
        setAuth({ ...current, avatarUrl }, accessToken);
      }
    },
  });
}
