import { z } from 'zod';

/**
 * 일정 등록/수정 폼 검증 스키마 (api-spec §4-2/§4-4 + wireframe §4).
 *
 * 폼 값은 camelCase 로 다루고, API 호출 직전에 snake_case 바디로 매핑한다
 * (createPlan/updatePlan). 빈 문자열("")은 "선택 안 함"을 의미하며 매핑 단계에서
 * null/undefined 로 변환한다.
 *
 * 교차 검증(클라이언트 1차): displayDate ≤ dueDate.
 * (서버 422 details[display_date] 매핑은 PlanForm 에서 방어적으로 추가 처리.)
 */
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const PRIORITY_VALUES = ['high', 'normal', 'low'] as const;

export const planSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '제목을 입력해주세요.')
      .max(100, '제목은 100자 이하로 입력해주세요.'),
    dueDate: z
      .string()
      .min(1, '마감 기한을 선택해주세요.')
      .regex(datePattern, '올바른 날짜 형식이 아닙니다.'),
    /** 마감 시간(선택). 빈 문자열이면 미설정. */
    dueTime: z.string(),
    displayDate: z
      .string()
      .min(1, '표시 날짜를 선택해주세요.')
      .regex(datePattern, '올바른 날짜 형식이 아닙니다.'),
    /** 카테고리 ID. null 이면 미분류. */
    categoryId: z.number().int().nullable(),
    priority: z.enum(PRIORITY_VALUES, { message: '중요도를 선택해주세요.' }),
    /** 메모(선택). 빈 문자열이면 미설정. */
    memo: z.string().max(500, '메모는 500자 이하로 입력해주세요.'),
    isRemind: z.boolean(),
  })
  .refine(
    (values) => {
      if (!datePattern.test(values.dueDate) || !datePattern.test(values.displayDate)) {
        return true; // 형식 오류는 각 필드 검증에서 처리.
      }
      return values.displayDate <= values.dueDate;
    },
    {
      message: '표시 날짜는 마감 기한 이전이어야 합니다.',
      path: ['displayDate'],
    },
  );

export type PlanFormValues = z.infer<typeof planSchema>;
