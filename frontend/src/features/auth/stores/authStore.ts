import { create } from 'zustand';
import type { User } from '@/types/domain';

/**
 * 인증 상태 스토어 (Zustand) — Step 7 골격 단계.
 *
 * Step 8: replace with real token-based auth; default will become false
 *
 * 현재 `isAuthenticated`의 기본값을 true로 두어 보호 라우트(AppShell 하위)가
 * 골격 검증 단계에서 탐색 가능하도록 한다. 가드 로직 자체는 정상 구현되어
 * 있으므로, Step 8에서 기본값을 false로 바꾸고 실제 로그인 상태를 주입하면
 * 그대로 동작한다.
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  // Step 8: replace with real token-based auth; default will become false
  isAuthenticated: true,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
