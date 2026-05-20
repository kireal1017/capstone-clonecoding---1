import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas/register.schema';
import type { ApiErrorResponse } from '@/types/api';

/**
 * 회원가입 폼 (wireframe §2).
 * - zod 검증(onBlur): 닉네임/이메일/비밀번호/비밀번호 확인
 * - 409 EMAIL_ALREADY_EXISTS: 이메일 필드 인라인 에러
 * - 422 VALIDATION_FAILED: error.details[] 를 해당 필드로 매핑
 * - 성공: onSuccess 콜백(부모가 /login 리다이렉트, 토큰 미발급 BE-06)
 */
interface RegisterFormProps {
  onSuccess: () => void;
}

/** 서버 검증 details 의 field 명을 폼 필드로 매핑(지원하지 않는 필드는 무시). */
const SERVER_FIELD_MAP: Record<string, keyof RegisterFormValues> = {
  email: 'email',
  password: 'password',
  nickname: 'nickname',
};

function RegisterForm({ onSuccess }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { nickname: '', email: '', password: '', confirmPassword: '' },
  });

  const { mutate, isPending } = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (values: RegisterFormValues): void => {
    setFormError(null);
    mutate(
      { email: values.email, password: values.password, nickname: values.nickname },
      {
        onSuccess: () => onSuccess(),
        onError: (error) => {
          if (!axios.isAxiosError(error)) {
            setFormError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            return;
          }
          const status = error.response?.status;
          if (status === 409) {
            setError('email', { message: '이미 사용 중인 이메일입니다.' });
            return;
          }
          if (status === 422) {
            const body = error.response?.data as ApiErrorResponse | undefined;
            const details = body?.success === false ? body.error.details : undefined;
            if (details && details.length > 0) {
              details.forEach((detail) => {
                const field = SERVER_FIELD_MAP[detail.field];
                if (field) {
                  setError(field, { message: detail.message });
                }
              });
              return;
            }
            setFormError('입력값을 다시 확인해주세요.');
            return;
          }
          if (status === 429) {
            setFormError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            return;
          }
          setFormError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Input
        label="닉네임"
        type="text"
        autoComplete="nickname"
        placeholder="홍길동"
        helperText="2~20자, 공백 불가"
        error={errors.nickname?.message}
        {...register('nickname')}
      />
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
        autoComplete="new-password"
        placeholder="••••••••••••"
        helperText="영문+숫자 포함 8자 이상"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="비밀번호 확인"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••••••"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      {formError ? (
        <p role="alert" className="text-sm text-error">
          {formError}
        </p>
      ) : null}
      <Button type="submit" variant="primary" fullWidth isLoading={isPending}>
        {isPending ? '가입 중...' : '가입하기'}
      </Button>
    </form>
  );
}

export default RegisterForm;
