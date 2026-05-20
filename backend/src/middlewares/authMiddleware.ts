// 근거: docs/04-design/backend-spec.md §4-1 (authMiddleware), PRD §19-2, validation.md §7-2
// Authorization: Bearer <token> 추출 → Access Token 검증 → req.user 주입. 실패 시 401.

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Protected 경로 미들웨어.
 * 동작:
 *  1. Authorization 헤더에서 Bearer 토큰 추출 (없거나 형식 오류 → 401 AUTH_UNAUTHORIZED)
 *  2. verifyAccessToken 검증 (만료/서명 오류 → AUTH_INVALID_TOKEN, jwt 유틸이 매핑)
 *  3. req.user = { userId, email } 주입
 *
 * NOTE: 리소스별 소유권 검증(where: { userId }, 타인 리소스 404)은 Step 3+ 서비스 계층에서
 * 수행한다. 이 미들웨어는 인증(authentication)만 담당하고 인가(authorization)는 다루지 않는다.
 */
export const authMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError());
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (token.length === 0) {
    next(new UnauthorizedError());
    return;
  }

  // verifyAccessToken은 만료/서명 오류 시 적절한 AppError를 throw.
  const payload = verifyAccessToken(token);
  req.user = { userId: payload.userId, email: payload.email };
  next();
};
