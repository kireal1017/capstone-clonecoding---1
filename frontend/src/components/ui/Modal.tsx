import { useEffect, type ReactNode } from 'react';

/**
 * 범용 모달 셸 — 어두운 반투명 오버레이 + 중앙 카드 + (ESC / 오버레이 클릭) 닫기.
 * design-reference "Serene Productivity": 소프트 보더 카드 + 절제된 그림자.
 *
 * - open=false 이면 렌더링하지 않는다(조건부 마운트).
 * - ESC / 오버레이 클릭 → onClose.
 * - PlanDetailModal 등 본문 자유 구성 모달이 재사용한다.
 *   (확인 다이얼로그는 별도 ConfirmModal 사용.)
 */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** 접근성 라벨(헤더 텍스트가 별도 없을 때 사용). */
  ariaLabel?: string;
  /** 카드 최대 너비 Tailwind 클래스(기본 max-w-[480px]). */
  maxWidthClass?: string;
  children: ReactNode;
}

function Modal({ open, onClose, ariaLabel, maxWidthClass = 'max-w-[480px]', children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-gutter py-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={[
          'max-h-[90vh] w-full overflow-y-auto rounded-card border border-soft-border bg-white p-6 shadow-sm',
          maxWidthClass,
        ].join(' ')}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
