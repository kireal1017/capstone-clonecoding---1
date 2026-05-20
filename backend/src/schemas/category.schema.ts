// 근거: docs/04-design/api-spec.md §5-2·§5-3 (요청 본문), data-model.md §3 (Category 필드·제약),
//        validation.md §3-3 (PUT 전체 교체 의미), backend-spec.md §8-4, PRD §20-3 C-01~C-04
// 카테고리 API Zod 스키마. validate(schema, target) 미들웨어와 함께 사용.
// 요청 본문은 api-spec 요청 표 기준 snake_case(sort_order)를 받고,
// 서비스 계층에서 Prisma 카멜케이스 필드(sortOrder)로 매핑한다.

import { z } from 'zod';

// HEX 색상 형식 (#RRGGBB). api-spec.md §5-2·§5-3: color는 HEX 형식 필수.
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const nameField = z
  .string()
  .min(1, '카테고리 이름을 입력하세요.')
  .max(30, '카테고리 이름은 30자 이하여야 합니다.');

const colorField = z
  .string()
  .regex(HEX_COLOR_REGEX, '색상은 #RRGGBB 형식이어야 합니다.');

/**
 * POST /api/v1/categories 요청 본문 스키마 (api-spec.md §5-2).
 * - name 필수 1~30자, color 필수 HEX(#RRGGBB).
 * - sort_order 선택(정수). 생략 시 서비스 계층에서 현재 최대값+1로 결정.
 */
export const CreateCategorySchema = z.object({
  name: nameField,
  color: colorField,
  sort_order: z
    .number()
    .int('정렬 순서는 정수여야 합니다.')
    .min(0, '정렬 순서는 0 이상이어야 합니다.')
    .optional(),
});

/**
 * PUT /api/v1/categories/:id 요청 본문 스키마 (api-spec.md §5-3, validation.md §3-3).
 * - FE-01: PUT은 전체 교체 — name·color·sort_order 모두 필수.
 * - 부분 업데이트(PATCH) 아님. 필드 생략 시 422 VALIDATION_FAILED.
 */
export const UpdateCategorySchema = z.object({
  name: nameField,
  color: colorField,
  sort_order: z
    .number()
    .int('정렬 순서는 정수여야 합니다.')
    .min(0, '정렬 순서는 0 이상이어야 합니다.'),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
