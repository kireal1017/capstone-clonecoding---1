// 근거: docs/04-design/backend-spec.md §10 (환경 변수), harness.md §3 Step 2 범위
// dotenv 로드 + Zod 검증. 누락 시 즉시 fail-fast. 동결된 타입 안전 config 객체 export.

import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  // TTL은 초 단위 정수 (예: 3600, 604800). jsonwebtoken expiresIn에 number로 전달.
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(3600),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(604800),
  FRONT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // 서버 시작 전 환경변수 검증 실패는 치명적 — 명확한 메시지 후 종료.
  throw new Error(`환경변수 검증 실패:\n${issues}`);
}

/** 검증·동결된 환경 설정 객체. */
export const env: Readonly<Env> = Object.freeze(parsed.data);
