// 근거: validation.md §3-0 (공통 응답 규칙), backend-spec.md §4-3
// errorHandler: AppError → 표준 응답, ZodError → 422, 알 수 없는 에러 → 500.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { errorHandler } from '../../../src/middlewares/errorHandler';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../../src/utils/errors';

interface MockResponse {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 0,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

const noopReq = {} as Request;
const noopNext: NextFunction = () => undefined;

function run(err: unknown): MockResponse {
  const res = createMockRes();
  errorHandler(err, noopReq, res as unknown as Response, noopNext);
  return res;
}

describe('errorHandler', () => {
  it('AppError → statusCode + 표준 에러 응답', () => {
    const res = run(new NotFoundError('일정을 찾을 수 없습니다.', 'PLAN_NOT_FOUND'));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'PLAN_NOT_FOUND', message: '일정을 찾을 수 없습니다.' },
    });
  });

  it('ConflictError → 409 + code', () => {
    const res = run(new ConflictError('이미 사용 중인 이메일', 'EMAIL_ALREADY_EXISTS'));
    expect(res.statusCode).toBe(409);
    expect((res.body as { error: { code: string } }).error.code).toBe(
      'EMAIL_ALREADY_EXISTS',
    );
  });

  it('ValidationError(AppError) → 422 + details 포함', () => {
    const res = run(
      new ValidationError([{ field: 'email', message: '형식 오류' }]),
    );
    expect(res.statusCode).toBe(422);
    const body = res.body as {
      success: boolean;
      error: { code: string; details: unknown };
    };
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.details).toEqual([{ field: 'email', message: '형식 오류' }]);
  });

  it('ZodError → 422 VALIDATION_FAILED + details', () => {
    const schema = z.object({ age: z.number() });
    const result = schema.safeParse({ age: 'not-a-number' });
    expect(result.success).toBe(false);
    if (result.success) return;
    const res = run(result.error);
    expect(res.statusCode).toBe(422);
    const body = res.body as {
      error: { code: string; details: Array<{ field: string }> };
    };
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.details[0]?.field).toBe('age');
  });

  describe('알 수 없는 에러', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('→ 500 INTERNAL_SERVER_ERROR (내부 미노출)', () => {
      const res = run(new Error('DB 연결 실패: secret-host:5432'));
      expect(res.statusCode).toBe(500);
      const body = res.body as { error: { code: string; message: string } };
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(body.error.message).not.toContain('secret-host');
    });
  });
});
