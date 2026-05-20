// 근거: docs/04-design/api-spec.md §5 (카테고리 API), backend-spec.md §8-4, validation.md §3-3·§4,
//        data-model.md §3 (@@unique([userId,name]), Plan.categoryId onDelete:SetNull), harness.md Step 5 DoD
// 카테고리 API 통합 테스트 (supertest). 격리된 test.db 사용 (tests/setup/*).
// 인증 없이 401 / 목록(sortOrder 정렬) / 생성 / 중복명 409 / 수정(PUT 전체교체) / 삭제 /
// 타인 404 / 삭제 후 연결 Plan.categoryId NULL / HEX 색상 검증 422 시나리오.

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { authRateLimiter } from '../../src/middlewares/rateLimiter';

interface TestUser {
  accessToken: string;
  userId: number;
}

/** 고유 이메일로 회원가입+로그인 → accessToken·userId 반환 (기본 카테고리 5개 시드됨). */
async function registerAndLogin(email: string): Promise<TestUser> {
  const password = 'test1234';
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, nickname: '테스트유저' });
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return {
    accessToken: loginRes.body.data.accessToken,
    userId: user.id,
  };
}

function auth(token: string): string {
  return `Bearer ${token}`;
}

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
  it('GET /api/v1/categories → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('POST /api/v1/categories → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .send({ name: '독서', color: '#8B5CF6' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('PUT /api/v1/categories/1 → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app)
      .put('/api/v1/categories/1')
      .send({ name: '독서', color: '#8B5CF6', sort_order: 1 });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('DELETE /api/v1/categories/1 → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).delete('/api/v1/categories/1');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });
});

describe('GET /api/v1/categories — 목록', () => {
  it('회원가입 직후 기본 카테고리 5개 (sortOrder 1~5 오름차순)', async () => {
    const u = await registerAndLogin('list@example.com');
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', auth(u.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cats = res.body.data.categories as Array<{
      name: string;
      sortOrder: number;
      userId: number;
      createdAt: string;
    }>;
    expect(cats).toHaveLength(5);
    expect(cats.map((c) => c.name)).toEqual([
      '미팅',
      '과제',
      '시험',
      '개인 일정',
      '약속',
    ]);
    expect(cats.map((c) => c.sortOrder)).toEqual([1, 2, 3, 4, 5]);
    expect(cats[0]!.userId).toBe(u.userId);
    // createdAt은 KST ISO 8601 형식.
    expect(cats[0]!.createdAt).toMatch(/\+09:00$/);
  });

  it('정렬: 신규 카테고리는 sortOrder 순으로 목록에 삽입됨', async () => {
    const u = await registerAndLogin('listsort@example.com');
    await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '맨앞', color: '#111111', sort_order: 0 });

    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', auth(u.accessToken));
    const names = res.body.data.categories.map(
      (c: { name: string }) => c.name,
    );
    // sort_order 0이 가장 앞.
    expect(names[0]).toBe('맨앞');
  });
});

describe('POST /api/v1/categories — 생성', () => {
  it('성공 시 201 + 카테고리 반환 (카멜케이스)', async () => {
    const u = await registerAndLogin('create@example.com');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '독서', color: '#8B5CF6', sort_order: 6 });

    expect(res.status).toBe(201);
    expect(res.body.data.category).toMatchObject({
      name: '독서',
      color: '#8B5CF6',
      sortOrder: 6,
      userId: u.userId,
    });
    expect(res.body.data.category.id).toBeTypeOf('number');
    expect(res.body.data.category.createdAt).toMatch(/\+09:00$/);
  });

  it('sort_order 생략 시 현재 최대값+1 (기본 5개 → 6)', async () => {
    const u = await registerAndLogin('autosort@example.com');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '독서', color: '#8B5CF6' });
    expect(res.status).toBe(201);
    expect(res.body.data.category.sortOrder).toBe(6);
  });

  it('중복명 → 409 CATEGORY_NAME_ALREADY_EXISTS (기본 "미팅" 재생성)', async () => {
    const u = await registerAndLogin('dup@example.com');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '미팅', color: '#7C3AED', sort_order: 6 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_NAME_ALREADY_EXISTS');
  });

  it('HEX 형식 오류(색상 누락 # / 자릿수) → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('badhex@example.com');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '독서', color: '8B5CF6' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toContain('color');
  });

  it('이름 누락 → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('noname@example.com');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ color: '#8B5CF6' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('이름 31자 → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('longname@example.com');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: 'a'.repeat(31), color: '#8B5CF6' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('서로 다른 사용자는 동일명 카테고리 생성 가능 (격리)', async () => {
    const a = await registerAndLogin('iso-create-a@example.com');
    const b = await registerAndLogin('iso-create-b@example.com');
    const resA = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(a.accessToken))
      .send({ name: '팀플', color: '#FF5733' });
    const resB = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(b.accessToken))
      .send({ name: '팀플', color: '#FF5733' });
    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
  });
});

