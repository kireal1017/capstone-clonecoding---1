// 근거: harness.md TEST DB ISOLATION 지침 (test-infra 추가 허용, progress.md에 기록)
// Vitest 설정: 격리된 test.db 사용. globalSetup으로 마이그레이션 1회 적용,
// setupFiles(testEnv)로 워커마다 DATABASE_URL/NODE_ENV를 prisma import 전에 강제 설정.
// Step 2 단위 테스트는 DB를 사용하지 않으므로 영향 없음.
// C안 (2026-05-20): date-fns/date-fns-tz 의존성 제거 → nowKST()를 Intl 기반으로 재구현.
// server.deps.inline 우회책 불필요 — 삭제.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./tests/setup/globalSetup.ts'],
    setupFiles: ['./tests/setup/testEnv.ts'],
    // 통합 테스트가 단일 test.db를 공유하므로 파일 간 직렬 실행으로 격리.
    fileParallelism: false,
  },
});
