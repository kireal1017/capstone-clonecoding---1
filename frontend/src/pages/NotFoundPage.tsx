import { Link } from 'react-router-dom';

/**
 * 404 페이지 — Step 7 골격. 일치하는 라우트가 없을 때 표시.
 */
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto flex max-w-container flex-col items-center gap-4 px-gutter py-24 text-center">
        <h1 className="text-2xl font-semibold text-charcoal">페이지를 찾을 수 없습니다</h1>
        <Link to="/" className="text-sm text-charcoal underline">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
