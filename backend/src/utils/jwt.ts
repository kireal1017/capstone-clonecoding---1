// 근거: docs/04-design/backend-spec.md §5 (JWT 처리), PRD §19-1, validation.md §7-2
// Access/Refresh 토큰 생성·검증. 검증 실패 시 적절한 AppError로 매핑.
// jti(JWT ID): Refresh Token에 crypto.randomUUID()를 삽입하여 동일 초 내에 발급된 토큰도
// 반드시 서로 다른 문자열이 되도록 보장. Token Rotation 재사용 감지(bcrypt.compare)의 전제 조건.

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { env } from '../config/env';
import { InvalidTokenError, RefreshExpiredError } from './errors';

/** Access Token 페이로드 (PRD §19-1): userId + email. */
export interface AccessTokenPayload {
  userId: number;
  email: string;
}

/** Refresh Token 페이로드 (PRD §19-1): userId만. */
export interface RefreshTokenPayload {
  userId: number;
}

const AccessPayloadSchema = z.object({
  userId: z.number().int().positive(),
  email: z.string().email(),
});

const RefreshPayloadSchema = z.object({
  userId: z.number().int().positive(),
});

/** Access Token 발급 (TTL: env.JWT_ACCESS_TTL 초). */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  });
}

/** Refresh Token 발급 (TTL: env.JWT_REFRESH_TTL 초).
 *  jti(randomUUID)를 포함하여 동일 초 내 발급 시에도 토큰이 항상 고유함을 보장.
 *  Token Rotation 재사용 감지(bcrypt.compare)는 이 고유성에 의존한다.
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign({ ...payload, jti: randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  });
}

/**
 * Access Token 검증.
 * - 만료: AUTH_UNAUTHORIZED (클라이언트가 /refresh 호출, backend-spec.md §4-1)
 * - 서명/형식 오류: AUTH_INVALID_TOKEN
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new InvalidTokenError('Access Token이 만료되었습니다.');
    }
    throw new InvalidTokenError();
  }
  const parsed = AccessPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new InvalidTokenError();
  }
  return parsed.data;
}

/**
 * Refresh Token 검증.
 * - 만료: AUTH_REFRESH_EXPIRED
 * - 서명/형식 오류: AUTH_INVALID_TOKEN
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new RefreshExpiredError();
    }
    throw new InvalidTokenError();
  }
  const parsed = RefreshPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new InvalidTokenError();
  }
  return parsed.data;
}
