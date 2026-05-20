// 근거: docs/04-design/backend-spec.md §4-4 (rateLimiter), PRD §19-5, api-spec.md §2 (TOO_MANY_REQUESTS)
// 인증 엔드포인트용 Rate Limiter: 5req/min/IP. 초과 시 429 + 표준 에러 응답.
// export만 하며 라우트 부착은 Step 3+ 범위.

import rateLimit from 'express-rate-limit';
import type { ErrorResponse } from '../types/api';

const TOO_MANY_REQUESTS_BODY: ErrorResponse = {
  success: false,
  error: {
    code: 'TOO_MANY_REQUESTS',
    message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
  },
};

/** 인증 엔드포인트용 limiter — 1분 윈도우, IP당 5회 허용. */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  limit: 5, // IP당 5회
  standardHeaders: true,
  legacyHeaders: false,
  message: TOO_MANY_REQUESTS_BODY,
});
