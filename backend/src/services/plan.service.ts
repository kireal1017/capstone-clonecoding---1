// 근거: docs/04-design/backend-spec.md §8-2 (BE-03 서버 고정 정렬), §8-3 (toggleComplete), api-spec.md §4-1~§4-6,
//        validation.md §8-1·§8-4 (입력·display_date 교차검증), PRD §20-2 P-01~P-06
// 일정 비즈니스 로직. 모든 작업은 인증된 userId 기준(authMiddleware가 req.user 주입).
// 데이터 격리/404: 타인 소유 또는 미존재 일정은 PLAN_NOT_FOUND(404)로 통일(소유권 노출 금지).

import { NotFoundError, ValidationError } from '../utils/errors';
import * as planRepository from '../repositories/plan.repository';
import type {
  PlanWithCategory,
  PlanListFilter,
} from '../repositories/plan.repository';
import type {
  CreatePlanInput,
  UpdatePlanInput,
  GetPlansQuery,
} from '../schemas/plan.schema';

/** 클라이언트 응답용 카테고리 요약 (api-spec.md §4: { id, name, color }). */
interface PlanCategoryView {
  id: number;
  name: string;
  color: string;
}

/** 클라이언트 응답용 일정(카멜케이스, api-spec.md §4 응답 형식). */
export interface PlanView {
  id: number;
  userId: number;
  title: string;
  dueDate: string;
  dueTime: string | null;
  displayDate: string;
  categoryId: number | null;
  category: PlanCategoryView | null;
  priority: string;
  memo: string | null;
  isCompleted: boolean;
  isRemind: boolean;
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_RANK: Record<string, number> = { high: 0, normal: 1, low: 2 };

/** Prisma 레코드(category join 포함) → 응답 뷰 매핑. */
function toPlanView(plan: PlanWithCategory): PlanView {
  return {
    id: plan.id,
    userId: plan.userId,
    title: plan.title,
    dueDate: plan.dueDate,
    dueTime: plan.dueTime,
    displayDate: plan.displayDate,
    categoryId: plan.categoryId,
    category: plan.category
      ? { id: plan.category.id, name: plan.category.name, color: plan.category.color }
      : null,
    priority: plan.priority,
    memo: plan.memo,
    isCompleted: plan.isCompleted,
    isRemind: plan.isRemind,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

/**
 * BE-03 서버 고정 정렬 (api-spec.md §4-1):
 *   1. isCompleted ASC (미완료 우선)
 *   2. priority CASE high=0, normal=1, low=2 ASC
 *   3. dueTime ASC NULLS LAST (null은 후순위)
 *   4. createdAt ASC (등록 순서)
 * SQLite/Prisma orderBy로 CASE·NULLS LAST를 직접 표현하기 어려워 애플리케이션에서 정렬한다.
 */
function sortPlans(plans: PlanWithCategory[]): PlanWithCategory[] {
  return [...plans].sort((a, b) => {
    // 1) 미완료 우선 (false < true)
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    // 2) 중요도 (알 수 없는 값은 최하위)
    const ra = PRIORITY_RANK[a.priority] ?? 99;
    const rb = PRIORITY_RANK[b.priority] ?? 99;
    if (ra !== rb) {
      return ra - rb;
    }
    // 3) dueTime ASC, null은 후순위
    if (a.dueTime !== b.dueTime) {
      if (a.dueTime === null) return 1;
      if (b.dueTime === null) return -1;
      return a.dueTime < b.dueTime ? -1 : 1;
    }
    // 4) createdAt ASC (등록 순서)
    if (a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? -1 : 1;
    }
    // 동률이면 id 오름차순으로 안정화.
    return a.id - b.id;
  });
}

/** GET /plans — 목록 조회 (서버 고정 정렬 적용). */
export async function list(
  userId: number,
  query: GetPlansQuery,
): Promise<{ plans: PlanView[]; total: number }> {
  const filter: PlanListFilter = {
    month: query.month,
    search: query.search,
    categoryIds: query.category,
    priorities: query.priority,
    completed:
      query.completed === undefined ? undefined : query.completed === '1',
    uncategorized: query.uncategorized === '1',
  };
  const rows = await planRepository.findManyByUser(userId, filter);
  const sorted = sortPlans(rows);
  return { plans: sorted.map(toPlanView), total: sorted.length };
}

/** GET /plans/:id — 단건 조회. 없거나 타인 소유 → 404 PLAN_NOT_FOUND. */
export async function get(id: number, userId: number): Promise<PlanView> {
  const plan = await planRepository.findByIdForUser(id, userId);
  if (!plan) {
    throw new NotFoundError('일정을 찾을 수 없습니다.', 'PLAN_NOT_FOUND');
  }
  return toPlanView(plan);
}

/**
 * POST /plans — 생성.
 * - category_id가 지정된 경우 요청자 소유 카테고리인지 확인 → 아니면 404 CATEGORY_NOT_FOUND.
 * - is_remind 기본값 false, due_time/memo 미지정 시 null.
 */
export async function create(
  userId: number,
  input: CreatePlanInput,
): Promise<PlanView> {
  const categoryId = input.category_id ?? null;
  if (categoryId !== null) {
    const owned = await planRepository.categoryBelongsToUser(categoryId, userId);
    if (!owned) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.', 'CATEGORY_NOT_FOUND');
    }
  }
  const created = await planRepository.create({
    userId,
    title: input.title,
    dueDate: input.due_date,
    dueTime: input.due_time ?? null,
    displayDate: input.display_date,
    categoryId,
    priority: input.priority,
    memo: input.memo ?? null,
    isRemind: input.is_remind ?? false,
  });
  return toPlanView(created);
}

/**
 * PATCH /plans/:id — 부분 수정.
 * - 없거나 타인 소유 → 404 PLAN_NOT_FOUND.
 * - category_id가 양의 정수로 제공되면 소유 카테고리 확인 → 아니면 404 CATEGORY_NOT_FOUND.
 * - display_date/due_date 한쪽만 제공된 경우 기존 값과 비교해 display_date ≤ due_date 보장(위반 시 422).
 */
export async function update(
  id: number,
  userId: number,
  input: UpdatePlanInput,
): Promise<PlanView> {
  const existing = await planRepository.findByIdForUser(id, userId);
  if (!existing) {
    throw new NotFoundError('일정을 찾을 수 없습니다.', 'PLAN_NOT_FOUND');
  }

  // 카테고리 변경 시 소유권 확인 (null은 미분류 전환이므로 검사 제외).
  if (input.category_id !== undefined && input.category_id !== null) {
    const owned = await planRepository.categoryBelongsToUser(
      input.category_id,
      userId,
    );
    if (!owned) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다.', 'CATEGORY_NOT_FOUND');
    }
  }

  // 교차검증: 최종 적용될 display_date/due_date로 display_date ≤ due_date 보장.
  const effectiveDueDate = input.due_date ?? existing.dueDate;
  const effectiveDisplayDate = input.display_date ?? existing.displayDate;
  if (effectiveDisplayDate > effectiveDueDate) {
    throw new ValidationError([
      {
        field: 'display_date',
        message: '처리 예정일은 마감일 이후로 설정할 수 없습니다.',
      },
    ]);
  }

  const data: planRepository.UpdatePlanData = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.due_date !== undefined) data.dueDate = input.due_date;
  if (input.due_time !== undefined) data.dueTime = input.due_time;
  if (input.display_date !== undefined) data.displayDate = input.display_date;
  if (input.category_id !== undefined) data.categoryId = input.category_id;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.memo !== undefined) data.memo = input.memo;
  if (input.is_remind !== undefined) data.isRemind = input.is_remind;

  const updated = await planRepository.updateForUser(id, userId, data);
  if (!updated) {
    // 조회 직후 동시 삭제 등 경합 상황.
    throw new NotFoundError('일정을 찾을 수 없습니다.', 'PLAN_NOT_FOUND');
  }
  return toPlanView(updated);
}

/** DELETE /plans/:id — soft delete. 없거나 타인 소유 → 404 PLAN_NOT_FOUND. */
export async function remove(id: number, userId: number): Promise<void> {
  const ok = await planRepository.softDeleteForUser(id, userId);
  if (!ok) {
    throw new NotFoundError('일정을 찾을 수 없습니다.', 'PLAN_NOT_FOUND');
  }
}

/** PATCH /plans/:id/complete — 완료 토글. 없거나 타인 소유 → 404 PLAN_NOT_FOUND. */
export async function toggleComplete(
  id: number,
  userId: number,
): Promise<{ id: number; isCompleted: boolean; updatedAt: string }> {
  const toggled = await planRepository.toggleCompleteForUser(id, userId);
  if (!toggled) {
    throw new NotFoundError('일정을 찾을 수 없습니다.', 'PLAN_NOT_FOUND');
  }
  return {
    id: toggled.id,
    isCompleted: toggled.isCompleted,
    updatedAt: toggled.updatedAt,
  };
}
