// 근거: backend-spec.md §4-2 (validate 팩토리), validation.md §3-0
// validate: 유효 입력 통과 + 파싱값 재할당, 무효 입력 → ValidationError(422) forward.

import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../../src/middlewares/validate';
import { ValidationError } from '../../../src/utils/errors';

function runValidate(
  schema: z.ZodTypeAny,
  target: 'body' | 'query' | 'params',
  reqData: Record<string, unknown>,
): { req: Partial<Request>; error: unknown; called: boolean } {
  const req = { [target]: reqData } as unknown as Request;
  let error: unknown;
  let called = false;
  const next: NextFunction = (err?: unknown) => {
    called = true;
    error = err;
  };
  const mw = validate(schema, target);
  mw(req, {} as Response, next);
  return { req, error, called };
}

describe('validate', () => {
  const bodySchema = z.object({
    email: z.string().email(),
    nickname: z.string().min(2),
  });

  it('유효한 body → next() 인자 없이 호출 (통과)', () => {
    const { error, called } = runValidate(bodySchema, 'body', {
      email: 'a@b.com',
      nickname: '홍길동',
    });
    expect(called).toBe(true);
    expect(error).toBeUndefined();
  });

  it('무효한 body → ValidationError(422) forward', () => {
    const { error } = runValidate(bodySchema, 'body', {
      email: 'not-email',
      nickname: 'x',
    });
    expect(error).toBeInstanceOf(ValidationError);
    const ve = error as ValidationError;
    expect(ve.statusCode).toBe(422);
    expect(ve.code).toBe('VALIDATION_FAILED');
    expect(ve.details && ve.details.length).toBeGreaterThanOrEqual(1);
  });

  it('파싱(coerce) 결과를 req[target]에 재할당', () => {
    const querySchema = z.object({ page: z.coerce.number().int() });
    const { req, error } = runValidate(querySchema, 'query', { page: '3' });
    expect(error).toBeUndefined();
    expect((req.query as unknown as { page: number }).page).toBe(3);
  });

  it('target 기본값은 body', () => {
    const req = { body: { email: 'a@b.com', nickname: '닉네임' } } as unknown as Request;
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };
    validate(bodySchema)(req, {} as Response, next);
    expect(called).toBe(true);
  });
});
