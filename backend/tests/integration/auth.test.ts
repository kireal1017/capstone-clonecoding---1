// 근거: docs/04-design/api-spec.md §3, backend-spec.md §5, validation.md §3-1·§7-5, harness.md §10 (Step 3 DoD)
// 인증 API 통합 테스트 (supertest). 격리된 test.db 사용 (tests/setup/*).
// 회원가입→로그인→refresh→me→logout 전체 시나리오 + Token Rotation 재사용 폐기 + refresh_token_hash 저장 검증.

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { authRateLimiter } from '../../src/middlewares/rateLimiter';

const VALID_USER = {
  email: 'test@example.com',
  password: 'test1234',
  nickname: '테스트',
};

/** Set-Cookie 배열에서 refresh_token 쿠키 1개를 추출. */
function getRefreshSetCookie(res: request.Response): string | undefined {
  const raw = res.headers['set-cookie'];
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return arr.find((c) => c.startsWith('refresh_token='));
}

/** 회원가입 + 로그인 후 { accessToken, refreshCookie }를 반환하는 헬퍼. */
async function registerAndLogin(): Promise<{
  accessToken: string;
  refreshCookie: string;
  userId: number;
}> {
  await request(app).post('/api/v1/auth/register').send(VALID_USER);
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: VALID_USER.email, password: VALID_USER.password });
  const setCookie = getRefreshSetCookie(loginRes);
  if (!setCookie) {
    throw new Error('refresh_token 쿠키가 로그인 응답에 없습니다.');
  }
  // "refresh_token=<token>; ..." → 요청에 그대로 재사용 가능한 "name=value" 부분.
  const cookiePair = setCookie.split(';')[0] ?? '';
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: VALID_USER.email },
  });
  return {
    accessToken: loginRes.body.data.accessToken,
    refreshCookie: cookiePair,
    userId: user.id,
  };
}

beforeEach(async () => {
  // 테이블 정리 (users 삭제 시 categories/plans는 onDelete: Cascade로 함께 삭제).
  await prisma.plan.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  // Rate limiter 키 초기화 (supertest는 동일 IP 사용 → 테스트 간 5req/min 누적 방지).
  for (const key of ['::ffff:127.0.0.1', '::1', '127.0.0.1']) {
    authRateLimiter.resetKey(key);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('성공 시 201 + 사용자 반환 + 기본 카테고리 5건 생성', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(VALID_USER);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      email: VALID_USER.email,
      nickname: VALID_USER.nickname,
    });
    expect(res.body.data.user.id).toBeTypeOf('number');
    // 비밀번호 해시는 응답에 노출되지 않아야 함.
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const categories = await prisma.category.findMany({
      where: { userId: res.body.data.user.id },
    });
    expect(categories).toHaveLength(5);
  });

  it('중복 이메일 → 409 EMAIL_ALREADY_EXISTS', async () => {
    await request(app).post('/api/v1/auth/register').send(VALID_USER);
    const res = await request(app).post('/api/v1/auth/register').send(VALID_USER);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('성공 시 200 + accessToken + HttpOnly refresh_token 쿠키(Path=/api/v1/auth)', async () => {
    await request(app).post('/api/v1/auth/register').send(VALID_USER);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.user).toMatchObject({
      email: VALID_USER.email,
      nickname: VALID_USER.nickname,
    });

    const setCookie = getRefreshSetCookie(res);
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/api/v1/auth');
    expect(setCookie).toContain('SameSite=Lax');
    // 개발/test 환경(NODE_ENV=test)에서는 Secure 미설정.
    expect(setCookie).not.toContain('Secure');
    expect(setCookie).toMatch(/Max-Age=604800/);
  });

  it('refresh_token_hash가 DB에 bcrypt 해시로 저장됨 (raw 토큰 아님, $2 prefix)', async () => {
    const { refreshCookie, userId } = await registerAndLogin();
    const rawToken = refreshCookie.replace('refresh_token=', '');
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.refreshTokenHash).toBeTruthy();
    expect(user.refreshTokenHash).not.toBe(rawToken);
    expect(user.refreshTokenHash?.startsWith('$2')).toBe(true);
  });

  it('잘못된 비밀번호 → 401 AUTH_INVALID_CREDENTIALS', async () => {
    await request(app).post('/api/v1/auth/register').send(VALID_USER);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID_USER.email, password: 'wrongpass1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('유효한 토큰 → 200 + 사용자 정보', async () => {
    const { accessToken } = await registerAndLogin();
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: VALID_USER.email });
  });

  it('토큰 없음 → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('성공 시 200 + 새 accessToken + 새 Set-Cookie (Token Rotation)', async () => {
    const { refreshCookie, userId } = await registerAndLogin();
    const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    const newCookie = getRefreshSetCookie(res);
    expect(newCookie).toBeDefined();
    expect(newCookie).toContain('Path=/api/v1/auth');

    // 저장된 hash가 교체되었는지 확인 (rotation).
    const after = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(after.refreshTokenHash).not.toBe(before.refreshTokenHash);
  });

  it('쿠키 없음 → 401 AUTH_REFRESH_EXPIRED', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REFRESH_EXPIRED');
  });

  it('이전 refresh 토큰 재사용 → 401 AUTH_INVALID_TOKEN + DB hash NULL (전체 세션 폐기, §7-5)', async () => {
    const { refreshCookie: cookieA, userId } = await registerAndLogin();

    // 1) cookieA로 refresh → 성공, cookieB 발급, cookieA 무효화
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieA);
    expect(refreshRes.status).toBe(200);
    const cookieBraw = getRefreshSetCookie(refreshRes);
    const cookieB = (cookieBraw ?? '').split(';')[0] ?? '';

    // 2) cookieA(이전 토큰) 재사용 → 401 + 세션 폐기
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieA);
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe('AUTH_INVALID_TOKEN');

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.refreshTokenHash).toBeNull();

    // 3) 폐기 후에는 cookieB(유효했던 토큰)로도 더 이상 갱신 불가 → 401
    const afterRevoke = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieB);
    expect(afterRevoke.status).toBe(401);
    expect(afterRevoke.body.error.code).toBe('AUTH_INVALID_TOKEN');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('성공 시 200 + Max-Age=0 쿠키 + DB refresh_token_hash NULL', async () => {
    const { accessToken, userId } = await registerAndLogin();
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('로그아웃 완료');
    const setCookie = getRefreshSetCookie(res);
    expect(setCookie).toBeDefined();
    expect(setCookie).toMatch(/Max-Age=0/);
    expect(setCookie).toContain('Path=/api/v1/auth');

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.refreshTokenHash).toBeNull();
  });

  it('토큰 없음 → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });
});
