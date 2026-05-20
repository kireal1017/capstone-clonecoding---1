import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * 보호 라우트 가드 — 미인증 시 /login으로 리다이렉트.
 * 진입하려던 위치를 state.from에 보존(Step 8에서 로그인 후 복귀에 사용).
 */
function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