describe('PUT /api/v1/categories/:id — 수정 (전체 교체)', () => {
  it('성공 시 200 + name·color·sortOrder 전체 교체 + updatedAt 갱신', async () => {
    const u = await registerAndLogin('update@example.com');
    const created = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '독서', color: '#8B5CF6', sort_order: 6 });
    const id = created.body.data.category.id;

    const res = await request(app)
      .put(`/api/v1/categories/${id}`)
      .set('Authorization', auth(u.accessToken))
      .send({ name: '취미', color: '#123456', sort_order: 9 });
    expect(res.status).toBe(200);
    expect(res.body.data.category).toMatchObject({
      id,
      name: '취미',
      color: '#123456',
      sortOrder: 9,
    });
    expect(res.body.data.category.updatedAt).toMatch(/\+09:00$/);
  });

  it('필드 누락(sort_order 없음) → 422 (전체 교체이므로 모두 필수)', async () => {
    const u = await registerAndLogin('putmissing@example.com');
    const created = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '독서', color: '#8B5CF6', sort_order: 6 });
    const id = created.body.data.category.id;
    const res = await request(app)
      .put(`/api/v1/categories/${id}`)
      .set('Authorization', auth(u.accessToken))
      .send({ name: '취미', color: '#123456' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toContain('sort_order');
  });

  it('다른 카테고리와 동일명으로 변경 → 409 CATEGORY_NAME_ALREADY_EXISTS', async () => {
    const u = await registerAndLogin('putdup@example.com');
    const created = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '독서', color: '#8B5CF6', sort_order: 6 });
    const id = created.body.data.category.id;
    // 기본 카테고리 "과제"와 동일명으로 변경 시도.
    const res = await request(app)
      .put(`/api/v1/categories/${id}`)
      .set('Authorization', auth(u.accessToken))
      .send({ name: '과제', color: '#123456', sort_order: 9 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_NAME_ALREADY_EXISTS');
  });

  it('동일 카테고리에 같은 이름 유지(자기 자신) → 200', async () => {
    const u = await registerAndLogin('putself@example.com');
    const created = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '독서', color: '#8B5CF6', sort_order: 6 });
    const id = created.body.data.category.id;
    const res = await request(app)
      .put(`/api/v1/categories/${id}`)
      .set('Authorization', auth(u.accessToken))
      .send({ name: '독서', color: '#000000', sort_order: 7 });
    expect(res.status).toBe(200);
    expect(res.body.data.category.color).toBe('#000000');
    expect(res.body.data.category.sortOrder).toBe(7);
  });

  it('존재하지 않는 ID → 404 CATEGORY_NOT_FOUND', async () => {
    const u = await registerAndLogin('putnotfound@example.com');
    const res = await request(app)
      .put('/api/v1/categories/999999')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '취미', color: '#123456', sort_order: 9 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
  });

  it('비정수 ID → 404 CATEGORY_NOT_FOUND', async () => {
    const u = await registerAndLogin('putbadid@example.com');
    const res = await request(app)
      .put('/api/v1/categories/abc')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '취미', color: '#123456', sort_order: 9 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
  });

  it('타인 소유 카테고리 수정 → 404 CATEGORY_NOT_FOUND (소유권 미노출)', async () => {
    const owner = await registerAndLogin('owner-put@example.com');
    const other = await registerAndLogin('other-put@example.com');
    const created = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(owner.accessToken))
      .send({ name: '독서', color: '#8B5CF6', sort_order: 6 });
    const id = created.body.data.category.id;
    const res = await request(app)
      .put(`/api/v1/categories/${id}`)
      .set('Authorization', auth(other.accessToken))
      .send({ name: '해킹', color: '#123456', sort_order: 9 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
  });
});

