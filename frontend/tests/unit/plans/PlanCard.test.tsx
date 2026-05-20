import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanCard from '@/features/plans/components/PlanCard';
import type { Plan } from '@/types/domain';

/**
 * PlanCard RTL 단위 테스트.
 * NOTE: 테스트 러너(@testing-library/react, jsdom) 미구성 — 러너 구성 시 즉시
 * 동작하는 명세이며 약화/스킵하지 않는다.
 */
function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 1,
    userId: 1,
    title: '영상처리 과제',
    dueDate: '2026-05-20',
    dueTime: '23:59',
    displayDate: '2026-05-20',
    categoryId: 2,
    category: { id: 2, name: '과제', color: '#2563EB' },
    priority: 'high',
    memo: null,
    isCompleted: false,
    isRemind: false,
    createdAt: '2026-05-18T09:00:00',
    updatedAt: '2026-05-18T09:00:00',
    ...overrides,
  };
}

describe('PlanCard', () => {
  it('제목/카테고리/시간/중요도/D-Day 를 렌더링한다', () => {
    render(<PlanCard plan={makePlan()} todayKst="2026-05-20" showCheckbox />);
    expect(screen.getByText('영상처리 과제')).toBeInTheDocument();
    expect(screen.getByText('과제')).toBeInTheDocument();
    expect(screen.getByText('🕐 23:59')).toBeInTheDocument();
    expect(screen.getByText('높음')).toBeInTheDocument();
    expect(screen.getByText('D-Day')).toBeInTheDocument();
  });

  it('체크박스 클릭 시 onToggle(planId) 를 호출한다', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <PlanCard plan={makePlan({ id: 7 })} todayKst="2026-05-20" showCheckbox onToggle={onToggle} />,
    );
    await user.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith(7);
  });

  it('isToggling=true 이면 체크박스가 비활성화된다', () => {
    render(
      <PlanCard plan={makePlan()} todayKst="2026-05-20" showCheckbox isToggling onToggle={vi.fn()} />,
    );
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('완료 항목은 line-through 스타일, D-Day 배지 숨김', () => {
    render(<PlanCard plan={makePlan({ isCompleted: true })} todayKst="2026-05-20" showCheckbox />);
    const title = screen.getByText('영상처리 과제');
    expect(title.className).toContain('line-through');
    expect(screen.queryByText('D-Day')).not.toBeInTheDocument();
  });

  it('showCheckbox 미지정(읽기 전용)이면 체크박스가 없다', () => {
    render(<PlanCard plan={makePlan()} todayKst="2026-05-20" />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
