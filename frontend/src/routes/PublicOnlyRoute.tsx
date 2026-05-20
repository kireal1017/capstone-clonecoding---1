import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import Spinner from '@/components/ui/Spinner';

/**
 * 공개 전용 라우트 가드 — 이미 인증된 사용자는 /로 리다이렉트.
 * (로그인/회원가입 페이지에 적용)
 *
 * 부트스트랩 진행 중에는 판단을 보류해 깜빡임을 방지한다.
 */
function PublicOnlyRoute() {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-charcoal">
        <Spinner size={28} label="세션 확인 중" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