describe('DELETE /api/v1/categories/:id — 삭제', () => {
  it('성공 시 200 + affectedPlans + DB에서 제거', async () => {
    const u = await registerAndLogin('delete@example.com');
    const created = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '독서', color: '#8B5CF6', sort_order: 6 });
    const id = created.body.data.category.id;

    const res = await request(app)
      .delete(`/api/v1/categories/${id}`)
      .set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.affectedPlans).toBe(0);

    const dbRow = await prisma.category.findUnique({ where: { id } });
    expect(dbRow).toBeNull();
  });

  it('삭제 후 연결 Plan.categoryId = NULL (onDelete:SetNull 검증)', async () => {
    const u = await registerAndLogin('setnull@example.com');
    const created = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(u.accessToken))
      .send({ name: '과제그룹', color: '#2563EB', sort_order: 6 });
    const categoryId = created.body.data.category.id;

    // 해당 카테고리에 연결된 일정 2건 생성 (Plan API 호출 — 일정 코드 수정 아님).
    const planBody = {
      title: '과제 제출',
      due_date: '2026-05-25',
      display_date: '2026-05-20',
      priority: 'high',
      category_id: categoryId,
    };
    const p1 = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(planBody);
    const p2 = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send({ ...planBody, title: '과제 2' });
    expect(p1.body.data.plan.categoryId).toBe(categoryId);

    // 카테고리 삭제 → affectedPlans 2.
    const delRes = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set('Authorization', auth(u.accessToken));
    expect(delRes.status).toBe(200);
    expect(delRes.body.data.affectedPlans).toBe(2);

    // DB 직접 확인: 두 일정 모두 categoryId NULL.
    const row1 = await prisma.plan.findUniqueOrThrow({
      where: { id: p1.body.data.plan.id },
    });
    const row2 = await prisma.plan.findUniqueOrThrow({
      where: { id: p2.body.data.plan.id },
    });
    expect(row1.categoryId).toBeNull();
    expect(row2.categoryId).toBeNull();

    // API 조회에서도 categoryId/category가 null.
    const getRes = await request(app)
      .get(`/api/v1/plans/${p1.body.data.plan.id}`)
      .set('Authorization', auth(u.accessToken));
    expect(getRes.body.data.plan.categoryId).toBeNull();
    expect(getRes.body.data.plan.category).toBeNull();
  });

  it('존재하지 않는 ID → 404 CATEGORY_NOT_FOUND', async () => {
    const u = await registerAndLogin('delnotfound@example.com');
    const res = await request(app)
      .delete('/api/v1/categories/999999')
      .set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
  });

  it('타인 소유 카테고리 삭제 → 404 CATEGORY_NOT_FOUND + 미삭제', async () => {
    const owner = await registerAndLogin('owner-del@example.com');
    const other = await registerAndLogin('other-del@example.com');
    const created = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(owner.accessToken))
      .send({ name: '독서', color: '#8B5CF6', sort_order: 6 });
    const id = created.body.data.category.id;

    const res = await request(app)
      .delete(`/api/v1/categories/${id}`)
      .set('Authorization', auth(other.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');

    // 실제로 삭제되지 않았는지 확인.
    const dbRow = await prisma.category.findUnique({ where: { id } });
    expect(dbRow).not.toBeNull();
  });
});

describe('사용자별 데이터 격리', () => {
  it('다른 사용자의 카테고리는 목록에 보이지 않음 (각자 기본 5개만)', async () => {
    const a = await registerAndLogin('iso-list-a@example.com');
    const b = await registerAndLogin('iso-list-b@example.com');
    await request(app)
      .post('/api/v1/categories')
      .set('Authorization', auth(a.accessToken))
      .send({ name: 'A전용', color: '#FF0000' });

    const aList = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', auth(a.accessToken));
    const bList = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', auth(b.accessToken));
    expect(aList.body.data.categories).toHaveLength(6); // 기본 5 + A전용
    expect(bList.body.data.categories).toHaveLength(5); // 기본 5만
    const bNames = bList.body.data.categories.map(
      (c: { name: string }) => c.name,
    );
    expect(bNames).not.toContain('A전용');
  });
});
