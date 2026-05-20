import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLogout } from '@/features/auth/hooks/useLogout';

/**
 * 보호 영역 공통 레이아웃 — 헤더(앱 타이틀 + 내비 + 로그아웃) + main(Outlet).
 * Serene Productivity 토큰 기반의 절제된 스타일(소프트 보더 구분선, 800px 중앙 정렬).
 *
 * 로그아웃: useLogout → POST /auth/logout 후 clearAuth, /login 으로 이동.
 */
function AppShell() {
  const navigate = useNavigate();
  const { mutate: logoutMutate, isPending } = useLogout();

  const handleLogout = (): void => {
    logoutMutate(undefined, {
      onSettled: () => {
        navigate('/login', { replace: true });
      },
    });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? 'text-charcoal' : 'text-outline hover:text-charcoal';

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="border-b border-soft-border">
        <div className="mx-auto flex max-w-container items-center justify-between gap-gutter px-gutter py-4">
          <NavLink to="/" className="text-lg font-semibold text-charcoal">
            PlanMate
          </NavLink>
          <nav className="flex items-center gap-gutter text-sm">
            <NavLink to="/" className={navLinkClass} end>
              오늘의 일정
            </NavLink>
            <NavLink to="/profile" className={navLinkClass}>
              프로필
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="text-outline hover:text-charcoal disabled:opacity-50"
            >
              {isPending ? '로그아웃 중...' : '로그아웃'}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-container px-gutter py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;
