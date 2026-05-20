import { describe, it, expect } from 'vitest';
import { categorySchema, HEX_COLOR_PATTERN } from '@/features/categories/schemas/category.schema';

/**
 * 카테고리 스키마 단위 테스트 — HEX 색상 + 이름/정렬 검증.
 * NOTE: 테스트 러너(vitest) 미구성 — 러너 구성 시 즉시 동작하는 명세이며 약화/스킵하지 않는다.
 */
describe('category.schema', () => {
  it('유효한 값(이름 1~30, #RRGGBB, 양의 정수)을 통과시킨다', () => {
    const result = categorySchema.safeParse({ name: '독서', color: '#8B5CF6', sortOrder: 6 });
    expect(result.success).toBe(true);
  });

  it('빈 이름을 거부한다', () => {
    const result = categorySchema.safeParse({ name: '   ', color: '#8B5CF6', sortOrder: 1 });
    expect(result.success).toBe(false);
  });

  it('30자 초과 이름을 거부한다', () => {
    const result = categorySchema.safeParse({ name: 'a'.repeat(31), color: '#8B5CF6', sortOrder: 1 });
    expect(result.success).toBe(false);
  });

  it.each(['8B5CF6', '#8B5CF', '#8B5CF6Z', '#fff', 'rgb(0,0,0)', '#12345g'])(
    '잘못된 색상 형식 %s 을 거부한다',
    (color) => {
      const result = categorySchema.safeParse({ name: '독서', color, sortOrder: 1 });
      expect(result.success).toBe(false);
    },
  );

  it.each(['#8B5CF6', '#000000', '#FFFFFF', '#abcdef'])('올바른 HEX %s 을 허용한다', (color) => {
    expect(HEX_COLOR_PATTERN.test(color)).toBe(true);
  });

  it('sortOrder 가 0 또는 음수/소수면 거부한다', () => {
    expect(categorySchema.safeParse({ name: '독서', color: '#8B5CF6', sortOrder: 0 }).success).toBe(
      false,
    );
    expect(categorySchema.safeParse({ name: '독서', color: '#8B5CF6', sortOrder: -1 }).success).toBe(
      false,
    );
    expect(
      categorySchema.safeParse({ name: '독서', color: '#8B5CF6', sortOrder: 1.5 }).success,
    ).toBe(false);
  });
});
