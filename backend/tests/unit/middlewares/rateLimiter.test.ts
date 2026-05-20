// 근거: backend-spec.md §4-4 (rateLimiter 5req/min/IP), api-spec.md §2 (TOO_MANY_REQUESTS)
// authRateLimiter: 6번째 요청에서 429 + 표준 에러 응답 반환.

import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authRateLimiter } from '../../../src/middlewares/rateLimiter';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/auth/login', authRateLimiter, (_req, res) => {
    res.status(200).json({ success: true, data: { ok: true } });
  });
  return app;
}

describe('authRateLimiter', () => {
  it('5회까지 200, 6회째 429 + 표준 에러 응답', async () => {
    const app = buildApp();
    const agent = request(app);

    for (let i = 0; i < 5; i++) {
      const ok = await agent.post('/auth/login').send({});
      expect(ok.status).toBe(200);
    }

    const limited = await agent.post('/auth/login').send({});
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
      },
    });
  });
});
