// 근거: docs/04-design/api-spec.md §3 (인증 API 응답·쿠키), backend-spec.md §5-4 (쿠키 설정, BE-12),
//        design-review.md BE-12, harness.md §3 Step 3 범위
// 얇은 컨트롤러: 요청 파싱 → service 호출 → successResponse() 응답 + refresh_token 쿠키 set/clear.

import type { Request, Response, CookieOptions } from 'express';
import { env } from '../config/env';
import { RefreshExpiredError, UnauthorizedError } from '../utils/errors';
import { successResponse } from '../types/api';
import * as authService from '../services/auth.service';

const REFRESH_COOKIE_NAME = 'refresh_token';

/**
 * Refresh Token 쿠키 옵션 (BE-12).
 * - httpOnly: 클라이언트 JS 접근 차단 (XSS 방지)
 * - path: /api/v1/auth (refresh + logout 양쪽에서 수신, 삭제 시 동일 path 필수)
 * - sameSite: lax (CSRF 방지, api-spec.md §3)
 * - secure: 운영 환경에서만 true (개발은 HTTP)
 */
function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    path: '/api/v1/auth',
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieOptions(),
    // express maxAge는 ms 단위. TTL(초) → ms 변환. Set-Cookie Max-Age는 초로 직렬화됨.
    maxAge: env.JWT_REFRESH_TTL * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  // Max-Age=0으로 즉시 만료. set 시점과 동일 path/속성이어야 브라우저가 삭제 (BE-12).
  res.cookie(REFRESH_COOKIE_NAME, '', {
    ...refreshCookieOptions(),
    maxAge: 0,
  });
}

/** POST /api/v1/auth/register — 회원가입 (201, 토큰 미발급). */
export async function register(req: Request, res: Response): Promise<void> {
  const user = await authService.register(req.body);
  res.status(201).json(successResponse({ user }));
}

/** POST /api/v1/auth/login — 로그인 (200 + accessToken, Set-Cookie refresh_token). */
export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  setRefreshCookie(res, result.refreshToken);
  res.status(200).json(
    successResponse({
      accessToken: result.accessToken,
      user: result.user,
    }),
  );
}

/** POST /api/v1/auth/refresh — Token Rotation (200 + 새 accessToken, 새 Set-Cookie). */
export async function refresh(req: Request, res: Response): Promise<void> {
  const cookie: unknown = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof cookie !== 'string' || cookie.length === 0) {
    // 쿠키 없음 → 만료로 간주 (api-spec.md §3-3).
    throw new RefreshExpiredError('Refresh Token 쿠키가 없습니다.');
  }
  const tokens = await authService.refresh(cookie);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(200).json(successResponse({ accessToken: tokens.accessToken }));
}

/** POST /api/v1/auth/logout — 로그아웃 (200, refresh_token_hash NULL, 쿠키 삭제). */
export async function logout(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  await authService.logout(req.user.userId);
  clearRefreshCookie(res);
  res.status(200).json(successResponse({ message: '로그아웃 완료' }));
}

/** GET /api/v1/auth/me — 현재 사용자 정보 (200). */
export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const user = await authService.me(req.user.userId);
  res.status(200).json(successResponse({ user }));
}
