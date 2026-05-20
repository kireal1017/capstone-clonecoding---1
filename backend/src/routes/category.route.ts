// 근거: docs/04-design/api-spec.md §5·§7 (C-01~C-04), backend-spec.md §8-4, harness.md Step 5 범위
// /api/v1/categories/* 라우터. 모든 엔드포인트 authMiddleware 적용. 본문은 validate로 검증.
// 수정은 PUT(전체 교체) — 일정 수정(PATCH)과 메서드가 다름에 주의(FE-01).

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../schemas/category.schema';
import * as categoryController from '../controllers/category.controller';

const router: Router = Router();

// 모든 카테고리 엔드포인트는 인증 필요.
router.use(authMiddleware);

// C-01. 목록 조회 (sortOrder ASC)
router.get('/', categoryController.list);

// C-02. 생성 (body 검증)
router.post('/', validate(CreateCategorySchema, 'body'), categoryController.create);

// C-03. 수정 (PUT 전체 교체 — name·color·sort_order 모두 필수)
router.put('/:id', validate(UpdateCategorySchema, 'body'), categoryController.update);

// C-04. 삭제 (연결 Plan.categoryId는 onDelete:SetNull로 NULL 처리 → 200 + affectedPlans)
router.delete('/:id', categoryController.remove);

export { router as categoriesRouter };
