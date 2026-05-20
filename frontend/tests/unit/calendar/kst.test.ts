import { describe, it, expect } from 'vitest';
import {
  diffInDays,
  getIsoWeekDates,
  getMonthGridDates,
  getWeekdayIndex,
  shiftMonth,
} from '@/lib/date/kst';

/**
 * KST 날짜 유틸 단위 테스트.
 * NOTE: 테스트 러너(vitest/jsdom) 미구성 — 러너 구성 시 즉시 동작하는 명세.
 */
describe('kst date utils', () => {
  it('diffInDays 는 캘린더 일수 차를 반환한다', () => {
    expect(diffInDays('2026-05-20', '2026-05-23')).toBe(3);
    expect(diffInDays('2026-05-20', '2026-05-19')).toBe(-1);
    expect(diffInDays('2026-05-20', '2026-05-20')).toBe(0);
  });

  it('getWeekdayIndex: 2026-05-20 은 수요일(3)', () => {
    expect(getWeekdayIndex('2026-05-20')).toBe(3);
  });

  it('getIsoWeekDates: 수요일 기준 주는 월~일(2026-05-18 ~ 24)', () => {
    expect(getIsoWeekDates('2026-05-20')).toEqual([
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
      '2026-05-23',
      '2026-05-24',
    ]);
  });

  it('getIsoWeekDates: 일요일(2026-05-24)도 같은 주에 속한다', () => {
    expect(getIsoWeekDates('2026-05-24')[6]).toBe('2026-05-24');
    expect(getIsoWeekDates('2026-05-24')[0]).toBe('2026-05-18');
  });

  it('getMonthGridDates: 42개 셀, 첫 셀은 일요일 시작', () => {
    const grid = getMonthGridDates('2026-05');
    expect(grid).toHaveLength(42);
    // 2026-05-01 은 금요일 → 격자 시작은 직전 일요일 2026-04-26
    expect(grid[0]).toBe('2026-04-26');
    expect(getWeekdayIndex(grid[0]!)).toBe(0);
  });

  it('shiftMonth: 연 경계 처리', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-05', 1)).toBe('2026-06');
  });
});
