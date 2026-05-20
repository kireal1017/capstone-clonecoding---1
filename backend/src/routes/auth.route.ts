// 근거: docs/04-design/backend-spec.md §3-1 (인증 라우터 매핑), api-spec.md §3·§7, PRD §19-5,
//        harness.md §3 Step 3 범위 + §8-1 (구현 순서)
// /api/v1/auth/* 라우터. register·login에 authRateLimiter + validate, logout·me에 authMiddleware.

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import { RegisterSchema, LoginSchema } from '../schemas/auth.schema';
import * as authController from '../controllers/auth.controller';

const router: Router = Router();

// 1. 회원가입 (rate limit + body 검증)
router.post(
  '/register',
  authRateLimiter,
  validate(RegisterSchema, 'body'),
  authController.register,
);

// 2. 로그인 (rate limit + body 검증)
router.post(
  '/login',
  authRateLimiter,
  validate(LoginSchema, 'body'),
  authController.login,
);

// 3. 토큰 갱신 (쿠키 기반, 미들웨어 없음 — 컨트롤러에서 쿠키 검증)
router.post('/refresh', authController.refresh);

// 4. 로그아웃 (Access Token 필요)
router.post('/logout', authMiddleware, authController.logout);

// 5. 내 정보 조회 (Access Token 필요)
router.get('/me', authMiddleware, authController.me);

export { router as authRouter };
