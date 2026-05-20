// 근거: docs/04-design/backend-spec.md §11-1 (요청 로거)
// morgan 기반 요청 로깅. 개발 환경은 'dev', 운영 환경은 'combined' 포맷.

import morgan from 'morgan';
import type { RequestHandler } from 'express';

const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

/** morgan 요청 로거 미들웨어. */
export const requestLogger: RequestHandler = morgan(format);
