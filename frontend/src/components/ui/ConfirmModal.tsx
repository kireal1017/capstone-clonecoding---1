import { useEffect, type ReactNode } from 'react';
import Button from '@/components/ui/Button';

/**
 * 확인 모달 — 오버레이 + 중앙 카드 + (취소/확인) 버튼.
 * 등록 확인("일정을 등록하시겠습니까?")·취소 확인("작성 중인 내용이 사라집니다…")에 공용.
 * design-reference "Serene Productivity": 어두운 반투명 오버레이 + 소프트 보더 카드.
 *
 * - open=false 이면 렌더링하지 않는다(조건부 마운트).
 * - Esc / 오버레이 클릭 → onCancel.
 * - 확인 버튼은 isConfirming 동안 로딩/비활성.
 */
interface ConfirmModalProps {
  open: boolean;
  /** 모달 본문 메시지(여러 줄 가능). */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  open,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-gutter"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-card border border-soft-border bg-white p-5 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-sm text-on-surface">{message}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            isLoading={isConfirming}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
