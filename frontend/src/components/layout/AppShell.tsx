import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * 보호 영역 공통 레이아웃 — 헤더(앱 타이틀 + 내비 + 로그아웃) + main(Outlet).
 * Serene Productivity 토큰 기반의 절제된 스타일(소프트 보더 구분선, 800px 중앙 정렬).
 *
 * 로그아웃 버튼은 Step 7 골격에서는 authStore.clearAuth만 호출(API 미연동, Step 8).
 */
function AppShell() {
  const clearAuth = useAuthStore((state) => state.clearAuth);

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
              onClick={clearAuth}
              className="text-outline hover:text-charcoal"
            >
              로그아웃
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
