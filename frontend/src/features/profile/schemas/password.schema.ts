import { z } from 'zod';

/**
 * 비밀번호 변경 폼 검증 스키마 (api-spec §6-3).
 * - currentPassword: 필수
 * - newPassword: 영문+숫자 포함 8~72자
 * - newPasswordConfirm: newPassword 와 일치(프론트 전용 교차 검증)
 */
const hasLetter = /[A-Za-z]/;
const hasDigit = /[0-9]/;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword: z
      .string()
      .min(8, '새 비밀번호는 8자 이상 입력해주세요.')
      .max(72, '새 비밀번호는 72자 이하로 입력해주세요.')
      .refine(
        (value) => hasLetter.test(value) && hasDigit.test(value),
        '새 비밀번호는 영문과 숫자를 모두 포함해야 합니다.',
      ),
    newPasswordConfirm: z.string().min(1, '새 비밀번호 확인을 입력해주세요.'),
  })
  .refine((values) => values.newPassword === values.newPasswordConfirm, {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['newPasswordConfirm'],
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;
