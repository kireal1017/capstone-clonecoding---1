// 근거: docs/04-design/api-spec.md §6-2·§6-3 (프로필 수정/비밀번호 변경 요청 본문),
//        validation.md §3-4 (PR-02·PR-03 검증), backend-spec.md §6 (비밀번호 정책), PRD §20-4
// 프로필 API Zod 스키마. validate(schema, 'body') 미들웨어와 함께 사용.
// 아바타 업로드(PR-04)는 multipart라 본문 Zod 검증 대상이 아님 — 파일 검증은 middlewares/upload.ts에서 수행.

import { z } from 'zod';

// 비밀번호: 영문(대소문자 무관) + 숫자 각각 1자 이상 포함, 8~72자 (bcrypt 72바이트 한계).
// auth.schema.ts의 register 정책과 동일(SSoT는 아니나 동일 규칙 유지).
const PASSWORD_HAS_LETTER = /[A-Za-z]/;
const PASSWORD_HAS_DIGIT = /[0-9]/;

/**
 * PATCH /api/v1/profile 요청 본문 스키마 (api-spec.md §6-2).
 * - nickname만 수정 가능(email 변경 불가). 2~20자, 공백 불가.
 * - api-spec 표상 nickname은 "선택"이나, 수정 요청은 nickname 변경이 목적이므로 필수로 둔다.
 *   (닉네임 없는 PATCH는 변경할 내용이 없어 422로 거른다 — validation.md §3-4 닉네임 형식 검증.)
 */
export const UpdateProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하여야 합니다.')
    .refine((v) => !/\s/.test(v), '닉네임에 공백을 포함할 수 없습니다.'),
});

/**
 * PATCH /api/v1/profile/password 요청 본문 스키마 (api-spec.md §6-3).
 * - currentPassword: 현재 비밀번호(비어있지 않음). 실제 일치 검증은 서비스 계층에서 verifyPassword로 수행.
 * - newPassword: 영문+숫자 포함 8~72자.
 * - newPasswordConfirm: newPassword와 동일해야 함(불일치 시 422).
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요.'),
    newPassword: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .max(72, '비밀번호는 72자 이하여야 합니다.')
      .regex(PASSWORD_HAS_LETTER, '비밀번호는 영문을 포함해야 합니다.')
      .regex(PASSWORD_HAS_DIGIT, '비밀번호는 숫자를 포함해야 합니다.'),
    newPasswordConfirm: z.string().min(1, '새 비밀번호 확인을 입력하세요.'),
  })
  .refine((v) => v.newPassword === v.newPasswordConfirm, {
    message: '새 비밀번호 확인이 일치하지 않습니다.',
    path: ['newPasswordConfirm'],
  });

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
