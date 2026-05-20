// 근거: docs/04-design/api-spec.md §5-1~§5-4 (상태코드·응답·에러), backend-spec.md §8-4,
//        data-model.md §3 (@@unique([userId,name])), validation.md §3-3·§4, PRD §20-3 C-01~C-04
// 카테고리 비즈니스 로직. 모든 작업은 인증된 userId 기준(authMiddleware가 req.user 주입).
// 데이터 격리/404: 타인 소유 또는 미존재 카테고리는 CATEGORY_NOT_FOUND(404)로 통일(소유권 노출 금지).
// 중복명: @@unique([userId, name]) 위반(Prisma P2002)을 409 CATEGORY_NAME_ALREADY_EXISTS로 변환.

import type { Category } from '@prisma/client';
import { ConflictError, NotFoundError } from '../utils/errors';
import * as categoryRepository from '../repositories/category.repository';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../schemas/category.schema';

/** 클라이언트 응답용 카테고리(카멜케이스, api-spec.md §5 응답 형식). */
export interface CategoryView {
  id: number;
  userId: number;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Prisma 레코드 → 응답 뷰 매핑. */
function toCategoryView(category: Category): CategoryView {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    color: category.color,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

const DUPLICATE_NAME_MESSAGE = '이미 존재하는 카테고리 이름입니다.';

/** GET /categories — 목록 조회 (sortOrder 오름차순). */
export async function list(userId: number): Promise<CategoryView[]> {
  const rows = await categoryRepository.findManyByUser(userId);
  return rows.map(toCategoryView);
}

/**
 * POST /categories — 생성.
 * - sort_order 생략 시 현재 최대값+1 (api-spec.md §5-2). 카테고리가 없으면 1.
 * - @@unique([userId, name]) 위반 → 409 CATEGORY_NAME_ALREADY_EXISTS.
 */
export async function create(
  userId: number,
  input: CreateCategoryInput,
): Promise<CategoryView> {
  let sortOrder = input.sort_order;
  if (sortOrder === undefined) {
    const max = await categoryRepository.maxSortOrderForUser(userId);
    sortOrder = (max ?? 0) + 1;
  }

  try {
    const created = await categoryRepository.create({
      userId,
      name: input.name,
      color: input.color,
      sortOrder,
    });
    return toCategoryView(created);
  } catch (err: unknown) {
    if (categoryRepository.isUniqueConstraintError(err)) {
      throw new ConflictError(
        DUPLICATE_NAME_MESSAGE,
        'CATEGORY_NAME_ALREADY_EXISTS',
      );
    }
    throw err;
  }
}

/**
 * PUT /categories/:id — 전체 교체 수정 (name·color·sort_order 모두 필수).
 * - 없거나 타인 소유 → 404 CATEGORY_NOT_FOUND.
 * - 다른 카테고리와 동일명으로 변경 → 409 CATEGORY_NAME_ALREADY_EXISTS.
 */
export async function update(
  id: number,
  userId: number,
  input: UpdateCategoryInput,
): Promise<CategoryView> {
  const existing = await categoryRepository.findByIdForUser(id, userId);
  if (!existing) {
    throw new NotFoundError('카테고리를 찾을 수 없습니다.', 'CATEGORY_NOT_FOUND');
  }

  try {
    const updated = await categoryRepository.updateForUser(id, userId, {
      name: input.name,
      color: input.color,
      sortOrder: input.sort_order,
    });
    if (!updated) {
      // 조회 직후 동시 삭제 등 경합 상황.
      throw new NotFoundError(
        '카테고리를 찾을 수 없습니다.',
        'CATEGORY_NOT_FOUND',
      );
    }
    return toCategoryView(updated);
  } catch (err: unknown) {
    if (categoryRepository.isUniqueConstraintError(err)) {
      throw new ConflictError(
        DUPLICATE_NAME_MESSAGE,
        'CATEGORY_NAME_ALREADY_EXISTS',
      );
    }
    throw err;
  }
}

/**
 * DELETE /categories/:id — 삭제.
 * - 없거나 타인 소유 → 404 CATEGORY_NOT_FOUND.
 * - 연결 Plan.categoryId는 schema onDelete:SetNull로 NULL 처리(affectedPlans로 건수 반환).
 */
export async function remove(
  id: number,
  userId: number,
): Promise<{ affectedPlans: number }> {
  const result = await categoryRepository.deleteForUser(id, userId);
  if (!result) {
    throw new NotFoundError('카테고리를 찾을 수 없습니다.', 'CATEGORY_NOT_FOUND');
  }
  return result;
}
