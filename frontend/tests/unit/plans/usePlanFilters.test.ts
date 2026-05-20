// 근거: api-spec.md §4-1 (GET /plans 쿼리 의미) + DB-07 필터 조합 규칙.
// 검색·필터 순수 함수(클라이언트 측 재현)의 단위 테스트.
//
// 주의: 프론트엔드 단위 테스트 러너(vitest+jsdom+@testing-library)는 아직
// 미설치 상태(Step 8 이후 후속 과제). 본 파일은 사양을 정확히 검증하는
// 테스트로 작성·보관하며, 러너 설치 후 그대로 실행 가능하도록 한다.
// (Step 12 allowed-files 가 frontend/package.json·vitest 설정을 포함하지 않으므로
//  본 Step 에서 러너를 설치하지 않는다.)

import { describe, it, expect } from 'vitest';
import {
  normalizeKeyword,
  matchesSearch,
  matchesCategoryGroup,
  matchesPriorityGroup,
  matchesCompleted,
  applyFilters,
  applySearchAndFilters,
  hasActiveFilters,
  type ActiveFilters,
} from '../../../src/features/plans/hooks/usePlanFilters';
import type { Plan, Priority } from '../../../src/types/domain';

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 1,
    userId: 1,
    title: '영상처리 과제',
    dueDate: '2026-05-25',
    dueTime: '23:59',
    displayDate: '2026-05-20',
    categoryId: 2,
    category: { id: 2, name: '과제', color: '#2563EB' },
    priority: 'high',
    memo: '5장 분량',
    isCompleted: false,
    isRemind: true,
    createdAt: '2026-05-18T09:00:00',
    updatedAt: '2026-05-18T09:00:00',
    ...overrides,
  };
}

const NO_FILTERS: ActiveFilters = {
  categoryIds: [],
  uncategorized: false,
  priorities: [],
  completed: 'all',
};

describe('normalizeKeyword', () => {
  it('trim + 소문자 정규화', () => {
    expect(normalizeKeyword('  Hello  ')).toBe('hello');
  });
  it('공백뿐이면 빈 문자열', () => {
    expect(normalizeKeyword('   ')).toBe('');
  });
});

describe('matchesSearch (title + memo substring)', () => {
  it('빈 키워드는 항상 매칭', () => {
    expect(matchesSearch(makePlan(), '')).toBe(true);
  });
  it('title 부분일치', () => {
    expect(matchesSearch(makePlan({ title: '영상처리 중간고사', memo: null }), '영상처리')).toBe(
      true,
    );
  });
  it('memo 부분일치', () => {
    expect(matchesSearch(makePlan({ title: '과제', memo: '데이터베이스 정리' }), '데이터베이스')).toBe(
      true,
    );
  });
  it('대소문자 무시', () => {
    expect(matchesSearch(makePlan({ title: 'Report', memo: null }), 'report')).toBe(true);
  });
  it('memo 가 null 이어도 안전', () => {
    expect(matchesSearch(makePlan({ title: '과제', memo: null }), '없는키워드')).toBe(false);
  });
});

describe('matchesCategoryGroup (카테고리 OR + 미분류 OR)', () => {
  it('그룹 미선택 시 통과', () => {
    expect(matchesCategoryGroup(makePlan({ categoryId: 2 }), [], false)).toBe(true);
  });
  it('카테고리 ID OR 매칭', () => {
    expect(matchesCategoryGroup(makePlan({ categoryId: 2 }), [1, 2], false)).toBe(true);
    expect(matchesCategoryGroup(makePlan({ categoryId: 3 }), [1, 2], false)).toBe(false);
  });
  it('미분류 매칭', () => {
    expect(matchesCategoryGroup(makePlan({ categoryId: null }), [], true)).toBe(true);
    expect(matchesCategoryGroup(makePlan({ categoryId: 2 }), [], true)).toBe(false);
  });
  it('미분류 + 카테고리 동시 = OR (category_id IS NULL OR category_id IN ids)', () => {
    expect(matchesCategoryGroup(makePlan({ categoryId: null }), [1], true)).toBe(true);
    expect(matchesCategoryGroup(makePlan({ categoryId: 1 }), [1], true)).toBe(true);
    expect(matchesCategoryGroup(makePlan({ categoryId: 9 }), [1], true)).toBe(false);
  });
});

