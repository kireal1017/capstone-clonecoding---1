// 근거: docs/04-design/api-spec.md §3-1·§3-2 (register/login 요청 본문), backend-spec.md §6 (비밀번호 정책),
//        validation.md §7-4 (비밀번호 정책), PRD §12-1·§12-2
// 회원가입/로그인 요청 본문 Zod 스키마. validate(schema, 'body') 미들웨어와 함께 사용.

import { z } from 'zod';

// RFC 5322 단순화 이메일 패턴 (api-spec.md §3-1). max 254자.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 비밀번호: 영문(대소문자 무관) + 숫자 각각 1자 이상 포함, 8~72자 (bcrypt 72바이트 한계).
const PASSWORD_HAS_LETTER = /[A-Za-z]/;
const PASSWORD_HAS_DIGIT = /[0-9]/;

/** POST /api/v1/auth/register 요청 본문 스키마. */
export const RegisterSchema = z.object({
  email: z
    .string()
    .max(254, '이메일은 254자 이하여야 합니다.')
    .regex(EMAIL_REGEX, '이메일 형식이 올바르지 않습니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(72, '비밀번호는 72자 이하여야 합니다.')
    .regex(PASSWORD_HAS_LETTER, '비밀번호는 영문을 포함해야 합니다.')
    .regex(PASSWORD_HAS_DIGIT, '비밀번호는 숫자를 포함해야 합니다.'),
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하여야 합니다.')
    .refine((v) => !/\s/.test(v), '닉네임에 공백을 포함할 수 없습니다.'),
});

/** POST /api/v1/auth/login 요청 본문 스키마. */
export const LoginSchema = z.object({
  email: z
    .string()
    .max(254, '이메일은 254자 이하여야 합니다.')
    .regex(EMAIL_REGEX, '이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
