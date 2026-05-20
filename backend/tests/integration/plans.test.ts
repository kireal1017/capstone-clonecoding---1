// 근거: docs/04-design/api-spec.md §4 (일정 API), backend-spec.md §8-2·§8-3, validation.md §3-2·§8, harness.md Step 4 DoD
// 일정 API 통합 테스트 (supertest). 격리된 test.db 사용 (tests/setup/*).
// 인증 없이 401 / CRUD / 완료 토글 / 서버 고정 정렬 / 필터 / display_date 교차검증 422 /
// 타인 일정 404 / 사용자별 데이터 격리 시나리오.

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { authRateLimiter } from '../../src/middlewares/rateLimiter';

interface TestUser {
  accessToken: string;
  userId: number;
  categoryId: number;
}

/** 고유 이메일로 회원가입+로그인 → accessToken·userId·첫 카테고리 ID 반환. */
async function registerAndLogin(email: string): Promise<TestUser> {
  const password = 'test1234';
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, nickname: '테스트유저' });
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const category = await prisma.category.findFirstOrThrow({
    where: { userId: user.id },
    orderBy: { sortOrder: 'asc' },
  });
  return {
    accessToken: loginRes.body.data.accessToken,
    userId: user.id,
    categoryId: category.id,
  };
}

/** 기본 유효 일정 본문 (api-spec §4-2 snake_case 요청 형식). */
function validPlanBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    title: '영상처리 과제 제출',
    due_date: '2026-05-25',
    due_time: '23:59',
    display_date: '2026-05-20',
    priority: 'high',
    memo: '5장 분량',
    is_remind: true,
    ...overrides,
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
  it('GET /api/v1/plans → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/plans');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('POST /api/v1/plans → 401 AUTH_UNAUTHORIZED', async () => {
    const res = await request(app).post('/api/v1/plans').send(validPlanBody());
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });
});

describe('POST /api/v1/plans — 생성', () => {
  it('성공 시 201 + 일정 반환 (카멜케이스)', async () => {
    const u = await registerAndLogin('create@example.com');
    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ category_id: u.categoryId }));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan).toMatchObject({
      title: '영상처리 과제 제출',
      dueDate: '2026-05-25',
      dueTime: '23:59',
      displayDate: '2026-05-20',
      categoryId: u.categoryId,
      priority: 'high',
      memo: '5장 분량',
      isCompleted: false,
      isRemind: true,
      userId: u.userId,
    });
    expect(res.body.data.plan.id).toBeTypeOf('number');
    expect(res.body.data.plan.category).toMatchObject({ id: u.categoryId });
    // createdAt/updatedAt은 KST ISO 8601 형식.
    expect(res.body.data.plan.createdAt).toMatch(/\+09:00$/);
  });

  it('카테고리 없이도 생성 가능 (categoryId null)', async () => {
    const u = await registerAndLogin('nocat@example.com');
    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody());
    expect(res.status).toBe(201);
    expect(res.body.data.plan.categoryId).toBeNull();
    expect(res.body.data.plan.category).toBeNull();
  });

  it('타인 카테고리 ID → 404 CATEGORY_NOT_FOUND', async () => {
    const owner = await registerAndLogin('owner-cat@example.com');
    const other = await registerAndLogin('other-cat@example.com');
    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(other.accessToken))
      .send(validPlanBody({ category_id: owner.categoryId }));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
  });

  it('잘못된 입력(title 누락) → 422 VALIDATION_FAILED', async () => {
    const u = await registerAndLogin('invalid@example.com');
    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ title: '' }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('due_date 형식 오류(20260520) → 422', async () => {
    const u = await registerAndLogin('baddate@example.com');
    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ due_date: '20260520' }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('display_date > due_date → 422 + details에 display_date 에러', async () => {
    const u = await registerAndLogin('crossval@example.com');
    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ due_date: '2026-05-20', display_date: '2026-05-25' }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    const fields = res.body.error.details.map(
      (d: { field: string }) => d.field,
    );
    expect(fields).toContain('display_date');
  });

  it('display_date == due_date 통과', async () => {
    const u = await registerAndLogin('equaldate@example.com');
    const res = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ due_date: '2026-05-20', display_date: '2026-05-20' }));
    expect(res.status).toBe(201);
  });
});

