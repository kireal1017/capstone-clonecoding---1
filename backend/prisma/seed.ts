// 근거: harness.md Step 1 §8~§9, data-model.md §7
//
// Step 1 시드 범위:
// - 데모/개발용 사용자(demo@planmate.local) idempotent 생성
// - 5개 기본 카테고리(K-02=B + K-03=A) idempotent 생성
//
// 실제 회원가입 시 5개 카테고리 자동 생성 로직은 Step 3(인증 API)에서 트랜잭션으로 구현.
// 시드는 createDefaultCategoriesForUser 함수를 재사용하여 일관성 유지.

import { PrismaClient } from '@prisma/client';
import { createDefaultCategoriesForUser, DEFAULT_CATEGORIES } from '../src/lib/defaultCategories';
import { nowKST } from '../src/utils/dateUtil';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@planmate.local';
const DEMO_NICKNAME = 'demo';

// Step 1 시드는 비밀번호 해싱을 수행하지 않음 (인증은 Step 3 범위).
// 데모 사용자는 로그인 불가 상태로 생성됨. Step 3 회원가입 흐름이 구현된 후
// 정식 가입 또는 별도 패치로 비밀번호를 설정해야 함.
const SEEDED_PLACEHOLDER_HASH = 'seeded-not-for-login';

async function main(): Promise<void> {
  console.log('[seed] 시작');

  // 1. 데모 사용자 idempotent 생성 (email @unique)
  const ts = nowKST();
  const passwordHash = SEEDED_PLACEHOLDER_HASH;

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      // 기존 사용자가 있어도 비밀번호 해시·닉네임만 보존, updatedAt만 갱신
      updatedAt: ts,
    },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      nickname: DEMO_NICKNAME,
      createdAt: ts,
      updatedAt: ts,
    },
  });

  console.log(`[seed] 데모 사용자: id=${demoUser.id}, email=${demoUser.email}`);

  // 2. 데모 사용자에게 5개 기본 카테고리 idempotent 생성
  await createDefaultCategoriesForUser(prisma, demoUser.id);

  // 3. 결과 확인 출력
  const categories = await prisma.category.findMany({
    where: { userId: demoUser.id },
    orderBy: { sortOrder: 'asc' },
  });

  console.log(`[seed] 카테고리 ${categories.length}개:`);
  for (const c of categories) {
      console.log(`  - ${c.sortOrder}. ${c.name} (${c.color})`);
  }

  // 4. 시드 정의 자체 검증 (정의와 DB 상태 동기화 확인)
  const namesInDb = new Set(categories.map((c) => c.name));
  const missing = DEFAULT_CATEGORIES.filter((d) => !namesInDb.has(d.name));
  if (missing.length > 0) {
    throw new Error(`[seed] 기본 카테고리 누락: ${missing.map((m) => m.name).join(', ')}`);
  }

  console.log('[seed] 완료');
}

main()
  .catch((err: unknown) => {
      console.error('[seed] 오류:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
