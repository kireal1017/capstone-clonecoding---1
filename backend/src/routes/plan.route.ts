// 근거: docs/04-design/backend-spec.md §3-2 (일정 라우터 매핑), api-spec.md §4·§7, harness.md §3 Step 4 범위
// /api/v1/plans/* 라우터. 모든 엔드포인트 authMiddleware 적용. 본문/쿼리는 validate로 검증.

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import {
  CreatePlanSchema,
  UpdatePlanSchema,
  GetPlansQuerySchema,
} from '../schemas/plan.schema';
import * as planController from '../controllers/plan.controller';

const router: Router = Router();

// 모든 일정 엔드포인트는 인증 필요.
router.use(authMiddleware);

// P-01. 목록 조회 (쿼리 필터 검증)
router.get('/', validate(GetPlansQuerySchema, 'query'), planController.list);

// P-02. 등록 (body 검증)
router.post('/', validate(CreatePlanSchema, 'body'), planController.create);

// P-03. 단건 조회
router.get('/:id', planController.get);

// P-04. 수정 (body 검증, partial)
router.patch('/:id', validate(UpdatePlanSchema, 'body'), planController.update);

// P-05. 삭제 (soft delete → 204)
router.delete('/:id', planController.remove);

// P-06. 완료 토글 (경로는 /complete로 확정 — api-spec.md §4-6 / validation.md P-06)
router.patch('/:id/complete', planController.toggleComplete);

export { router as plansRouter };
