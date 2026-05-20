// 근거: docs/04-design/api-spec.md §4-1~§4-6 (요청 본문·쿼리 필터), backend-spec.md §8-2 (BE-04 GetPlansQuerySchema),
//        validation.md §8-1·§8-4 (입력 검증·display_date 교차검증), PRD §20-2 P-01~P-06
// 일정 API Zod 스키마. validate(schema, target) 미들웨어와 함께 사용.
// 요청 본문 필드는 api-spec 요청 표 기준 snake_case(due_date/display_date/category_id/is_remind)를 받고,
// 서비스 계층에서 Prisma 카멜케이스 필드(dueDate/displayDate/categoryId/isRemind)로 매핑한다.

import { z } from 'zod';

// 날짜/시간 형식 (api-spec.md §0: 날짜 YYYY-MM-DD, 시간 HH:mm).
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const PRIORITY_VALUES = ['high', 'normal', 'low'] as const;

/**
 * POST /api/v1/plans 요청 본문 스키마 (api-spec.md §4-2).
 * - title 필수 1~100자, due_date·display_date 필수(YYYY-MM-DD), priority 필수 enum.
 * - due_time 선택(HH:mm 또는 null), category_id 선택(양의 정수), memo 선택(0~500자), is_remind 선택(기본 false).
 * - 교차검증: display_date ≤ due_date (위반 시 422 + details[display_date]). (validation.md §8-4)
 */
export const CreatePlanSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목을 입력하세요.')
      .max(100, '제목은 100자 이하여야 합니다.'),
    due_date: z.string().regex(DATE_REGEX, '마감일은 YYYY-MM-DD 형식이어야 합니다.'),
    due_time: z
      .string()
      .regex(TIME_REGEX, '마감 시간은 HH:mm 형식이어야 합니다.')
      .nullable()
      .optional(),
    display_date: z
      .string()
      .regex(DATE_REGEX, '처리 예정일은 YYYY-MM-DD 형식이어야 합니다.'),
    category_id: z
      .number()
      .int('카테고리 ID는 정수여야 합니다.')
      .positive('카테고리 ID는 양의 정수여야 합니다.')
      .nullable()
      .optional(),
    priority: z.enum(PRIORITY_VALUES, {
      errorMap: () => ({ message: '중요도는 high, normal, low 중 하나여야 합니다.' }),
    }),
    memo: z
      .string()
      .max(500, '메모는 500자 이하여야 합니다.')
      .nullable()
      .optional(),
    is_remind: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // display_date > due_date 금지 (validation.md §8-4). 문자열 YYYY-MM-DD는 사전식 비교가 날짜 비교와 일치.
    if (data.display_date > data.due_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['display_date'],
        message: '처리 예정일은 마감일 이후로 설정할 수 없습니다.',
      });
    }
  });

/**
 * PATCH /api/v1/plans/:id 요청 본문 스키마 (api-spec.md §4-4, Partial Update).
 * - 모든 필드 선택. 제공된 필드만 갱신. category_id는 null 허용(미분류 전환).
 * - 교차검증: due_date·display_date가 함께 제공된 경우에만 display_date ≤ due_date 검사.
 *   (한쪽만 제공 시 기존 값과의 비교는 서비스 계층에서 수행.)
 */
export const UpdatePlanSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목을 입력하세요.')
      .max(100, '제목은 100자 이하여야 합니다.')
      .optional(),
    due_date: z
      .string()
      .regex(DATE_REGEX, '마감일은 YYYY-MM-DD 형식이어야 합니다.')
      .optional(),
    due_time: z
      .string()
      .regex(TIME_REGEX, '마감 시간은 HH:mm 형식이어야 합니다.')
      .nullable()
      .optional(),
    display_date: z
      .string()
      .regex(DATE_REGEX, '처리 예정일은 YYYY-MM-DD 형식이어야 합니다.')
      .optional(),
    category_id: z
      .number()
      .int('카테고리 ID는 정수여야 합니다.')
      .positive('카테고리 ID는 양의 정수여야 합니다.')
      .nullable()
      .optional(),
    priority: z
      .enum(PRIORITY_VALUES, {
        errorMap: () => ({ message: '중요도는 high, normal, low 중 하나여야 합니다.' }),
      })
      .optional(),
    memo: z
      .string()
      .max(500, '메모는 500자 이하여야 합니다.')
      .nullable()
      .optional(),
    is_remind: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // 둘 다 제공된 경우에만 교차검증 (한쪽만 제공 시 서비스 계층에서 기존 값과 비교).
    if (
      data.display_date !== undefined &&
      data.due_date !== undefined &&
      data.display_date > data.due_date
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['display_date'],
        message: '처리 예정일은 마감일 이후로 설정할 수 없습니다.',
      });
    }
  });

/**
 * GET /api/v1/plans 쿼리 파라미터 스키마 (api-spec.md §4-1, backend-spec.md §8-2 BE-04).
 * - category/priority: 단일값("?category=1")과 다중값("?category=1&category=2") 모두 배열로 정규화 (OR 필터).
 * - completed: '0'|'1' 단일. uncategorized: '1'일 때만 true.
 */
export const GetPlansQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month는 YYYY-MM 형식이어야 합니다.')
    .optional(),
  search: z.string().max(100, '검색어는 100자 이하여야 합니다.').optional(),
  category: z.preprocess(
    (v) => (Array.isArray(v) ? v : v === undefined ? undefined : [v]),
    z.array(z.coerce.number().int().positive()).optional(),
  ),
  priority: z.preprocess(
    (v) => (Array.isArray(v) ? v : v === undefined ? undefined : [v]),
    z.array(z.enum(PRIORITY_VALUES)).optional(),
  ),
  completed: z.enum(['0', '1']).optional(),
  uncategorized: z.enum(['1']).optional(),
});

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;
export type GetPlansQuery = z.infer<typeof GetPlansQuerySchema>;
