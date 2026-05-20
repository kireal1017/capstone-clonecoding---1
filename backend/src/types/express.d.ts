// 근거: docs/04-design/backend-spec.md §4-1 (authMiddleware req.user 주입), §5-1 (Access Token 페이로드)
// Express Request에 인증 사용자 정보를 확장. Access Token 페이로드와 일치: { userId, email }.

import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

export {};