describe('GET /api/v1/plans — 목록 + 서버 고정 정렬', () => {
  it('서버 고정 정렬: is_completed→priority→due_time→created_at (B→C→E→A→D)', async () => {
    const u = await registerAndLogin('sort@example.com');
    // validation.md §8-2 정렬 검증 데이터. created_at 순서를 보장하기 위해 순차 생성.
    const make = (
      title: string,
      priority: string,
      dueTime: string | null,
    ): Promise<request.Response> =>
      request(app)
        .post('/api/v1/plans')
        .set('Authorization', auth(u.accessToken))
        .send(
          validPlanBody({
            title,
            priority,
            due_time: dueTime,
            memo: null,
          }),
        );
    // 생성 순서 = created_at 순서: B(1) → C(2) → A(3) → D(4) → E(5)
    await make('B', 'high', '09:00');
    await make('C', 'high', '10:00');
    await make('A', 'low', null);
    const dRes = await make('D', 'high', '09:00');
    await make('E', 'normal', null);

    // D를 완료 처리.
    await request(app)
      .patch(`/api/v1/plans/${dRes.body.data.plan.id}/complete`)
      .set('Authorization', auth(u.accessToken));

    const res = await request(app)
      .get('/api/v1/plans')
      .set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(5);
    const titles = res.body.data.plans.map((p: { title: string }) => p.title);
    expect(titles).toEqual(['B', 'C', 'E', 'A', 'D']);
  });

  it('month 필터: display_date 기준 해당 월만', async () => {
    const u = await registerAndLogin('month@example.com');
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ display_date: '2026-05-10', due_date: '2026-05-30' }));
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ display_date: '2026-06-10', due_date: '2026-06-30' }));
    const res = await request(app)
      .get('/api/v1/plans?month=2026-05')
      .set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.plans[0].displayDate).toBe('2026-05-10');
  });

  it('search 필터: title+memo LIKE', async () => {
    const u = await registerAndLogin('search@example.com');
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ title: '캡스톤 발표', memo: null }));
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ title: '운동', memo: '캡스톤 회의록 정리' }));
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ title: '장보기', memo: null }));
    const res = await request(app)
      .get('/api/v1/plans?search=캡스톤')
      .set('Authorization', auth(u.accessToken));
    expect(res.body.data.total).toBe(2);
  });

  it('category OR 필터 + uncategorized OR', async () => {
    const u = await registerAndLogin('catfilter@example.com');
    const cats = await prisma.category.findMany({
      where: { userId: u.userId },
      orderBy: { sortOrder: 'asc' },
    });
    const c1 = cats[0]!.id;
    const c2 = cats[1]!.id;
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ category_id: c1 }));
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ category_id: c2 }));
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody()); // uncategorized

    // category=c1&category=c2 → 2건
    const orRes = await request(app)
      .get(`/api/v1/plans?category=${c1}&category=${c2}`)
      .set('Authorization', auth(u.accessToken));
    expect(orRes.body.data.total).toBe(2);

    // category=c1&uncategorized=1 → c1 일정 + 미분류 = 2건
    const mixRes = await request(app)
      .get(`/api/v1/plans?category=${c1}&uncategorized=1`)
      .set('Authorization', auth(u.accessToken));
    expect(mixRes.body.data.total).toBe(2);
  });

  it('priority OR + completed 필터', async () => {
    const u = await registerAndLogin('prio@example.com');
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ priority: 'high' }));
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ priority: 'low' }));
    const normalRes = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ priority: 'normal' }));

    const orRes = await request(app)
      .get('/api/v1/plans?priority=high&priority=low')
      .set('Authorization', auth(u.accessToken));
    expect(orRes.body.data.total).toBe(2);

    // normal 1건을 완료 처리 후 completed=1 → 1건
    await request(app)
      .patch(`/api/v1/plans/${normalRes.body.data.plan.id}/complete`)
      .set('Authorization', auth(u.accessToken));
    const completedRes = await request(app)
      .get('/api/v1/plans?completed=1')
      .set('Authorization', auth(u.accessToken));
    expect(completedRes.body.data.total).toBe(1);
  });
});

describe('GET /api/v1/plans/:id — 단건', () => {
  it('성공 시 200', async () => {
    const u = await registerAndLogin('getone@example.com');
    const created = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody());
    const id = created.body.data.plan.id;
    const res = await request(app)
      .get(`/api/v1/plans/${id}`)
      .set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.plan.id).toBe(id);
  });

  it('존재하지 않는 ID → 404 PLAN_NOT_FOUND', async () => {
    const u = await registerAndLogin('notfound@example.com');
    const res = await request(app)
      .get('/api/v1/plans/999999')
      .set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLAN_NOT_FOUND');
  });

  it('숫자 아닌 ID → 404 PLAN_NOT_FOUND', async () => {
    const u = await registerAndLogin('badid@example.com');
    const res = await request(app)
      .get('/api/v1/plans/abc')
      .set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLAN_NOT_FOUND');
  });
});

