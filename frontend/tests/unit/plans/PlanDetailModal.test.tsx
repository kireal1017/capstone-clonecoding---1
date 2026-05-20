import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import PlanDetailModal from '@/features/plans/components/PlanDetailModal';
import { ToastProvider } from '@/components/ui/Toast';
import { plansQueryKey } from '@/features/plans/hooks/usePlans';
import type { Plan } from '@/types/domain';

/**
 * PlanDetailModal 읽기 전용 렌더 RTL 단위 테스트.
 *
 * NOTE: 프론트엔드 테스트 러너(@testing-library/react, jsdom)가 아직 구성되어
 * 있지 않다. 본 파일은 러너 구성 시 즉시 동작하도록 작성된 명세이며, 약화/스킵하지 않는다.
 *
 * `['plans']` 캐시를 미리 채워 GET /plans/:id 폴백 없이 캐시 적중 경로를 검증한다.
 */
function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 42,
    userId: 1,
    title: '영상처리 과제 제출',
    dueDate: '2026-05-25',
    dueTime: '23:59',
    displayDate: '2026-05-20',
    categoryId: 2,
    category: { id: 2, name: '과제', color: '#2563EB' },
    priority: 'high',
    memo: '5장 분량으로 작성',
    isCompleted: false,
    isRemind: true,
    createdAt: '2026-05-18T09:00:00',
    updatedAt: '2026-05-18T09:00:00',
    ...overrides,
  };
}

function renderWithProviders(ui: ReactElement, plan: Plan) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(plansQueryKey, { plans: [plan], total: 1 });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('PlanDetailModal (read-only)', () => {
  it('캐시된 일정의 제목/카테고리/중요도/메모/알림을 표시한다', () => {
    const plan = makePlan();
    renderWithProviders(<PlanDetailModal planId={42} onClose={vi.fn()} />, plan);

    expect(screen.getByText('영상처리 과제 제출')).toBeInTheDocument();
    expect(screen.getByText('과제')).toBeInTheDocument();
    expect(screen.getByText('높음')).toBeInTheDocument();
    expect(screen.getByText('5장 분량으로 작성')).toBeInTheDocument();
    expect(screen.getByText('당일 알림 설정됨')).toBeInTheDocument();
  });

  it('수정/삭제/완료 토글 컨트롤을 렌더링한다', () => {
    renderWithProviders(<PlanDetailModal planId={42} onClose={vi.fn()} />, makePlan());
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '완료로 표시' })).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose 를 호출한다', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<PlanDetailModal planId={42} onClose={onClose} />, makePlan());
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('삭제 버튼 클릭 시 확인 모달이 열린다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanDetailModal planId={42} onClose={vi.fn()} />, makePlan());
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(await screen.findByText(/이 일정을 삭제하시겠습니까/)).toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 편집 폼(저장하기)으로 전환된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanDetailModal planId={42} onClose={vi.fn()} />, makePlan());
    await user.click(screen.getByRole('button', { name: '수정' }));
    expect(await screen.findByRole('button', { name: '저장하기' })).toBeInTheDocument();
  });
});
