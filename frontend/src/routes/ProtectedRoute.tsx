import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import Spinner from '@/components/ui/Spinner';

/**
 * 보호 라우트 가드 — 미인증 시 /login으로 리다이렉트.
 * 진입하려던 위치를 state.from에 보존(로그인 후 복귀에 사용).
 *
 * 부트스트랩(세션 복원)이 진행 중('idle'/'loading')이면 판단을 보류하고
 * 로딩 폴백을 보여 리다이렉트 깜빡임을 방지한다.
 */
function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-charcoal">
        <Spinner size={28} label="세션 확인 중" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
