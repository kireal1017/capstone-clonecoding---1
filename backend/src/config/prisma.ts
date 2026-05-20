// 근거: docs/04-design/backend-spec.md §9, design-review.md §6 (DB-01)
// PrismaClient 싱글톤. SQLite FK 제약 활성화 (PRAGMA foreign_keys = ON).

import { PrismaClient } from '@prisma/client';

declare global {
  var __prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  // DB-01: SQLite는 기본적으로 FK 검사 비활성. ON DELETE CASCADE / SET NULL이
  // 실제로 동작하려면 연결마다 PRAGMA foreign_keys = ON 실행 필요.
  // Prisma 5.x의 SQLite 어댑터는 자동 활성화하지만 안전 장치로 명시 실행.
  client
    .$executeRawUnsafe('PRAGMA foreign_keys = ON')
    .catch((err: unknown) => {
      // 초기화 단계 실패는 로깅만 (실제 쿼리 시점에 재시도)
      console.warn('[prisma] PRAGMA foreign_keys 활성화 실패:', err);
    });

  return client;
}

// 개발 환경 hot-reload 시 PrismaClient 인스턴스 중복 생성 방지
export const prisma: PrismaClient = global.__prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prismaClient = prisma;
}
