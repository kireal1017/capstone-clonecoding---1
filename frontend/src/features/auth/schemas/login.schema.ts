import { z } from 'zod';

/**
 * 로그인 폼 검증 스키마 (api-spec §3-2).
 * - email: 이메일 형식
 * - password: 비어있지 않음 (실제 정책은 서버 401로 판정)
 */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .max(254, '이메일은 254자 이하로 입력해주세요.')
    .regex(emailPattern, '올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
