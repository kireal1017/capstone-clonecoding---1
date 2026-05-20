import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import RegisterForm from '@/features/auth/components/RegisterForm';

/**
 * RegisterForm RTL 단위 테스트.
 *
 * NOTE: 프론트엔드 테스트 러너(@testing-library/react, jsdom)가 아직
 * 구성되어 있지 않다. 본 파일은 러너 구성 시 즉시 동작하도록 작성된 명세이다.
 */

const registerMock = vi.fn();
vi.mock('@/features/auth/api/register', () => ({
  register: (payload: unknown) => registerMock(payload),
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

describe('RegisterForm', () => {
  beforeEach(() => {
    registerMock.mockReset();
  });

  it('닉네임/이메일/비밀번호/비밀번호 확인 필드와 가입 버튼을 렌더링한다', () => {
    renderWithProviders(<RegisterForm onSuccess={vi.fn()} />);
    expect(screen.getByLabelText('닉네임')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument();
  });

  it('짧은 닉네임이면 검증 오류를 표시한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText('닉네임'), '홍');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByText('닉네임은 2자 이상 입력해주세요.')).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('영문/숫자 조건을 만족하지 못하는 비밀번호면 검증 오류를 표시한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText('닉네임'), '홍길동');
    await user.type(screen.getByLabelText('이메일'), 'user@planmate.com');
    await user.type(screen.getByLabelText('비밀번호'), 'onlyletters');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'onlyletters');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(
      await screen.findByText('비밀번호는 영문과 숫자를 모두 포함해야 합니다.'),
    ).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('비밀번호 확인이 일치하지 않으면 검증 오류를 표시한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText('닉네임'), '홍길동');
    await user.type(screen.getByLabelText('이메일'), 'user@planmate.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password1');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password2');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('유효한 입력이면 register API 핸들러를 호출한다', async () => {
    registerMock.mockResolvedValue({
      user: { id: 1, email: 'user@planmate.com', nickname: '홍길동', createdAt: '2026-05-21' },
    });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText('닉네임'), '홍길동');
    await user.type(screen.getByLabelText('이메일'), 'user@planmate.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password1');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password1');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        email: 'user@planmate.com',
        password: 'password1',
        nickname: '홍길동',
      });
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
