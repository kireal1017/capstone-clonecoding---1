// 근거: backend-spec.md §5 (JWT), validation.md §7-2 (토큰 에러 코드 매핑)
// jwt 유틸 라운드트립 + 검증 실패 시 AppError 코드 매핑.

import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/utils/jwt';
import { env } from '../../../src/config/env';
import { InvalidTokenError, RefreshExpiredError } from '../../../src/utils/errors';

describe('jwt utils', () => {
  it('Access Token 라운드트립: 생성 → 검증 → 페이로드 일치', () => {
    const token = generateAccessToken({ userId: 1, email: 'a@b.com' });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe(1);
    expect(payload.email).toBe('a@b.com');
  });

  it('Refresh Token 라운드트립: userId만 포함', () => {
    const token = generateRefreshToken({ userId: 42 });
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe(42);
  });

  it('잘못된 서명 Access Token → InvalidTokenError(AUTH_INVALID_TOKEN)', () => {
    const bad = jwt.sign({ userId: 1, email: 'a@b.com' }, 'wrong-secret');
    expect(() => verifyAccessToken(bad)).toThrow(InvalidTokenError);
  });

  it('만료된 Access Token → InvalidTokenError', () => {
    const expired = jwt.sign(
      { userId: 1, email: 'a@b.com' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: -10 },
    );
    expect(() => verifyAccessToken(expired)).toThrow(InvalidTokenError);
  });

  it('만료된 Refresh Token → RefreshExpiredError(AUTH_REFRESH_EXPIRED)', () => {
    const expired = jwt.sign({ userId: 1 }, env.JWT_REFRESH_SECRET, {
      expiresIn: -10,
    });
    let caught: unknown;
    try {
      verifyRefreshToken(expired);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RefreshExpiredError);
    expect((caught as RefreshExpiredError).code).toBe('AUTH_REFRESH_EXPIRED');
  });

  it('페이로드 형식 불일치 (email 누락) → InvalidTokenError', () => {
    const malformed = jwt.sign({ userId: 1 }, env.JWT_ACCESS_SECRET);
    expect(() => verifyAccessToken(malformed)).toThrow(InvalidTokenError);
  });
});
