// 근거: harness.md TEST DB ISOLATION 지침
// Vitest globalSetup — 전체 테스트 실행 전 1회. 격리된 test.db를 새로 만들고 기존 마이그레이션을 적용한다.
// dev.db는 건드리지 않는다. 스키마/마이그레이션 파일은 수정하지 않고 deploy만 수행 (read-only 적용).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const backendDir = path.resolve(__dirname, '..', '..');
const prismaCli = path.resolve(backendDir, '..', 'node_modules', 'prisma', 'build', 'index.js');
const testDbPath = path.resolve(backendDir, 'prisma', 'test.db');
// schema.prisma(prisma/) 기준 상대 경로 형식. 절대 file:// URL은 한글 경로에서 Prisma 엔진이 열지 못함.
const databaseUrl = 'file:./test.db';

export default function setup(): void {
  // 1) 이전 test.db 잔여 파일 제거 (clean slate).
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const f = `${testDbPath}${suffix}`;
    if (fs.existsSync(f)) {
      fs.rmSync(f);
    }
  }

  // 2) 기존 마이그레이션을 test.db에 적용 (schema/migration 파일 변경 없음).
  execFileSync('node', [prismaCli, 'migrate', 'deploy'], {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}
