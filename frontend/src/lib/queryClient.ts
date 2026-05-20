import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query 클라이언트 — Step 7 골격.
 * 세부 캐시/리트라이 정책은 데이터 연동 Step(9+)에서 조정.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
