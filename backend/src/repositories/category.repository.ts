// 근거: docs/04-design/api-spec.md §5 (카테고리 API), data-model.md §3 (Category 필드·@@unique([userId,name])),
//        backend-spec.md §8-4, design-review.md DB-03 (중복명 금지)·DB-01 (PRAGMA FK ON)
// categories 테이블 Prisma 데이터 접근. 비즈니스 로직 없음 — 순수 쿼리.
// 사용자별 격리: 모든 where에 userId 포함. 단건 조회/수정/삭제는 { id, userId }로 한정해
// 타인 소유 카테고리가 절대 매칭되지 않도록 한다(서비스에서 미존재와 동일하게 404 처리).

import type { Category, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { nowKST } from '../utils/dateUtil';

/** Prisma의 고유 제약 위반(P2002) 식별. @@unique([userId, name]) 위반 시 발생. */
export function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  );
}

/** 소유자 카테고리 목록 (sortOrder 오름차순, 동률 시 id 오름차순으로 안정화). */
export async function findManyByUser(userId: number): Promise<Category[]> {
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
}

/** 소유자 단건 조회. 없거나 타인 소유면 null. */
export async function findByIdForUser(
  id: number,
  userId: number,
): Promise<Category | null> {
  return prisma.category.findFirst({ where: { id, userId } });
}

/** 소유자의 현재 최대 sortOrder. 카테고리가 없으면 null. */
export async function maxSortOrderForUser(
  userId: number,
): Promise<number | null> {
  const result = await prisma.category.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  return result._max.sortOrder;
}

export interface CreateCategoryData {
  userId: number;
  name: string;
  color: string;
  sortOrder: number;
}

/**
 * 카테고리 생성. createdAt/updatedAt은 nowKST() 명시 전달 (DB-02·DB-14).
 * @@unique([userId, name]) 위반 시 Prisma P2002를 throw — 서비스가 409로 변환.
 */
export async function create(data: CreateCategoryData): Promise<Category> {
  const ts = nowKST();
  return prisma.category.create({
    data: {
      userId: data.userId,
      name: data.name,
      color: data.color,
      sortOrder: data.sortOrder,
      createdAt: ts,
      updatedAt: ts,
    },
  });
}

export interface UpdateCategoryData {
  name: string;
  color: string;
  sortOrder: number;
}

/**
 * 소유자 카테고리 전체 교체 수정. where에 userId 강제(updateMany)로 타인 행 미매칭.
 * 영향 행 0이면 null(미존재/타인). updatedAt은 nowKST() 명시 전달.
 * @@unique([userId, name]) 위반 시 Prisma P2002를 throw — 서비스가 409로 변환.
 */
export async function updateForUser(
  id: number,
  userId: number,
  data: UpdateCategoryData,
): Promise<Category | null> {
  const result = await prisma.category.updateMany({
    where: { id, userId },
    data: {
      name: data.name,
      color: data.color,
      sortOrder: data.sortOrder,
      updatedAt: nowKST(),
    },
  });
  if (result.count === 0) {
    return null;
  }
  return findByIdForUser(id, userId);
}

/**
 * 소유자 카테고리 삭제. 연결된 Plan.categoryId는 schema의 onDelete:SetNull로 NULL 처리됨
 * (PRAGMA foreign_keys = ON은 config/prisma.ts에서 활성화).
 * 삭제 직전 참조 일정 수를 집계해 affectedPlans로 반환(api-spec.md §5-4).
 * 없거나 타인 소유면 null 반환.
 */
export async function deleteForUser(
  id: number,
  userId: number,
): Promise<{ affectedPlans: number } | null> {
  // 격리: 소유자 카테고리만 삭제. deleteMany로 where에 userId를 강제한다.
  // 미삭제(deletedAt=null) 여부와 무관하게 모든 참조 일정의 categoryId가 NULL 처리되므로
  // 영향 일정 수는 categoryId = id 조건의 전체 건수로 집계한다.
  const affectedPlans = await prisma.plan.count({ where: { categoryId: id } });
  const deleteWhere: Prisma.CategoryWhereInput = { id, userId };
  const result = await prisma.category.deleteMany({ where: deleteWhere });
  if (result.count === 0) {
    return null;
  }
  return { affectedPlans };
}
