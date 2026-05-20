// 근거: docs/04-design/api-spec.md §4-1~§4-6 (상태코드·응답 형식), backend-spec.md §3-2 (라우터 매핑),
//        harness.md §3 Step 4 범위
// 얇은 컨트롤러: req.user(authMiddleware 주입) + 파싱된 입력 → service 호출 → successResponse() 응답.
// 상태코드: 목록/단건/수정/토글 200, 생성 201, 삭제 204.

import type { Request, Response } from 'express';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { successResponse } from '../types/api';
import * as planService from '../services/plan.service';
import type {
  CreatePlanInput,
  UpdatePlanInput,
  GetPlansQuery,
} from '../schemas/plan.schema';

/** 인증 사용자 ID 추출 (authMiddleware가 보장하나 타입 안전을 위해 방어). */
function requireUserId(req: Request): number {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.userId;
}

/** 경로 파라미터 :id를 양의 정수로 파싱. 형식 오류는 미존재로 간주(404 PLAN_NOT_FOUND). */
function parsePlanId(req: Request): number {
  const raw = req.params.id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new NotFoundError('일정을 찾을 수 없습니다.', 'PLAN_NOT_FOUND');
  }
  return id;
}

/** GET /api/v1/plans — 목록 조회 (200). */
export async function list(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  // validate(GetPlansQuerySchema, 'query')가 req.query를 파싱·재할당함.
  const result = await planService.list(userId, req.query as unknown as GetPlansQuery);
  res.status(200).json(successResponse(result));
}

/** POST /api/v1/plans — 생성 (201). */
export async function create(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const plan = await planService.create(userId, req.body as CreatePlanInput);
  res.status(201).json(successResponse({ plan }));
}

/** GET /api/v1/plans/:id — 단건 조회 (200). */
export async function get(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const id = parsePlanId(req);
  const plan = await planService.get(id, userId);
  res.status(200).json(successResponse({ plan }));
}

/** PATCH /api/v1/plans/:id — 수정 (200). */
export async function update(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const id = parsePlanId(req);
  const plan = await planService.update(id, userId, req.body as UpdatePlanInput);
  res.status(200).json(successResponse({ plan }));
}

/** DELETE /api/v1/plans/:id — soft delete (204, 본문 없음). */
export async function remove(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const id = parsePlanId(req);
  await planService.remove(id, userId);
  res.status(204).send();
}

/** PATCH /api/v1/plans/:id/complete — 완료 토글 (200). */
export async function toggleComplete(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const id = parsePlanId(req);
  const plan = await planService.toggleComplete(id, userId);
  res.status(200).json(successResponse({ plan }));
}
