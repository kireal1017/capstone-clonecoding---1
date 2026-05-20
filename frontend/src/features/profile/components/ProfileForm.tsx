import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { profileSchema, type ProfileFormValues } from '@/features/profile/schemas/profile.schema';
import type { ApiErrorDetail } from '@/types/api';
import type { ProfileUser } from '@/types/domain';

/**
 * 프로필(닉네임) 수정 폼 (api-spec §6-2, wireframe §6).
 * - 닉네임: 편집 가능(2~20자, 공백 불가).
 * - 이메일: 읽기 전용(disabled) + "변경할 수 없습니다" 안내(불변).
 * - 저장 성공 시 토스트 + authStore 동기화(훅 내부).
 */
interface ProfileFormProps {
  profile: ProfileUser;
}

function ProfileForm({ profile }: ProfileFormProps) {
  const { showToast } = useToast();
  const updateMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: { nickname: profile.nickname },
  });

  const onValid = (values: ProfileFormValues): void => {
    updateMutation.mutate(
      { nickname: values.nickname },
      {
        onSuccess: () => showToast('프로필을 수정했습니다.', 'success'),
        onError: (error) => {
          if (axios.isAxiosError(error)) {
            const body = error.response?.data as
              | { error?: { details?: ApiErrorDetail[] } }
              | undefined;
            const detail = body?.error?.details?.find((d) => d.field === 'nickname');
            if (error.response?.status === 422 && detail) {
              setError('nickname', { type: 'server', message: detail.message });
              return;
            }
          }
          showToast('프로필 수정 중 오류가 발생했습니다.', 'error');
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4" noValidate>
      <Input
        label="닉네임"
        type="text"
        error={errors.nickname?.message}
        {...register('nickname')}
      />
      <Input
        label="이메일"
        type="email"
        value={profile.email}
        readOnly
        disabled
        helperText="이메일은 변경할 수 없습니다."
        className="bg-surface-container-low text-outline"
      />
      <div className="flex justify-end">
        <Button type="submit" variant="primary" isLoading={updateMutation.isPending} disabled={!isDirty}>
          저장
        </Button>
      </div>
    </form>
  );
}

export default ProfileForm;
