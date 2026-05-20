import { z } from 'zod';

/**
 * 회원가입 폼 검증 스키마 (api-spec §3-1 + frontend-spec §6-2).
 * - nickname: 2~20자, 공백 불가
 * - email: RFC5322 단순화 패턴, max 254
 * - password: 영문+숫자 포함, 8~72자
 * - confirmPassword: password 와 일치 (프론트 전용 검증)
 */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasLetter = /[A-Za-z]/;
const hasDigit = /[0-9]/;
const hasWhitespace = /\s/;

export const registerSchema = z
  .object({
    nickname: z
      .string()
      .min(2, '닉네임은 2자 이상 입력해주세요.')
      .max(20, '닉네임은 20자 이하로 입력해주세요.')
      .refine((value) => !hasWhitespace.test(value), '닉네임에는 공백을 사용할 수 없습니다.'),
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.')
      .max(254, '이메일은 254자 이하로 입력해주세요.')
      .regex(emailPattern, '올바른 이메일 형식이 아닙니다.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상 입력해주세요.')
      .max(72, '비밀번호는 72자 이하로 입력해주세요.')
      .refine(
        (value) => hasLetter.test(value) && hasDigit.test(value),
        '비밀번호는 영문과 숫자를 모두 포함해야 합니다.',
      ),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
