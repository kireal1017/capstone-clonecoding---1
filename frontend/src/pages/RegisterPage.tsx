import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '@/features/auth/components/RegisterForm';

/**
 * 회원가입 페이지 (공개, wireframe §2).
 * 로고 + RegisterForm + 로그인 링크.
 * [BE-06] 가입 성공 시 토큰 미발급 → /login 으로 리다이렉트(안내 메시지 state 전달).
 */
function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = (): void => {
    navigate('/login', { replace: true, state: { registered: true } });
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-gutter py-16">
        <header className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal">PlanMate</h1>
          <p className="text-sm text-outline">회원가입</p>
        </header>

        <section
          aria-label="회원가입"
          className="mx-auto w-full rounded-card border border-soft-border bg-white p-8"
        >
          <RegisterForm onSuccess={handleSuccess} />
        </section>

        <p className="text-center text-sm text-outline">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-charcoal underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
