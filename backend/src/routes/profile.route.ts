// 근거: docs/04-design/api-spec.md §6·§7 (PR-01~PR-04), backend-spec.md §8-5, harness.md Step 6 범위
// /api/v1/profile/* 라우터. 모든 엔드포인트 authMiddleware 적용(router.use). 본인(req.user.userId)만 접근.
// 닉네임/비밀번호 본문은 validate로 검증. 아바타는 multipart라 upload(multer) 미들웨어로 파일 검증.

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { uploadAvatar } from '../middlewares/upload';
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
} from '../schemas/profile.schema';
import * as profileController from '../controllers/profile.controller';

const router: Router = Router();

// 모든 프로필 엔드포인트는 인증 필요.
router.use(authMiddleware);

// PR-01. 조회 (200)
router.get('/', profileController.getProfile);

// PR-02. 닉네임 수정 (PATCH, body 검증) — email 변경 불가
router.patch('/', validate(UpdateProfileSchema, 'body'), profileController.updateProfile);

// PR-03. 비밀번호 변경 (PATCH, body 검증)
router.patch(
  '/password',
  validate(ChangePasswordSchema, 'body'),
  profileController.changePassword,
);

// PR-04. 아바타 업로드 (multipart — upload 미들웨어가 형식/크기/누락 검증)
router.post('/avatar', uploadAvatar, profileController.uploadAvatar);

export { router as profileRouter };
