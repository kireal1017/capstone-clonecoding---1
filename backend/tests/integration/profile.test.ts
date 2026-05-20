// 근거: docs/04-design/api-spec.md §6 (프로필 API PR-01~PR-04), validation.md §3-4,
//        backend-spec.md §8-5, data-model.md §2 (User), harness.md Step 6 DoD
// 프로필 API 통합 테스트 (supertest). 격리된 test.db 사용 (tests/setup/*).
// 인증 없이 401 / 본인 조회 / 닉네임 수정(updatedAt 갱신) / 잘못된 입력 422 /
// 비밀번호 변경 성공·현재 비번 불일치 / 변경 후 새 비번 로그인 가능·기존 비번 로그인 실패 /
// 아바타 업로드 성공(파일 생성 확인)·5MB 초과 400·허용 외 형식 400·파일 누락 422.

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { authRateLimiter } from '../../src/middlewares/rateLimiter';
import { AVATAR_DIR } from '../../src/middlewares/upload';

interface TestUser {
  accessToken: string;
  userId: number;
  email: string;
  password: string;
}

const DEFAULT_PASSWORD = 'test1234';

/** 고유 이메일로 회원가입+로그인 → accessToken·userId 반환. */
async function registerAndLogin(email: string): Promise<TestUser> {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: DEFAULT_PASSWORD, nickname: '테스트유저' });
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: DEFAULT_PASSWORD });
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return {
    accessToken: loginRes.body.data.accessToken,
    userId: user.id,
    email,
    password: DEFAULT_PASSWORD,
  };
}

function auth(token: string): string {
  return `Bearer ${token}`;
}

// 최소 유효 PNG 헤더(8바이트 시그니처) — 형식/저장 동작 검증용 더미 콘텐츠.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

