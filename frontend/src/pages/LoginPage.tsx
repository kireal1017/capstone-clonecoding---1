import { Link } from 'react-router-dom';

/**
 * 로그인 페이지 (공개) — Step 7 골격.
 * 이메일/비밀번호 폼 영역 자리표시. 실제 폼/제출 로직은 Step 8.
 */
function LoginPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto flex max-w-sm flex-col gap-6 px-gutter py-16">
        <h1 className="text-2xl font-semibold text-charcoal">로그인</h1>
        <section
          aria-label="로그인 폼"
          className="rounded-card border border-soft-border bg-surface-container-low p-6"
        >
          <p className="text-sm text-outline">이메일 / 비밀번호 입력 영역 (Step 8 구현 예정)</p>
        </section>
        <p className="text-sm text-outline">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-charcoal underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
