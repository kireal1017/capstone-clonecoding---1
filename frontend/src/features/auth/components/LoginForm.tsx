import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login.schema';

/**
 * 로그인 폼 (wireframe §1).
 * - zod 검증(onBlur) → 통과 시 useLogin 호출
 * - 401(AUTH_INVALID_CREDENTIALS): 폼 하단 인라인 에러 노출
 * - 성공: onSuccess 콜백(부모가 네비게이션 수행)
 */
interface LoginFormProps {
  onSuccess: () => void;
}

function LoginForm({ onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const { mutate, isPending } = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (values: LoginFormValues): void => {
    setFormError(null);
    mutate(values, {
      onSuccess: () => onSuccess(),
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setFormError('이메일 또는 비밀번호가 올바르지 않습니다.');
          return;
        }
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          setFormError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
          return;
        }
        setFormError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Input
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="example@planmate.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••••••"
        error={errors.password?.message}
        {...register('password')}
      />
      {formError ? (
        <p role="alert" className="text-sm text-error">
          {formError}
        </p>
      ) : null}
      <Button type="submit" variant="primary" fullWidth isLoading={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}

export default LoginForm;
