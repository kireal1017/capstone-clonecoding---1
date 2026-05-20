import { useEffect, useRef } from 'react';
import Chip from '@/components/ui/Chip';
import { parseDateOnly } from '@/lib/date/kst';
import type { Plan } from '@/types/domain';

/**
 * 캘린더 날짜 셀 미니 팝업 (wireframe §3, FE-07).
 * 해당 날짜(dueDate 기준)의 일정 제목 + 카테고리 태그 + 시간을 나열한다.
 * 외부 클릭 또는 ESC 로 닫는다. onSelectPlan 제공 시 일정 항목을 클릭해
 * 상세 모달을 연다(Step 11, ?planId=).
 */
interface CalendarDayPopupProps {
  date: string;
  plans: Plan[];
  onClose: () => void;
  /** 일정 항목 클릭 시 상세 모달 오픈(?planId=). */
  onSelectPlan?: (planId: number) => void;
}

function formatPopupTitle(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 일정`;
}

function CalendarDayPopup({ date, plans, onClose, onSelectPlan }: CalendarDayPopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const handleClick = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    // 셀 클릭과 동일 틱의 document 클릭으로 즉시 닫히지 않도록 다음 틱에 등록.
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
      window.clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={formatPopupTitle(date)}
      className="absolute left-1/2 top-full z-50 mt-1 w-64 -translate-x-1/2 rounded-card border border-soft-border bg-white p-3 shadow-md"
    >
      <p className="mb-2 border-b border-soft-border pb-2 text-xs font-medium text-charcoal">
        {formatPopupTitle(date)}
      </p>
      {plans.length === 0 ? (
        <p className="py-2 text-center text-xs text-outline">이 날 등록된 일정이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {plans.map((plan) => {
            const rowContent = (
              <>
                <span
                  className={[
                    'min-w-0 flex-1 truncate',
                    plan.isCompleted ? 'text-outline line-through' : 'text-on-surface',
                  ].join(' ')}
                >
                  {plan.title}
                </span>
                <Chip name={plan.category?.name ?? null} color={plan.category?.color ?? null} />
                {plan.dueTime ? <span className="text-outline">🕐{plan.dueTime}</span> : null}
              </>
            );
            return (
              <li key={plan.id}>
                {onSelectPlan ? (
                  <button
                    type="button"
                    onClick={() => onSelectPlan(plan.id)}
                    className="flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-left text-xs transition-colors hover:bg-surface-container-low"
                  >
                    {rowContent}
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2 px-1 py-0.5 text-xs">
                    {rowContent}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default CalendarDayPopup;
