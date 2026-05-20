import { create } from 'zustand';

/**
 * 인증 상태 스토어 (Zustand) — Step 8 실제 토큰 기반 인증.
 *
 * - accessToken 은 메모리에만 보관(refresh 토큰은 httpOnly 쿠키, JS 접근 불가).
 * - 새로고침 복원(부트스트랩)은 useAuthBootstrap 훅이 수행: refresh → me 순서로
 *   성공 시 setAuth, 실패 시 clearAuth. 그 진행 상태를 `status` 로 노출한다.
 * - ProtectedRoute / PublicOnlyRoute 는 부트스트랩 완료(status !== 'idle' && !== 'loading')
 *   전까지 리다이렉트 판단을 보류해 깜빡임(redirect flash)을 방지한다.
 */

/** authStore 가 보관하는 사용자 표현 (login/me 응답 공통 부분집합). */
export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt?: string;
}

/** 부트스트랩(세션 복원) 진행 상태. */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  status: 'idle',
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, status: 'authenticated' }),
  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, status: 'unauthenticated' }),
  setStatus: (status) => set({ status }),
}));
