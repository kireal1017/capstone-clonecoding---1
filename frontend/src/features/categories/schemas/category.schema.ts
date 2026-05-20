import { z } from 'zod';

/**
 * 카테고리 생성/수정 폼 검증 스키마 (api-spec §5-2/§5-3).
 *
 * - name: 1~30자(trim 후 1자 이상)
 * - color: HEX `#RRGGBB` (대소문자 허용)
 * - sortOrder: 양의 정수
 *
 * PUT(수정)은 전체 교체이므로 name·color·sortOrder 모두 필수.
 * POST(생성)도 동일 폼을 쓰되 sortOrder 는 호출부에서 생략 가능(서버가 max+1 부여).
 */
export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '카테고리명을 입력해주세요.')
    .max(30, '카테고리명은 30자 이하로 입력해주세요.'),
  color: z.string().regex(HEX_COLOR_PATTERN, '색상은 #RRGGBB 형식이어야 합니다.'),
  sortOrder: z
    .number({ message: '정렬 순서를 입력해주세요.' })
    .int('정렬 순서는 정수여야 합니다.')
    .positive('정렬 순서는 양의 정수여야 합니다.'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