describe('matchesPriorityGroup (OR)', () => {
  it('그룹 미선택 시 통과', () => {
    expect(matchesPriorityGroup(makePlan({ priority: 'low' }), [])).toBe(true);
  });
  it('OR 매칭', () => {
    const priorities: Priority[] = ['high', 'normal'];
    expect(matchesPriorityGroup(makePlan({ priority: 'high' }), priorities)).toBe(true);
    expect(matchesPriorityGroup(makePlan({ priority: 'low' }), priorities)).toBe(false);
  });
});

describe('matchesCompleted (단일)', () => {
  it("'all' 은 완료/미완료 모두 통과", () => {
    expect(matchesCompleted(makePlan({ isCompleted: true }), 'all')).toBe(true);
    expect(matchesCompleted(makePlan({ isCompleted: false }), 'all')).toBe(true);
  });
  it("'incomplete' 는 미완료만", () => {
    expect(matchesCompleted(makePlan({ isCompleted: false }), 'incomplete')).toBe(true);
    expect(matchesCompleted(makePlan({ isCompleted: true }), 'incomplete')).toBe(false);
  });
});

describe('applyFilters (세 그룹 간 AND)', () => {
  const plans: Plan[] = [
    makePlan({ id: 1, categoryId: 1, priority: 'high', isCompleted: false }),
    makePlan({ id: 2, categoryId: 2, priority: 'normal', isCompleted: false }),
    makePlan({ id: 3, categoryId: null, priority: 'low', isCompleted: true }),
    makePlan({ id: 4, categoryId: 1, priority: 'low', isCompleted: true }),
  ];

  it('필터 없으면 원본 그대로', () => {
    expect(applyFilters(plans, NO_FILTERS)).toHaveLength(4);
  });

  it('카테고리 OR 그룹과 중요도 OR 그룹은 AND', () => {
    const result = applyFilters(plans, {
      categoryIds: [1],
      uncategorized: false,
      priorities: ['high'],
      completed: 'all',
    });
    expect(result.map((p) => p.id)).toEqual([1]);
  });

  it("완료 여부 'incomplete' 가 AND 로 결합", () => {
    const result = applyFilters(plans, {
      categoryIds: [1],
      uncategorized: false,
      priorities: [],
      completed: 'incomplete',
    });
    // categoryId=1 이면서 미완료 → id 1 만(id 4 는 완료라 제외)
    expect(result.map((p) => p.id)).toEqual([1]);
  });

  it('미분류 + 카테고리 OR', () => {
    const result = applyFilters(plans, {
      categoryIds: [2],
      uncategorized: true,
      priorities: [],
      completed: 'all',
    });
    expect(result.map((p) => p.id).sort()).toEqual([2, 3]);
  });
});

describe('applySearchAndFilters (검색 + 필터, 전체 기간)', () => {
  const plans: Plan[] = [
    makePlan({ id: 1, title: '영상처리 과제', categoryId: 1, priority: 'high' }),
    makePlan({ id: 2, title: '영상처리 중간고사', categoryId: 2, priority: 'high' }),
    makePlan({ id: 3, title: '데이터베이스 복습', memo: null, categoryId: 2, priority: 'low' }),
  ];

  it('검색만 적용', () => {
    const result = applySearchAndFilters(plans, '영상처리', NO_FILTERS);
    expect(result.map((p) => p.id).sort()).toEqual([1, 2]);
  });

  it('검색 + 필터 AND 결합', () => {
    const result = applySearchAndFilters(plans, '영상처리', {
      categoryIds: [1],
      uncategorized: false,
      priorities: [],
      completed: 'all',
    });
    expect(result.map((p) => p.id)).toEqual([1]);
  });

  it('빈 검색어는 필터 결과 전체', () => {
    const result = applySearchAndFilters(plans, '   ', NO_FILTERS);
    expect(result).toHaveLength(3);
  });
});

describe('hasActiveFilters', () => {
  it('전부 비어 있으면 false', () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
  });
  it('하나라도 선택되면 true', () => {
    expect(hasActiveFilters({ ...NO_FILTERS, categoryIds: [1] })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, uncategorized: true })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, priorities: ['high'] })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, completed: 'incomplete' })).toBe(true);
  });
});
