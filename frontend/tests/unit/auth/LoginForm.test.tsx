import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import LoginForm from '@/features/auth/components/LoginForm';

/**
 * LoginForm RTL 단위 테스트.
 *
 * NOTE: 프론트엔드 테스트 러너(@testing-library/react, jsdom)가 아직
 * 구성되어 있지 않다(package.json 에 test 스크립트/의존성 없음).
 * 본 파일은 러너 구성 시 즉시 동작하도록 작성된 명세이며, 오케스트레이터가
 * 러너 구성 여부를 결정한다. (테스트를 약화/스킵하지 않음)
 */

// login API 모킹 — 실제 네트워크 호출 차단.
const loginMock = vi.fn();
vi.mock('@/features/auth/api/login', () => ({
  login: (payload: unknown) => loginMock(payload),
}));

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('이메일/비밀번호 입력과 로그인 버튼을 렌더링한다', () => {
    renderWithProviders(<LoginForm onSuccess={vi.fn()} />);
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('잘못된 이메일 형식이면 검증 오류를 표시하고 제출하지 않는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText('이메일'), 'not-an-email');
    await user.type(screen.getByLabelText('비밀번호'), 'password1');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('유효한 입력이면 login API 핸들러를 호출한다', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'token-123',
      user: { id: 1, email: 'user@planmate.com', nickname: '홍길동' },
    });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText('이메일'), 'user@planmate.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password1');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'user@planmate.com',
        password: 'password1',
      });
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
