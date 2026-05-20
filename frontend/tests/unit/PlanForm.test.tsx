import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import PlanForm from '@/features/plans/components/PlanForm';
import { ToastProvider } from '@/components/ui/Toast';

/**
 * PlanForm RTL 단위 테스트.
 *
 * NOTE: 프론트엔드 테스트 러너(@testing-library/react, jsdom)가 아직
 * 구성되어 있지 않다(package.json 에 test 스크립트/의존성 없음). 본 파일은 러너
 * 구성 시 즉시 동작하도록 작성된 명세이며, 오케스트레이터가 러너 구성 여부를
 * 결정한다. (테스트를 약화/스킵하지 않음)
 */

// 네트워크 호출 차단: createPlan(POST)/getCategories(GET) 모킹.
const createPlanMock = vi.fn();
vi.mock('@/features/plans/api/createPlan', () => ({
  createPlan: (payload: unknown) => createPlanMock(payload),
}));

const getCategoriesMock = vi.fn();
vi.mock('@/features/categories/api/getCategories', () => ({
  getCategories: () => getCategoriesMock(),
}));

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('PlanForm (create mode)', () => {
  beforeEach(() => {
    createPlanMock.mockReset();
    getCategoriesMock.mockReset();
    getCategoriesMock.mockResolvedValue([
      { id: 1, userId: 1, name: '과제', color: '#2563EB', sortOrder: 1, createdAt: '', updatedAt: '' },
    ]);
  });

  it('주요 필드(제목/마감 기한/표시 날짜/메모)와 저장·취소 버튼을 렌더링한다', () => {
    renderWithProviders(<PlanForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('할 일 제목 *')).toBeInTheDocument();
    expect(screen.getByLabelText('마감 기한 *')).toBeInTheDocument();
    expect(screen.getByLabelText('오늘의 할 일에 표시 날짜 *')).toBeInTheDocument();
    expect(screen.getByLabelText('메모')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });

  it('제목이 비어 있으면 검증 오류를 표시하고 제출하지 않는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />);

    await user.clear(screen.getByLabelText('할 일 제목 *'));
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(await screen.findByText('제목을 입력해주세요.')).toBeInTheDocument();
    expect(createPlanMock).not.toHaveBeenCalled();
  });

  it('표시 날짜가 마감 기한보다 늦으면 교차 검증 오류를 표시한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanForm mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('할 일 제목 *'), '과제 제출');
    await user.clear(screen.getByLabelText('마감 기한 *'));
    await user.type(screen.getByLabelText('마감 기한 *'), '2026-05-20');
    // 표시 날짜를 직접 수정 → 자동 동기화 중단.
    await user.clear(screen.getByLabelText('오늘의 할 일에 표시 날짜 *'));
    await user.type(screen.getByLabelText('오늘의 할 일에 표시 날짜 *'), '2026-05-25');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(
      await screen.findByText('표시 날짜는 마감 기한 이전이어야 합니다.'),
    ).toBeInTheDocument();
    expect(createPlanMock).not.toHaveBeenCalled();
  });

  it('유효한 입력 후 저장 확인 시 createPlan 핸들러를 snake_case 바디로 호출한다', async () => {
    createPlanMock.mockResolvedValue({
      id: 5,
      userId: 1,
      title: '과제 제출',
      dueDate: '2026-05-25',
      dueTime: null,
      displayDate: '2026-05-25',
      categoryId: null,
      category: null,
      priority: 'normal',
      memo: null,
      isCompleted: false,
      isRemind: false,
      createdAt: '',
      updatedAt: '',
    });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<PlanForm mode="create" onSuccess={onSuccess} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('할 일 제목 *'), '과제 제출');
    await user.clear(screen.getByLabelText('마감 기한 *'));
    await user.type(screen.getByLabelText('마감 기한 *'), '2026-05-25');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    // 저장 확인 모달 → 확인 클릭.
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('일정을 등록하시겠습니까?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(createPlanMock).toHaveBeenCalledTimes(1);
    });
    expect(createPlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '과제 제출',
        due_date: '2026-05-25',
        display_date: '2026-05-25',
        category_id: null,
        priority: 'normal',
        is_remind: false,
      }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
