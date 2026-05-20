import type { ReactNode } from 'react';

/**
 * 공통 빈 상태 — 조용하고 미니멀(과한 그래픽 없음, design-reference).
 * 1줄 메시지 + 선택적 보조 텍스트 + 선택적 액션 슬롯.
 * 카드 톤(소프트 보더)로 주변 일정 카드와 시각적 일관성을 유지한다.
 * 사용처: 오늘 할 일 없음 / 검색 결과 없음 / 필터 결과 없음 / 카테고리 없음 / 주간 바 해당 요일 없음.
 */
interface EmptyStateProps {
  /** 주 메시지(1줄). */
  message: string;
  /** 보조 안내 텍스트(선택). */
  description?: string;
  /** 추가 액션(버튼 등, 선택). */
  action?: ReactNode;
  /** 패딩 등 외형 미세 조정(선택). */
  className?: string;
}

function EmptyState({ message, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center gap-1 rounded-card border border-soft-border bg-white px-4 py-8 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-sm text-on-surface">{message}</p>
      {description ? <p className="text-xs text-outline">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
