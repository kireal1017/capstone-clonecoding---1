import { useMemo } from 'react';
import PlanCard from '@/features/plans/components/PlanCard';
import { usePlanStore } from '@/features/plans/stores/planStore';
import { selectWeeklyPlans } from '@/features/plans/hooks/usePlans';
import { getIsoWeekDates, getWeekdayIndex } from '@/lib/date/kst';
import type { Plan } from '@/types/domain';

/**
 * 주간 일정 바 — 이번 주(월~일, KST) 요일별 일정 개수 막대.
 * 집계 기준은 displayDate (PRD §24-1, AI-19). 오늘 요일 막대는 charcoal,
 * 나머지는 outline/30. 요일 선택 시 그 날 일정 목록을 읽기 전용으로 펼친다
 * (재클릭 시 접힘 — PRD §24-3 / U-10). 카드는 읽기 전용(체크박스 없음).
 */
interface WeeklyPlanBarProps {
  plans: Plan[];
  todayKst: string;
}

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const MAX_BAR_HEIGHT = 60;

function WeeklyPlanBar({ plans, todayKst }: WeeklyPlanBarProps) {
  const selectedWeekday = usePlanStore((s) => s.selectedWeekday);
  const toggleWeekday = usePlanStore((s) => s.toggleWeekday);

  // 이번 주 7일(월~일). 오늘의 주간 인덱스: 일(0)→6, 그 외 dow-1.
  const weekDates = useMemo(() => getIsoWeekDates(todayKst), [todayKst]);
  const todayDow = getWeekdayIndex(todayKst);
  const todayWeekIndex = todayDow === 0 ? 6 : todayDow - 1;

  const weeklyPlans = useMemo(() => selectWeeklyPlans(plans, weekDates), [plans, weekDates]);
  const maxCount = Math.max(1, ...weeklyPlans.map((list) => list.length));

  const selectedPlans = selectedWeekday !== null ? (weeklyPlans[selectedWeekday] ?? []) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        {WEEKDAY_LABELS.map((label, index) => {
          const count = weeklyPlans[index]?.length ?? 0;
          const isToday = index === todayWeekIndex;
          const isSelected = index === selectedWeekday;
          const barHeight = count === 0 ? 4 : Math.round((count / maxCount) * MAX_BAR_HEIGHT);

          return (
            <button
              key={label}
              type="button"
              onClick={() => toggleWeekday(index)}
              aria-pressed={isSelected}
              aria-label={`${label}요일 일정 ${count}건`}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="flex h-[60px] w-full items-end justify-center">
                <span
                  className={[
                    'w-5 rounded-t transition-colors',
                    isToday ? 'bg-charcoal' : 'bg-outline/30',
                    isSelected ? 'ring-1 ring-charcoal' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ height: barHeight }}
                />
              </span>
              <span className={isToday ? 'text-xs font-medium text-charcoal' : 'text-xs text-outline'}>
                {label}
              </span>
              <span className="text-xs text-outline">{count}</span>
            </button>
          );
        })}
      </div>

      {selectedWeekday !== null ? (
        <div className="flex flex-col gap-2">
          {selectedPlans.length === 0 ? (
            <p className="rounded-card border border-soft-border bg-white px-4 py-4 text-center text-xs text-outline">
              이 날 등록된 일정이 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedPlans.map((plan) => (
                <li key={plan.id}>
                  <PlanCard plan={plan} todayKst={todayKst} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default WeeklyPlanBar;
