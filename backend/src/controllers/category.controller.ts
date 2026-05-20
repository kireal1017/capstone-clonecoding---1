// 근거: docs/04-design/api-spec.md §5-1~§5-4 (상태코드·응답 형식), backend-spec.md §8-4
// 얇은 컨트롤러: req.user(authMiddleware 주입) + 파싱된 입력 → service 호출 → successResponse() 응답.
// 상태코드: 목록/수정/삭제 200, 생성 201. 삭제 응답은 api-spec §5-4 — { message, affectedPlans }.

import type { Request, Response } from 'express';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { successResponse } from '../types/api';
import * as categoryService from '../services/category.service';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../schemas/category.schema';

/** 인증 사용자 ID 추출 (authMiddleware가 보장하나 타입 안전을 위해 방어). */
function requireUserId(req: Request): number {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.userId;
}

/** 경로 파라미터 :id를 양의 정수로 파싱. 형식 오류는 미존재로 간주(404 CATEGORY_NOT_FOUND). */
function parseCategoryId(req: Request): number {
  const raw = req.params.id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new NotFoundError('카테고리를 찾을 수 없습니다.', 'CATEGORY_NOT_FOUND');
  }
  return id;
}

/** GET /api/v1/categories — 목록 조회 (200). */
export async function list(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const categories = await categoryService.list(userId);
  res.status(200).json(successResponse({ categories }));
}

/** POST /api/v1/categories — 생성 (201). */
export async function create(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const category = await categoryService.create(
    userId,
    req.body as CreateCategoryInput,
  );
  res.status(201).json(successResponse({ category }));
}

/** PUT /api/v1/categories/:id — 전체 교체 수정 (200). */
export async function update(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const id = parseCategoryId(req);
  const category = await categoryService.update(
    id,
    userId,
    req.body as UpdateCategoryInput,
  );
  res.status(200).json(successResponse({ category }));
}

/** DELETE /api/v1/categories/:id — 삭제 (200, api-spec §5-4: message + affectedPlans). */
export async function remove(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const id = parseCategoryId(req);
  const { affectedPlans } = await categoryService.remove(id, userId);
  res
    .status(200)
    .json(successResponse({ message: '삭제 완료', affectedPlans }));
}