describe('PATCH /api/v1/plans/:id — 수정', () => {
  it('성공 시 200 + 변경 반영 + updatedAt 갱신(KST)', async () => {
    const u = await registerAndLogin('update@example.com');
    const created = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody());
    const id = created.body.data.plan.id;
    const res = await request(app)
      .patch(`/api/v1/plans/${id}`)
      .set('Authorization', auth(u.accessToken))
      .send({ title: '수정된 제목', priority: 'low' });
    expect(res.status).toBe(200);
    expect(res.body.data.plan.title).toBe('수정된 제목');
    expect(res.body.data.plan.priority).toBe('low');
    expect(res.body.data.plan.updatedAt).toMatch(/\+09:00$/);
  });

  it('display_date만 변경하여 기존 due_date 초과 → 422', async () => {
    const u = await registerAndLogin('updatecross@example.com');
    const created = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody({ due_date: '2026-05-20', display_date: '2026-05-15' }));
    const id = created.body.data.plan.id;
    const res = await request(app)
      .patch(`/api/v1/plans/${id}`)
      .set('Authorization', auth(u.accessToken))
      .send({ display_date: '2026-05-25' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('타인 일정 수정 시도 → 404 PLAN_NOT_FOUND', async () => {
    const owner = await registerAndLogin('owner-upd@example.com');
    const other = await registerAndLogin('other-upd@example.com');
    const created = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(owner.accessToken))
      .send(validPlanBody());
    const id = created.body.data.plan.id;
    const res = await request(app)
      .patch(`/api/v1/plans/${id}`)
      .set('Authorization', auth(other.accessToken))
      .send({ title: '해킹 시도' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLAN_NOT_FOUND');
  });
});

describe('DELETE /api/v1/plans/:id — soft delete', () => {
  it('성공 시 204 + DB deletedAt 채워짐 + 목록/단건에서 제외', async () => {
    const u = await registerAndLogin('delete@example.com');
    const created = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody());
    const id = created.body.data.plan.id;

    const delRes = await request(app)
      .delete(`/api/v1/plans/${id}`)
      .set('Authorization', auth(u.accessToken));
    expect(delRes.status).toBe(204);

    const dbRow = await prisma.plan.findUniqueOrThrow({ where: { id } });
    expect(dbRow.deletedAt).not.toBeNull();

    const listRes = await request(app)
      .get('/api/v1/plans')
      .set('Authorization', auth(u.accessToken));
    expect(listRes.body.data.total).toBe(0);

    const getRes = await request(app)
      .get(`/api/v1/plans/${id}`)
      .set('Authorization', auth(u.accessToken));
    expect(getRes.status).toBe(404);
    expect(getRes.body.error.code).toBe('PLAN_NOT_FOUND');
  });

  it('이미 삭제된 일정 재삭제 → 404 PLAN_NOT_FOUND', async () => {
    const u = await registerAndLogin('redelete@example.com');
    const created = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody());
    const id = created.body.data.plan.id;
    await request(app)
      .delete(`/api/v1/plans/${id}`)
      .set('Authorization', auth(u.accessToken));
    const res = await request(app)
      .delete(`/api/v1/plans/${id}`)
      .set('Authorization', auth(u.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLAN_NOT_FOUND');
  });
});

describe('PATCH /api/v1/plans/:id/complete — 완료 토글', () => {
  it('false → true → false 토글', async () => {
    const u = await registerAndLogin('toggle@example.com');
    const created = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(u.accessToken))
      .send(validPlanBody());
    const id = created.body.data.plan.id;
    expect(created.body.data.plan.isCompleted).toBe(false);

    const t1 = await request(app)
      .patch(`/api/v1/plans/${id}/complete`)
      .set('Authorization', auth(u.accessToken));
    expect(t1.status).toBe(200);
    expect(t1.body.data.plan.isCompleted).toBe(true);
    expect(t1.body.data.plan.updatedAt).toMatch(/\+09:00$/);

    const t2 = await request(app)
      .patch(`/api/v1/plans/${id}/complete`)
      .set('Authorization', auth(u.accessToken));
    expect(t2.body.data.plan.isCompleted).toBe(false);
  });

  it('타인 일정 토글 → 404 PLAN_NOT_FOUND', async () => {
    const owner = await registerAndLogin('owner-tg@example.com');
    const other = await registerAndLogin('other-tg@example.com');
    const created = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(owner.accessToken))
      .send(validPlanBody());
    const id = created.body.data.plan.id;
    const res = await request(app)
      .patch(`/api/v1/plans/${id}/complete`)
      .set('Authorization', auth(other.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLAN_NOT_FOUND');
  });
});

describe('사용자별 데이터 격리', () => {
  it('다른 사용자의 일정은 목록에 보이지 않음', async () => {
    const a = await registerAndLogin('iso-a@example.com');
    const b = await registerAndLogin('iso-b@example.com');
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(a.accessToken))
      .send(validPlanBody({ title: 'A의 일정' }));
    await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(b.accessToken))
      .send(validPlanBody({ title: 'B의 일정' }));

    const aList = await request(app)
      .get('/api/v1/plans')
      .set('Authorization', auth(a.accessToken));
    expect(aList.body.data.total).toBe(1);
    expect(aList.body.data.plans[0].title).toBe('A의 일정');

    const bList = await request(app)
      .get('/api/v1/plans')
      .set('Authorization', auth(b.accessToken));
    expect(bList.body.data.total).toBe(1);
    expect(bList.body.data.plans[0].title).toBe('B의 일정');
  });

  it('타인 일정 단건 조회 → 404 PLAN_NOT_FOUND (소유권 미노출)', async () => {
    const a = await registerAndLogin('iso-get-a@example.com');
    const b = await registerAndLogin('iso-get-b@example.com');
    const created = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', auth(a.accessToken))
      .send(validPlanBody());
    const id = created.body.data.plan.id;
    const res = await request(app)
      .get(`/api/v1/plans/${id}`)
      .set('Authorization', auth(b.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLAN_NOT_FOUND');
  });
});