beforeEach(async () => {
  await prisma.plan.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  for (const key of ['::ffff:127.0.0.1', '::1', '127.0.0.1']) {
    authRateLimiter.resetKey(key);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('인증 없이 접근', () => {
  it('GET /api/v1/profile → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/profile');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('PATCH /api/v1/profile → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app)
      .patch('/api/v1/profile')
      .send({ nickname: '새닉' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('PATCH /api/v1/profile/password → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app)
      .patch('/api/v1/profile/password')
      .send({
        currentPassword: 'test1234',
        newPassword: 'newpass123',
        newPasswordConfirm: 'newpass123',
      });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('POST /api/v1/profile/avatar → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app)
      .post('/api/v1/profile/avatar')
      .attach('avatar', PNG_SIGNATURE, {
        filename: 'a.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });
});

describe('GET /api/v1/profile — 조회 (PR-01)', () => {
  it('본인 프로필 반환 (id·email·nickname·avatarUrl·createdAt·updatedAt)', async () => {
    const u = await registerAndLogin('get@example.com');
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', auth(u.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const user = res.body.data.user;
    expect(user).toMatchObject({
      id: u.userId,
      email: 'get@example.com',
      nickname: '테스트유저',
      avatarUrl: null,
    });
    expect(user.createdAt).toMatch(/\+09:00$/);
    expect(user.updatedAt).toMatch(/\+09:00$/);
    // 민감 필드 미노출.
    expect(user.passwordHash).toBeUndefined();
    expect(user.refreshTokenHash).toBeUndefined();
  });
});

describe('PATCH /api/v1/profile — 닉네임 수정 (PR-02)', () => {
  it('성공 시 200 + nickname 변경 + updatedAt 갱신, email 불변', async () => {
    const u = await registerAndLogin('patch@example.com');
    const before = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', auth(u.accessToken));
    const beforeUpdatedAt = before.body.data.user.updatedAt as string;

    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', auth(u.accessToken))
      .send({ nickname: '새닉네임' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.nickname).toBe('새닉네임');
    expect(res.body.data.user.email).toBe('patch@example.com');
    expect(res.body.data.user.updatedAt).toMatch(/\+09:00$/);

    // DB 직접 확인: nickname 반영 + updatedAt 갱신(이전 이상).
    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.userId } });
    expect(row.nickname).toBe('새닉네임');
    expect(row.email).toBe('patch@example.com');
    expect(row.updatedAt >= beforeUpdatedAt).toBe(true);
  });

  it('닉네임 1자 → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('patchshort@example.com');
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', auth(u.accessToken))
      .send({ nickname: 'a' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toContain('nickname');
  });

  it('닉네임 공백 포함 → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('patchspace@example.com');
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', auth(u.accessToken))
      .send({ nickname: '새 닉네임' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('닉네임 누락 → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('patchmissing@example.com');
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', auth(u.accessToken))
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('PATCH /api/v1/profile/password — 비밀번호 변경 (PR-03)', () => {
  // bcryptjs(순수 JS, cost 12)는 OneDrive+한글 경로 환경에서 해시당 수백 ms~1s 소요.
  // 이 테스트는 register/login/changePassword/재로그인 2회로 bcrypt 연산이 6회 누적되어
  // 기본 5초 타임아웃을 초과한다. 단언은 그대로 두고 per-test 타임아웃만 20초로 늘린다.
  it('성공 시 200, 변경 후 새 비번 로그인 가능 + 기존 비번 로그인 실패', async () => {
    const u = await registerAndLogin('pw@example.com');
    const res = await request(app)
      .patch('/api/v1/profile/password')
      .set('Authorization', auth(u.accessToken))
      .send({
        currentPassword: DEFAULT_PASSWORD,
        newPassword: 'newpass123',
        newPasswordConfirm: 'newpass123',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('비밀번호 변경 완료');

    // 새 비밀번호로 로그인 성공.
    authRateLimiter.resetKey('::ffff:127.0.0.1');
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pw@example.com', password: 'newpass123' });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.data.accessToken).toBeTypeOf('string');

    // 기존 비밀번호로 로그인 실패 (401 AUTH_INVALID_CREDENTIALS).
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pw@example.com', password: DEFAULT_PASSWORD });
    expect(oldLogin.status).toBe(401);
    expect(oldLogin.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  }, 20000);

  it('현재 비밀번호 불일치 → 401 AUTH_INVALID_CREDENTIALS', async () => {
    const u = await registerAndLogin('pwwrong@example.com');
    const res = await request(app)
      .patch('/api/v1/profile/password')
      .set('Authorization', auth(u.accessToken))
      .send({
        currentPassword: 'wrongpass1',
        newPassword: 'newpass123',
        newPasswordConfirm: 'newpass123',
      });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('새 비밀번호 확인 불일치 → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('pwconfirm@example.com');
    const res = await request(app)
      .patch('/api/v1/profile/password')
      .set('Authorization', auth(u.accessToken))
      .send({
        currentPassword: DEFAULT_PASSWORD,
        newPassword: 'newpass123',
        newPasswordConfirm: 'different123',
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toContain('newPasswordConfirm');
  });

  it('새 비밀번호 형식 불일치(숫자 없음) → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('pwformat@example.com');
    const res = await request(app)
      .patch('/api/v1/profile/password')
      .set('Authorization', auth(u.accessToken))
      .send({
        currentPassword: DEFAULT_PASSWORD,
        newPassword: 'onlyletters',
        newPasswordConfirm: 'onlyletters',
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('POST /api/v1/profile/avatar — 아바타 업로드 (PR-04)', () => {
  it('jpg 업로드 성공 시 200 + avatarUrl 반환 + 파일 생성 + DB 반영', async () => {
    const u = await registerAndLogin('avatar@example.com');
    const res = await request(app)
      .post('/api/v1/profile/avatar')
      .set('Authorization', auth(u.accessToken))
      .attach('avatar', PNG_SIGNATURE, {
        filename: 'me.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(200);
    const avatarUrl: string = res.body.data.avatarUrl;
    // /uploads/avatars/{userId}_{timestamp}.jpg 형식.
    expect(avatarUrl).toMatch(
      new RegExp(`^/uploads/avatars/${u.userId}_\\d+\\.jpg$`),
    );

    // 실제 파일이 backend/uploads/avatars/에 저장됨.
    const filename = path.basename(avatarUrl);
    expect(fs.existsSync(path.join(AVATAR_DIR, filename))).toBe(true);

    // DB의 avatarUrl 반영.
    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.userId } });
    expect(row.avatarUrl).toBe(avatarUrl);

    // 후속 프로필 조회에서도 avatarUrl 노출.
    const getRes = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', auth(u.accessToken));
    expect(getRes.body.data.user.avatarUrl).toBe(avatarUrl);
  });

  it('5MB 초과 → 400 FILE_TOO_LARGE', async () => {
    const u = await registerAndLogin('avatarbig@example.com');
    const big = Buffer.alloc(5 * 1024 * 1024 + 1, 0x01);
    const res = await request(app)
      .post('/api/v1/profile/avatar')
      .set('Authorization', auth(u.accessToken))
      .attach('avatar', big, {
        filename: 'big.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('허용 외 형식(gif) → 400 INVALID_FILE_TYPE', async () => {
    const u = await registerAndLogin('avatargif@example.com');
    const res = await request(app)
      .post('/api/v1/profile/avatar')
      .set('Authorization', auth(u.accessToken))
      .attach('avatar', PNG_SIGNATURE, {
        filename: 'anim.gif',
        contentType: 'image/gif',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('파일 누락 → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('avatarnone@example.com');
    const res = await request(app)
      .post('/api/v1/profile/avatar')
      .set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('사용자별 데이터 격리', () => {
  it('프로필 조회는 본인 정보만 반환 (토큰별 분리)', async () => {
    const a = await registerAndLogin('iso-a@example.com');
    const b = await registerAndLogin('iso-b@example.com');

    const resA = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', auth(a.accessToken));
    const resB = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', auth(b.accessToken));

    expect(resA.body.data.user.email).toBe('iso-a@example.com');
    expect(resB.body.data.user.email).toBe('iso-b@example.com');
    expect(resA.body.data.user.id).not.toBe(resB.body.data.user.id);
  });

  it('A가 닉네임을 바꿔도 B 닉네임은 불변', async () => {
    const a = await registerAndLogin('iso-patch-a@example.com');
    const b = await registerAndLogin('iso-patch-b@example.com');
    await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', auth(a.accessToken))
      .send({ nickname: 'A닉네임변경' });

    const rowB = await prisma.user.findUniqueOrThrow({ where: { id: b.userId } });
    expect(rowB.nickname).toBe('테스트유저');
  });
});
