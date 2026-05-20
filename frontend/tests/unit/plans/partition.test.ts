import { describe, it, expect } from 'vitest';
import {
  groupByDueDate,
  selectTodayPlans,
  selectWeeklyPlans,
} from '@/features/plans/hooks/usePlans';
import type { Plan } from '@/types/domain';

/**
 * 일정 영역 분할 헬퍼 단위 테스트.
 * NOTE: 테스트 러너(vitest/jsdom) 미구성 — 러너 구성 시 즉시 동작하는 명세.
 */
function makePlan(overrides: Partial<Plan>): Plan {
  return {
    id: 1,
    userId: 1,
    title: '테스트',
    dueDate: '2026-05-20',
    dueTime: null,
    displayDate: '2026-05-20',
    categoryId: null,
    category: null,
    priority: 'normal',
    memo: null,
    isCompleted: false,
    isRemind: false,
    createdAt: '2026-05-18T09:00:00',
    updatedAt: '2026-05-18T09:00:00',
    ...overrides,
  };
}

describe('plan partition helpers', () => {
  it('groupByDueDate: dueDate 로 그룹핑(완료 포함)', () => {
    const plans = [
      makePlan({ id: 1, dueDate: '2026-05-20' }),
      makePlan({ id: 2, dueDate: '2026-05-20', isCompleted: true }),
      makePlan({ id: 3, dueDate: '2026-05-25' }),
    ];
    const map = groupByDueDate(plans);
    expect(map.get('2026-05-20')).toHaveLength(2);
    expect(map.get('2026-05-25')).toHaveLength(1);
  });

  it('selectTodayPlans: displayDate==today 이고 미완료만, priority 정렬', () => {
    const plans = [
      makePlan({ id: 1, displayDate: '2026-05-20', priority: 'low' }),
      makePlan({ id: 2, displayDate: '2026-05-20', priority: 'high' }),
      makePlan({ id: 3, displayDate: '2026-05-20', isCompleted: true }),
      makePlan({ id: 4, displayDate: '2026-05-21' }),
    ];
    const result = selectTodayPlans(plans, '2026-05-20');
    expect(result.map((p) => p.id)).toEqual([2, 1]); // high 먼저, 완료/다른날 제외
  });

  it('selectTodayPlans: dueTime null 은 최하위', () => {
    const plans = [
      makePlan({ id: 1, displayDate: '2026-05-20', priority: 'high', dueTime: null }),
      makePlan({ id: 2, displayDate: '2026-05-20', priority: 'high', dueTime: '09:00' }),
    ];
    const result = selectTodayPlans(plans, '2026-05-20');
    expect(result.map((p) => p.id)).toEqual([2, 1]);
  });

  it('selectWeeklyPlans: displayDate 기준 요일별 집계', () => {
    const weekDates = [
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
      '2026-05-23',
      '2026-05-24',
    ];
    const plans = [
      makePlan({ id: 1, displayDate: '2026-05-20' }),
      makePlan({ id: 2, displayDate: '2026-05-20' }),
      makePlan({ id: 3, displayDate: '2026-05-24' }),
    ];
    const result = selectWeeklyPlans(plans, weekDates);
    expect(result[2]).toHaveLength(2); // 수요일(2026-05-20)
    expect(result[6]).toHaveLength(1); // 일요일(2026-05-24)
    expect(result[0]).toHaveLength(0);
  });
});
