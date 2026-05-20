// 근거: docs/04-design/backend-spec.md §4-3 (errorHandler), api-spec.md §1-2·§2, PRD §35
// 전역 에러 핸들러: AppError → 표준 응답, ZodError → 422, 그 외 → 500 (내부 미노출).
// app.ts에서 모든 라우터 등록 후 마지막에 등록. 반드시 4-arg 시그니처.

import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorDetail } from '../utils/errors';
import type { ErrorResponse } from '../types/api';

function zodToDetails(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint은 미사용 4번째 인자를 요구 — Express가 4-arg를 에러 핸들러로 인식.
  _next: NextFunction,
): void => {
  // 1) AppError → 정의된 statusCode + code + message (+ details)
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // 2) ZodError → 422 VALIDATION_FAILED + details
  if (err instanceof ZodError) {
    const body: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: '입력값 검증에 실패했습니다.',
        details: zodToDetails(err),
      },
    };
    res.status(422).json(body);
    return;
  }

  // 3) 그 외 모든 에러 → 500 (상세 내용 클라이언트 미노출)
  // 개발 환경에서는 스택 로깅 (운영 환경 제외).
  if (process.env.NODE_ENV !== 'production') {
    console.error('[errorHandler] Unhandled error:', err);
  }
  const body: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다.',
    },
  };
  res.status(500).json(body);
};
