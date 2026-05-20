import { Link, useLocation, useNavigate } from 'react-router-dom';
import LoginForm from '@/features/auth/components/LoginForm';

/**
 * 로그인 페이지 (공개, wireframe §1).
 * 로고 + 태그라인 + LoginForm + 회원가입 링크.
 * 로그인 성공 → 원래 가려던 곳(state.from) 또는 홈('/')으로 이동.
 * 회원가입 직후 진입 시(state.registered) 안내 메시지 노출.
 */
interface LoginLocationState {
  from?: { pathname?: string };
  registered?: boolean;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as LoginLocationState | null;
  const redirectTo = state?.from?.pathname ?? '/';
  const showRegisteredNotice = state?.registered === true;

  const handleSuccess = (): void => {
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-gutter py-16">
        <header className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal">PlanMate</h1>
          <p className="text-sm text-outline">차분한 생산성의 시작</p>
        </header>

        <section
          aria-label="로그인"
          className="mx-auto w-full rounded-card border border-soft-border bg-white p-8"
        >
          {showRegisteredNotice ? (
            <p
              role="status"
              className="mb-4 rounded border border-soft-border bg-surface-container-low px-3 py-2 text-sm text-outline"
            >
              회원가입이 완료되었습니다. 로그인해주세요.
            </p>
          ) : null}
          <LoginForm onSuccess={handleSuccess} />
        </section>

        <p className="text-center text-sm text-outline">
          계정이 없으신가요?{' '}
          <Link to="/register" className="font-medium text-charcoal underline">
            회원가입
          </Link>
        </p>

        <p className="text-center text-xs text-outline">© 2026 PlanMate</p>
      </div>
    </div>
  );
}

export default LoginPage;
