import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useChangePassword } from '@/features/profile/hooks/useChangePassword';
import { passwordSchema, type PasswordFormValues } from '@/features/profile/schemas/password.schema';
import type { ApiErrorDetail } from '@/types/api';

/**
 * 비밀번호 변경 폼 (api-spec §6-3, wireframe §6).
 * - 현재 비밀번호 + 새 비밀번호(영문+숫자 8~72) + 확인(일치).
 * - 401 AUTH_INVALID_CREDENTIALS → "현재 비밀번호가 올바르지 않습니다."
 * - 422 → 필드 오류 매핑. 성공 시 입력 초기화 + 성공 토스트.
 */
function PasswordForm() {
  const { showToast } = useToast();
  const changeMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onBlur',
    defaultValues: { currentPassword: '', newPassword: '', newPasswordConfirm: '' },
  });

  const onValid = (values: PasswordFormValues): void => {
    changeMutation.mutate(values, {
      onSuccess: () => {
        showToast('비밀번호를 변경했습니다.', 'success');
        reset({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const body = error.response?.data as
            | { error?: { code?: string; details?: ApiErrorDetail[] } }
            | undefined;
          if (status === 401 && body?.error?.code === 'AUTH_INVALID_CREDENTIALS') {
            setError('currentPassword', {
              type: 'server',
              message: '현재 비밀번호가 올바르지 않습니다.',
            });
            return;
          }
          if (status === 422 && Array.isArray(body?.error?.details)) {
            let mapped = false;
            for (const detail of body.error.details) {
              if (detail.field === 'currentPassword') {
                setError('currentPassword', { type: 'server', message: detail.message });
                mapped = true;
              } else if (detail.field === 'newPassword') {
                setError('newPassword', { type: 'server', message: detail.message });
                mapped = true;
              } else if (detail.field === 'newPasswordConfirm') {
                setError('newPasswordConfirm', { type: 'server', message: detail.message });
                mapped = true;
              }
            }
            if (mapped) return;
          }
        }
        showToast('비밀번호 변경 중 오류가 발생했습니다.', 'error');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4" noValidate>
      <Input
        label="현재 비밀번호"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="새 비밀번호"
        type="password"
        autoComplete="new-password"
        helperText="영문과 숫자를 포함해 8자 이상 입력해주세요."
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="새 비밀번호 확인"
        type="password"
        autoComplete="new-password"
        error={errors.newPasswordConfirm?.message}
        {...register('newPasswordConfirm')}
      />
      <div className="flex justify-end">
        <Button type="submit" variant="primary" isLoading={changeMutation.isPending}>
          비밀번호 변경
        </Button>
      </div>
    </form>
  );
}

export default PasswordForm;
