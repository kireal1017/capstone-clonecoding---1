// 근거: backend-spec.md §4-1 (authMiddleware), validation.md §7-2
// authMiddleware: 토큰 없음/형식오류 → 401 AUTH_UNAUTHORIZED, 유효 토큰 → req.user 주입.

import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../../src/middlewares/authMiddleware';
import { generateAccessToken } from '../../../src/utils/jwt';
import { UnauthorizedError, InvalidTokenError } from '../../../src/utils/errors';

function run(headerValue?: string): {
  req: Request;
  error: unknown;
  called: boolean;
} {
  const req = {
    headers: headerValue === undefined ? {} : { authorization: headerValue },
  } as unknown as Request;
  let error: unknown;
  let called = false;
  const next: NextFunction = (err?: unknown) => {
    called = true;
    error = err;
  };
  authMiddleware(req, {} as Response, next);
  return { req, error, called };
}

describe('authMiddleware', () => {
  it('Authorization 헤더 없음 → UnauthorizedError(401)', () => {
    const { error } = run(undefined);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect((error as UnauthorizedError).code).toBe('AUTH_UNAUTHORIZED');
  });

  it('Bearer 형식 아님 → UnauthorizedError(401)', () => {
    const { error } = run('Token abc.def.ghi');
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it('Bearer 뒤 토큰 비어있음 → UnauthorizedError(401)', () => {
    const { error } = run('Bearer ');
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it('서명 오류 토큰 → InvalidTokenError(401)', () => {
    let caught: unknown;
    try {
      run('Bearer not.a.valid.token');
    } catch (e) {
      caught = e;
    }
    // authMiddleware는 verifyAccessToken의 throw를 직접 전파 (Express가 catch).
    // run()에서 next 호출 없이 throw되므로 여기서 잡힌다.
    expect(caught).toBeInstanceOf(InvalidTokenError);
  });

  it('유효한 Access Token → req.user 주입', () => {
    const token = generateAccessToken({ userId: 7, email: 'u@e.com' });
    const { req, error, called } = run(`Bearer ${token}`);
    expect(error).toBeUndefined();
    expect(called).toBe(true);
    expect(req.user).toEqual({ userId: 7, email: 'u@e.com' });
  });
});
