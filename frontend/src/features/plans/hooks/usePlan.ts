import { useQuery } from '@tanstack/react-query';
import { getPlan } from '@/features/plans/api/getPlan';
import type { Plan } from '@/types/domain';

/**
 * 단건 일정 useQuery 훅 (GET /plans/:id).
 *
 * 상세 모달은 우선 `['plans']` 캐시에서 대상 일정을 찾고, 없을 때만 이 훅으로
 * 폴백 조회한다(`enabled` 로 제어). id 가 null 이거나 캐시 적중 시 비활성.
 */
export function planQueryKey(id: number): readonly ['plan', number] {
  return ['plan', id] as const;
}

export function usePlan(id: number | null, enabled: boolean) {
  return useQuery<Plan, Error>({
    queryKey: planQueryKey(id ?? -1),
    queryFn: () => getPlan(id as number),
    enabled: enabled && id !== null,
    staleTime: 30_000,
  });
}
