import { z } from 'zod';

/**
 * 프로필(닉네임) 수정 폼 검증 스키마 (api-spec §6-2).
 * - nickname: 2~20자, 공백 불가. (email 은 불변 — 폼에서 읽기 전용으로만 노출.)
 */
const hasWhitespace = /\s/;

export const profileSchema = z.object({
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상 입력해주세요.')
    .max(20, '닉네임은 20자 이하로 입력해주세요.')
    .refine((value) => !hasWhitespace.test(value), '닉네임에는 공백을 사용할 수 없습니다.'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
