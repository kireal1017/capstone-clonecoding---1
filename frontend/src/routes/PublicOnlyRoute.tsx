import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * 공개 전용 라우트 가드 — 이미 인증된 사용자는 /로 리다이렉트.
 * (로그인/회원가입 페이지에 적용)
 */
function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
