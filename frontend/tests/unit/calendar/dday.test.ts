import { describe, it, expect } from 'vitest';
import { getDDayBadge } from '@/lib/date/dday';

/**
 * D-Day 배지 헬퍼 단위 테스트 (wireframe §10 / PRD §32).
 *
 * NOTE: 프론트엔드 테스트 러너(vitest/jsdom)는 아직 구성되어 있지 않다
 * (package.json 에 test 스크립트/의존성 없음). 본 파일은 러너 구성 시 즉시
 * 동작하도록 작성된 명세이며, 약화/스킵하지 않는다.
 */
describe('getDDayBadge', () => {
  const today = '2026-05-20';

  it('diff===0 이면 D-Day(빨강)', () => {
    const b = getDDayBadge('2026-05-20', today);
    expect(b.label).toBe('D-Day');
    expect(b.bgColor).toBe('#FEE2E2');
    expect(b.textColor).toBe('#DC2626');
  });

  it('diff===1 이면 D-1(주황)', () => {
    const b = getDDayBadge('2026-05-21', today);
    expect(b.label).toBe('D-1');
    expect(b.bgColor).toBe('#FEF3C7');
  });

  it('diff===3 이면 D-3(노랑)', () => {
    const b = getDDayBadge('2026-05-23', today);
    expect(b.label).toBe('D-3');
    expect(b.bgColor).toBe('#FEF9C3');
  });

  it('diff<0 이면 마감 지남(회색)', () => {
    const b = getDDayBadge('2026-05-19', today);
    expect(b.label).toBe('마감 지남');
    expect(b.bgColor).toBe('#F3F4F6');
  });

  it('diff===2 이면 plain 날짜(배경 없음)', () => {
    const b = getDDayBadge('2026-05-22', today);
    expect(b.label).toBe('2026.05.22');
    expect(b.bgColor).toBeNull();
    expect(b.textColor).toBe('#7a776e');
  });

  it('diff>=4 이면 plain 날짜(배경 없음)', () => {
    const b = getDDayBadge('2026-05-30', today);
    expect(b.label).toBe('2026.05.30');
    expect(b.bgColor).toBeNull();
  });
});
