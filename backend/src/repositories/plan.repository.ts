// 근거: docs/04-design/backend-spec.md §9-2 (Soft Delete 명시 조건 — 방법 A), §8-2 (목록 필터),
//        api-spec.md §4 (일정 API), data-model.md §4, design-review.md DB-07
// plans 테이블 Prisma 데이터 접근. 비즈니스 로직 없음 — 순수 쿼리.
// 사용자별 격리: 모든 where에 userId + deletedAt: null(활성 레코드) 포함. (DB 격리 + soft delete 필터)
// 정렬(BE-03 서버 고정)은 SQLite가 priority CASE / NULLS LAST를 orderBy로 직접 표현하기 어려워
// 서비스 계층에서 수행한다. 리포지토리는 필터된 활성 레코드를 그대로 반환한다.

import type { Plan, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { nowKST } from '../utils/dateUtil';

/** category join 포함 Plan (응답 매핑에서 category 필드 사용). */
export type PlanWithCategory = Prisma.PlanGetPayload<{
  include: { category: true };
}>;

/** 목록 필터(서비스 계층이 구성). userId/deletedAt은 리포지토리에서 항상 강제. */
export interface PlanListFilter {
  month?: string | undefined;
  search?: string | undefined;
  categoryIds?: number[] | undefined;
  priorities?: Array<'high' | 'normal' | 'low'> | undefined;
  completed?: boolean | undefined;
  uncategorized?: boolean | undefined;
}

/**
 * 활성(미삭제) 일정 목록 조회. 항상 userId + deletedAt: null 조건 포함.
 * - month: displayDate가 해당 월("YYYY-MM-..") 범위에 속하는 레코드.
 * - search: title 또는 memo에 keyword 포함 (OR).
 * - categoryIds / uncategorized: 카테고리 OR 그룹 (DB-07).
 * - priorities: 중요도 OR 그룹. completed: 단일.
 * - 세 그룹 간 AND. (정렬은 서비스 계층에서 적용)
 */
export async function findManyByUser(
  userId: number,
  filter: PlanListFilter,
): Promise<PlanWithCategory[]> {
  const and: Prisma.PlanWhereInput[] = [{ userId, deletedAt: null }];

  if (filter.month) {
    // displayDate는 "YYYY-MM-DD" 문자열. 월 범위는 사전식 비교로 표현.
    and.push({
      displayDate: { gte: `${filter.month}-01`, lte: `${filter.month}-31` },
    });
  }

  if (filter.search) {
    and.push({
      OR: [
        { title: { contains: filter.search } },
        { memo: { contains: filter.search } },
      ],
    });
  }

  // 카테고리 OR 그룹: categoryIds IN [...] OR categoryId IS NULL(uncategorized).
  const categoryOr: Prisma.PlanWhereInput[] = [];
  if (filter.categoryIds && filter.categoryIds.length > 0) {
    categoryOr.push({ categoryId: { in: filter.categoryIds } });
  }
  if (filter.uncategorized) {
    categoryOr.push({ categoryId: null });
  }
  if (categoryOr.length > 0) {
    and.push({ OR: categoryOr });
  }

  if (filter.priorities && filter.priorities.length > 0) {
    and.push({ priority: { in: filter.priorities } });
  }

  if (filter.completed !== undefined) {
    and.push({ isCompleted: filter.completed });
  }

  return prisma.plan.findMany({
    where: { AND: and },
    include: { category: true },
  });
}

/** 활성 단건 조회 (소유자 한정). 없으면 null. */
export async function findByIdForUser(
  id: number,
  userId: number,
): Promise<PlanWithCategory | null> {
  return prisma.plan.findFirst({
    where: { id, userId, deletedAt: null },
    include: { category: true },
  });
}

export interface CreatePlanData {
  userId: number;
  title: string;
  dueDate: string;
  dueTime: string | null;
  displayDate: string;
  categoryId: number | null;
  priority: 'high' | 'normal' | 'low';
  memo: string | null;
  isRemind: boolean;
}

/** 일정 생성. createdAt/updatedAt은 nowKST() 명시 전달 (DB-02·DB-14). */
export async function create(
  data: CreatePlanData,
): Promise<PlanWithCategory> {
  const ts = nowKST();
  return prisma.plan.create({
    data: {
      userId: data.userId,
      title: data.title,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      displayDate: data.displayDate,
      categoryId: data.categoryId,
      priority: data.priority,
      memo: data.memo,
      isRemind: data.isRemind,
      createdAt: ts,
      updatedAt: ts,
    },
    include: { category: true },
  });
}

/** 갱신할 컬럼(Prisma 카멜케이스). 제공된 키만 반영. */
export type UpdatePlanData = Partial<{
  title: string;
  dueDate: string;
  dueTime: string | null;
  displayDate: string;
  categoryId: number | null;
  priority: 'high' | 'normal' | 'low';
  memo: string | null;
  isRemind: boolean;
}>;

/**
 * 활성 일정 부분 수정 (소유자 한정). updateMany로 where에 userId+deletedAt를 강제하고,
 * 영향 행이 0이면 없음(null)으로 간주(타인/미존재/삭제됨). updatedAt은 nowKST() 명시 전달.
 * 갱신 후 최신 레코드를 다시 조회해 반환.
 */
export async function updateForUser(
  id: number,
  userId: number,
  data: UpdatePlanData,
): Promise<PlanWithCategory | null> {
  const result = await prisma.plan.updateMany({
    where: { id, userId, deletedAt: null },
    data: { ...data, updatedAt: nowKST() },
  });
  if (result.count === 0) {
    return null;
  }
  return findByIdForUser(id, userId);
}

/**
 * Soft delete (소유자 한정): deletedAt = nowKST(). 영향 행 0이면 false.
 */
export async function softDeleteForUser(
  id: number,
  userId: number,
): Promise<boolean> {
  const ts = nowKST();
  const result = await prisma.plan.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: ts, updatedAt: ts },
  });
  return result.count > 0;
}

/**
 * 완료 상태 토글 (소유자 한정). 현재 값의 반대로 전환. updatedAt = nowKST().
 * 없으면 null. (findByIdForUser로 현재 값 조회 → updateMany로 격리 보장 갱신)
 */
export async function toggleCompleteForUser(
  id: number,
  userId: number,
): Promise<Plan | null> {
  const current = await findByIdForUser(id, userId);
  if (!current) {
    return null;
  }
  const ts = nowKST();
  await prisma.plan.updateMany({
    where: { id, userId, deletedAt: null },
    data: { isCompleted: !current.isCompleted, updatedAt: ts },
  });
  return prisma.plan.findFirst({ where: { id, userId, deletedAt: null } });
}

/** 활성 카테고리 소유 확인용 — 해당 사용자가 소유한 카테고리 ID 존재 여부. */
export async function categoryBelongsToUser(
  categoryId: number,
  userId: number,
): Promise<boolean> {
  const found = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  return found !== null;
}
