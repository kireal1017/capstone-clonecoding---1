import Checkbox from '@/components/ui/Checkbox';
import Chip from '@/components/ui/Chip';
import Badge from '@/components/ui/Badge';
import { getDDayBadge } from '@/lib/date/dday';
import type { Plan, Priority } from '@/types/domain';

/**
 * 일정 카드 — 오늘 할 일(체크박스 + 완료 토글)과 주간 바 확장 목록(읽기 전용)에서 공용.
 * wireframe-spec §3: `border border-soft-border rounded-lg p-3 bg-white`,
 * 완료 카드는 `text-outline line-through`.
 *
 * - showCheckbox=true: 좌측 완료 체크박스 표시(오늘 할 일). onToggle 로 토글.
 * - 더블클릭 가드: isToggling=true 이면 체크박스 disabled.
 * - D-Day 배지는 dueDate vs todayKst 로 계산해 우측에 표시.
 * - onSelect 제공 시 카드 클릭으로 상세 모달을 연다(Step 11, ?planId=). 완료
 *   체크박스 클릭은 stopPropagation 으로 모달 오픈을 막는다.
 */
interface PlanCardProps {
  plan: Plan;
  todayKst: string;
  showCheckbox?: boolean;
  isToggling?: boolean;
  onToggle?: (planId: number) => void;
  /** 카드 클릭 시 상세 모달 오픈(미제공 시 비클릭 읽기 전용). */
  onSelect?: (planId: number) => void;
}

const PRIORITY_LABEL: Record<Priority, string> = {
  high: '높음',
  normal: '보통',
  low: '낮음',
};

function PlanCard({
  plan,
  todayKst,
  showCheckbox = false,
  isToggling = false,
  onToggle,
  onSelect,
}: PlanCardProps) {
  const completed = plan.isCompleted;
  const badge = getDDayBadge(plan.dueDate, todayKst);
  const clickable = Boolean(onSelect);

  const handleCardClick = (): void => {
    onSelect?.(plan.id);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!clickable) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(plan.id);
    }
  };

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-card border border-soft-border bg-white p-3',
        clickable ? 'cursor-pointer transition-colors hover:border-charcoal/40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleCardClick : undefined}
      onKeyDown={clickable ? handleCardKeyDown : undefined}
    >
      {showCheckbox ? (
        <span onClick={(event) => event.stopPropagation()}>
          <Checkbox
            label={`${plan.title} 완료 토글`}
            checked={completed}
            disabled={isToggling}
            onChange={() => onToggle?.(plan.id)}
            className="mt-0.5"
          />
        </span>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p
          className={[
            'truncate text-sm font-medium',
            completed ? 'text-outline line-through' : 'text-on-surface',
          ].join(' ')}
        >
          {plan.title}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-xs text-outline">
          <Chip name={plan.category?.name ?? null} color={plan.category?.color ?? null} />
          {plan.dueTime ? <span>🕐 {plan.dueTime}</span> : null}
          <span>{PRIORITY_LABEL[plan.priority]}</span>
          {!completed ? <Badge badge={badge} /> : null}
        </div>
      </div>
    </div>
  );
}

export default PlanCard;
