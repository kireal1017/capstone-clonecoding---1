import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/features/profile/api/getProfile';
import type { ProfileUser } from '@/types/domain';

/**
 * 프로필 조회 useQuery 훅 (GET /profile, query key `['profile']`).
 * ProfilePage 마운트 시 호출. 닉네임/아바타 수정 후 무효화로 갱신.
 */
export const profileQueryKey = ['profile'] as const;

export function useProfile() {
  return useQuery<ProfileUser, Error>({
    queryKey: profileQueryKey,
    queryFn: getProfile,
    staleTime: 60_000,
  });
}
