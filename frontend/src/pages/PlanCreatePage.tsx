import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanForm from '@/features/plans/components/PlanForm';

/**
 * 할 일 등록 페이지 (보호, `/tasks/new`) — Step 10.
 *
 * AppShell 하위에 렌더링되며, 자체 헤더(뒤로가기 ← + 제목 "할일 등록")와
 * PlanForm(등록 모드)을 표시한다. 등록 성공 또는 취소 확정 시 메인(`/`)으로 이동한다.
 * (FE-06: 헤더 ← == 취소 버튼 — PlanForm 이 등록한 취소 요청 트리거를 호출해
 * dirty 여부에 따라 확인 모달/즉시 취소가 동일하게 동작한다.)
 */
function PlanCreatePage() {
  const navigate = useNavigate();
  const requestCancelRef = useRef<(() => void) | null>(null);

  const goToMain = (): void => {
    navigate('/', { replace: true });
  };

  const handleBack = (): void => {
    if (requestCancelRef.current) {
      requestCancelRef.current();
      return;
    }
    goToMain();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={handleBack}
          className="text-outline hover:text-charcoal"
        >
          ←
        </button>
        <h1 className="text-2xl font-semibold text-charcoal">할일 등록</h1>
      </div>

      <section
        aria-label="일정 등록 폼"
        className="rounded-card border border-soft-border bg-surface-container-low p-6"
      >
        <PlanForm
          mode="create"
          onSuccess={goToMain}
          onCancel={goToMain}
          registerCancelRequest={(requestCancel) => {
            requestCancelRef.current = requestCancel;
          }}
        />
      </section>
    </div>
  );
}

export default PlanCreatePage;
