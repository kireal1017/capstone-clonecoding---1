import { Link } from 'react-router-dom';

/**
 * 플로팅 액션 버튼 — wireframe-spec §3: 우하단 고정 charcoal 원형.
 * 일정 등록(`/tasks/new`)으로 이동하는 링크. (폼 자체는 Step 10.)
 */
interface FABProps {
  to: string;
  label: string;
}

function FAB({ to, label }: FABProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-3xl leading-none text-white shadow-md transition-colors hover:bg-charcoal/90"
    >
      <span aria-hidden>+</span>
    </Link>
  );
}

export default FAB;
