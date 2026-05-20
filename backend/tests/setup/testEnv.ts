// 근거: harness.md TEST DB ISOLATION 지침, validation.md §3-1·§7-5
// Vitest setupFiles — 테스트 워커에서 prisma/env 모듈이 import 되기 전에 실행됨.
// dev.db 오염 방지를 위해 격리된 test.db로 DATABASE_URL을 강제 설정한다.
// dotenv(env.ts의 import 'dotenv/config')는 이미 설정된 process.env 키를 덮어쓰지 않으므로,
// 여기서 먼저 세팅하면 .env의 DATABASE_URL보다 우선한다.

// DATABASE_URL은 schema.prisma 디렉토리(prisma/) 기준 상대 경로 형식을 사용한다.
// (절대 file:// URL은 Windows + 한글(퍼센트 인코딩) 경로에서 Prisma 엔진이 열지 못함 — os error 161.
//  dev.db가 file:./dev.db 상대형으로 동작하는 것과 동일하게 file:./test.db 사용.)
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';

// JWT 시크릿이 .env에 없을 경우를 대비한 테스트 기본값 (있으면 유지).
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.JWT_ACCESS_TTL ??= '3600';
process.env.JWT_REFRESH_TTL ??= '604800';
