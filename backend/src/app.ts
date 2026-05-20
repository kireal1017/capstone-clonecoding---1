// 근거: docs/04-design/backend-spec.md §14 (미들웨어·라우터 등록 순서), §12 (보안)
// Express 앱 초기화: helmet → cors → express.json → cookie-parser → requestLogger →
// /health → errorHandler(LAST). 도메인 라우터(auth/plans/categories/profile)는 Step 3+ 범위.

import 'express-async-errors';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';
import { successResponse } from './types/api';
import { authRouter } from './routes/auth.route';
import { plansRouter } from './routes/plan.route';
import { categoriesRouter } from './routes/category.route';

const app: Express = express();

// 1) 보안 헤더
app.use(helmet());

// 2) CORS — credentials 허용 (refresh_token 쿠키 송수신)
app.use(
  cors({
    origin: env.FRONT_ORIGIN,
    credentials: true,
  }),
);

// 3) JSON 파싱
app.use(express.json());

// 4) 쿠키 파서 (refresh_token 쿠키 — Step 3+ 사용)
app.use(cookieParser());

// 5) 요청 로깅
app.use(requestLogger);

// 6) Health check
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json(successResponse({ status: 'ok' }));
});

// 7) 도메인 라우터 (Step 3: 인증, Step 4: 일정, Step 5: 카테고리). profile은 Step 6+ 범위.
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/plans', plansRouter);
app.use('/api/v1/categories', categoriesRouter);

// 8) 전역 에러 핸들러 — 반드시 마지막
app.use(errorHandler);

export { app };
