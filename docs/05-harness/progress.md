# PlanMate 개발 진행 상황 (Progress Log)

> 작성 시작일: 2026-05-20
> 갱신 규칙: harness.md §12 참조
> 시간 형식: KST ISO 8601 (`YYYY-MM-DDTHH:mm:ss+09:00`)
> **한 번에 하나의 Step만 진행. 완료 기록 전 다음 Step 시작 금지.**

---

## 사용 규칙

1. Step 시작 시 해당 Step 섹션의 "상태"를 `진행 중`으로 변경 + 시작 시각 기록
2. 주요 마일스톤마다 "작업 노트" 항목 한 줄 추가 (시각 포함)
3. Step 완료 시 "상태"를 `완료`로 변경 + 완료 시각 + 변경 파일 목록 + 실행 명령어 + 검증 결과 기록
4. 오류 발생 시 "남은 문제" 섹션에 추가 (해결 시 삭제, 해결 경위 한 줄 기록 후 삭제)
5. "보류" 상태 시 보류 이유와 사용자 결정 필요 사항 명시

---

## 진행 요약 대시보드

| Step | 분류 | 상태 | 시작 | 완료 | 비고 |
|---|---|---|---|---|---|
| Step 0 | 인프라 | 완료 | 2026-05-20 | 2026-05-20T17:00:00+09:00 | typecheck/lint 통과, OneDrive+한글 경로로 .bin 미생성 → node 직접 호출로 우회 |
| Step 1 | 백엔드(DB) | 완료 | 2026-05-20 | 2026-05-20T17:30:00+09:00 | Prisma init+migrate+seed 완료, 5개 기본 카테고리 idempotent 생성 확인 |
| Step 2 | 백엔드(미들웨어) | 미시작 | - | - | - |
| Step 3 | 백엔드(인증) | 미시작 | - | - | - |
| Step 4 | 백엔드(일정) | 미시작 | - | - | - |
| Step 5 | 백엔드(카테고리) | 미시작 | - | - | - |
| Step 6 | 백엔드(프로필) | 미시작 | - | - | - |
| Step 7 | 프론트(골격) | 미시작 | - | - | - |
| Step 8 | 프론트(인증) | 미시작 | - | - | - |
| Step 9 | 프론트(메인) | 미시작 | - | - | - |
| Step 10 | 프론트(등록/수정) | 미시작 | - | - | - |
| Step 11 | 프론트(프로필) | 미시작 | - | - | - |
| Step 12 | 프론트(검색/필터+E2E) | 미시작 | - | - | - |

**상태 범례:** 미시작 / 진행 중 / 완료 / 보류 / 실패

---

## Step 0. 프로젝트 부트스트랩

- **상태:** 완료
- **시작:** 2026-05-20 (부트스트랩 세션 시작)
- **완료:** 2026-05-20T17:00:00+09:00
- **참조 문서:** frontend-spec.md §0~§1, backend-spec.md §0~§1, harness.md §3 Step 0 범위, validation.md §1~§2

### 작업 노트

- 2026-05-20 — 최상위 `package.json`(npm workspaces) + `.prettierrc` + `.gitignore` + `.env.example` + `README.md` 생성
- 2026-05-20 — `frontend/` 워크스페이스 부트스트랩 (Vite + React 18 + TypeScript + TailwindCSS + ESLint + Tanstack Query·Zustand·RHF·Zod·date-fns·axios 의존성)
- 2026-05-20 — `backend/` 워크스페이스 부트스트랩 (Express + TypeScript + Prisma client + JWT/bcrypt/zod/multer/morgan/date-fns-tz/express-rate-limit 의존성, Prisma CLI/Vitest/supertest devDeps)
- 2026-05-20 — `npm install` 루트 실행: 의존성 1000+ 개 설치 완료 (몇 분 소요), peer dep 경고는 허용됨
- 2026-05-20 — **이슈 발견:** `node_modules/.bin/` 디렉토리가 생성되지 않음 (Windows OneDrive + 한글 폴더 경로의 알려진 문제). `tsc`, `eslint` 등 바이너리를 PATH에서 찾을 수 없음
- 2026-05-20 — **해결:** 루트 `package.json` scripts에서 `node ./node_modules/typescript/bin/tsc`, `node ./node_modules/eslint/bin/eslint.js` 형태로 노드를 통해 직접 호출하도록 변경. 자식 워크스페이스 scripts는 `npx tsc` → 후속 Step에서 동일 패턴 적용 예정
- 2026-05-20 — **이슈 발견:** ESLint v9는 `.eslintrc.cjs` 인식 안 함. flat config(`eslint.config.mjs`) 요구
- 2026-05-20 — **해결:** `frontend/eslint.config.mjs`, `backend/eslint.config.mjs` 생성 (TypeScript-ESLint + react-hooks 플러그인, ESM 포맷). 기존 `.eslintrc.cjs`는 v9에서 무시되므로 그대로 둠 (후속 Step에서 정리 권장)
- 2026-05-20 — `npm run typecheck` 통과 (frontend/backend 양쪽 0 에러)
- 2026-05-20 — `npm run lint` 통과 (frontend/backend 양쪽 0 에러)

### 변경 파일

**최상위:**
- `package.json` (npm workspaces 설정, typecheck:* / lint:* / format / dev:* scripts. 노드 직접 호출 방식)
- `.prettierrc` (printWidth 100, singleQuote, semi, trailingComma "all", tabWidth 2)
- `.gitignore` (node_modules, dist, build, .env, .env.local, *.log, *.db, *.db-journal, .DS_Store, uploads/)
- `.env.example` (PORT, NODE_ENV, DATABASE_URL, JWT_*, FRONT_ORIGIN, JWT_*_TTL, VITE_API_BASE_URL)
- `README.md`

**frontend/:**
- `package.json` (React 18 + TS + Vite + Tailwind + 상태/폼/날짜/HTTP 의존성)
- `tsconfig.json` (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, jsx react-jsx, paths @/*)
- `tsconfig.node.json` (vite.config.ts용)
- `vite.config.ts` (React 플러그인, port 5173, /api → :4000 프록시, alias @ → ./src)
- `tailwind.config.ts` (content ["./index.html", "./src/**/*.{ts,tsx}"], theme.extend 자리표시자)
- `postcss.config.js` (tailwindcss + autoprefixer)
- `eslint.config.mjs` (ESLint v9 flat config — TS parser/plugin + react-hooks)
- `.eslintrc.cjs` (legacy, v9에서 무시됨 — 잔류 — 후속 Step에서 제거 권장)
- `.env.example` (VITE_API_BASE_URL)
- `index.html` (lang="ko", title "PlanMate")
- `src/main.tsx`, `src/App.tsx` (placeholder — 실제 라우팅·UI는 Step 7~12)
- `src/styles/tailwind.css` (@tailwind base/components/utilities)
- `src/vite-env.d.ts`

**backend/:**
- `package.json` (Express + Prisma client + JWT/bcrypt/zod/multer + dev deps prisma/vitest/supertest)
- `tsconfig.json` (commonjs, strict, noUncheckedIndexedAccess, outDir ./dist, rootDir ./src, paths @/*)
- `eslint.config.mjs` (ESLint v9 flat config — TS parser/plugin)
- `.eslintrc.cjs` (legacy 잔류)
- `.env.example` (PORT=4000, NODE_ENV, DATABASE_URL=file:./prisma/dev.db, JWT_*, FRONT_ORIGIN, JWT_*_TTL)
- `src/server.ts` (placeholder — Step 2에서 Express 앱 초기화)

### 실행 명령어

```bash
npm install
# typecheck + lint
npm run typecheck   # → npm run typecheck:frontend && npm run typecheck:backend
npm run lint        # → npm run lint:frontend && npm run lint:backend
```

내부적으로:
- `node ./node_modules/typescript/bin/tsc -p frontend/tsconfig.json --noEmit`
- `node ./node_modules/typescript/bin/tsc -p backend/tsconfig.json --noEmit`
- `node ./node_modules/eslint/bin/eslint.js --config frontend/eslint.config.mjs frontend --max-warnings=0`
- `node ./node_modules/eslint/bin/eslint.js --config backend/eslint.config.mjs backend --max-warnings=0`

### 검증 결과

- [x] `npm run typecheck:frontend` 통과 (에러 0건)
- [x] `npm run typecheck:backend` 통과 (에러 0건)
- [x] `npm run lint:frontend` 통과 (에러 0건)
- [x] `npm run lint:backend` 통과 (에러 0건)
- [x] `frontend/`, `backend/` 디렉토리 구조 확인
- [x] `.env.example` 파일 루트·frontend·backend에 모두 존재
- [x] validation.md §1 (TypeScript strict 옵션) + §2 (Lint 무경고) 기준 통과

### 남은 문제 / 후속 조치 권고

1. **OneDrive + 한글 경로 이슈 (정보 기록용)** — `node_modules/.bin/` cmd-shim이 생성되지 않아 `tsc`/`eslint` 직접 호출이 불가. 우회로 `node ./node_modules/.../bin/...` 패턴을 root scripts에 적용했음. 자식 워크스페이스 scripts(`frontend/package.json`, `backend/package.json`)는 `npx ...`로 작성되어 있으나 workspace context에서 호출하면 동일 문제가 발생할 수 있음 → 자식 scripts도 같은 패턴으로 통일하는 것이 좋음 (Step 1 진행 중 결정 가능, 차단 아님).
2. **레거시 `.eslintrc.cjs` 잔류** — ESLint v9는 flat config만 사용하므로 무해하지만 향후 혼동 방지를 위해 Step 1 또는 별도 정리 시점에 삭제 권장.
3. **Tailwind 디자인 토큰 미반영** — `tailwind.config.ts`는 자리표시자. PRD §14의 charcoal #21201a, surface #f9f9f7, 카테고리 5색(보라/파랑/빨강/초록/주황) 토큰은 Step 9(메인 페이지) 진입 전 추가 필요.
4. **Prisma 미초기화** — `@prisma/client`와 `prisma` CLI는 설치되었으나 `prisma init`, `schema.prisma` 작성, 마이그레이션 실행은 Step 1 범위.
5. **취약점 점검 미수행** — `npm audit` 결과 미확인. 정보성으로 후속 Step에서 점검 권장.

---

## Step 1. Prisma 스키마 + 마이그레이션 + 시드

- **상태:** 완료
- **시작:** 2026-05-20
- **완료:** 2026-05-20T17:30:00+09:00
- **참조 문서:** data-model.md §2~§7, backend-spec.md §9, design-review.md §6 보완 (DB-01·DB-02·DB-03·DB-14·BE-01)

### 작업 노트

- 2026-05-20 — `backend/package.json` scripts를 Step 0 잔여 정리로 `npx` → `node ../node_modules/<pkg>/bin/...` 직접 호출 패턴으로 통일 (Windows OneDrive + 한글 경로의 cmd-shim 미생성 이슈 회피)
- 2026-05-20 — `prisma:generate`, `prisma:migrate`, `prisma:migrate:deploy`, `prisma:studio`, `db:seed` 5개 scripts 추가 + `prisma.seed` 필드 등록 (Prisma CLI가 자동 호출)
- 2026-05-20 — `backend/prisma/schema.prisma` 작성: User/Category/Plan 3개 모델, datasource SQLite (`file:./dev.db`), generator prisma-client-js
- 2026-05-20 — DB-02·DB-14 보완 적용: 모든 타임스탬프(`createdAt`/`updatedAt`/`deletedAt`)를 `String` 타입으로 정의하고 `@default(now())`·`@updatedAt` 일체 사용 금지 — 애플리케이션에서 `nowKST()` 명시 전달 의무화
- 2026-05-20 — BE-01 보완 적용: `User.refreshTokenHash String?` 컬럼 추가 (Step 3에서 로그인/로그아웃/Refresh 시 사용 예정)
- 2026-05-20 — DB-03 보완 적용: `Category` 모델에 `@@unique([userId, name])` 추가, 동일 사용자 내 카테고리명 중복 금지
- 2026-05-20 — K-09=B 적용: `Plan.category` 관계 `onDelete: SetNull` (카테고리 삭제 시 연결 일정의 `categoryId`만 NULL 처리, 일정 자체는 보존)
- 2026-05-20 — 사용자별 격리: `Plan.user` 및 `Category.user` 관계 모두 `onDelete: Cascade` (사용자 탈퇴 시 본인 데이터 자동 삭제)
- 2026-05-20 — 인덱스 4개 정의: `plans(userId, displayDate)` / `plans(userId, dueDate)` / `plans(userId, isCompleted)` / `plans(deletedAt)` / `categories(userId)`
- 2026-05-20 — `backend/src/utils/dateUtil.ts` 작성: `nowKST()` 헬퍼 (date-fns-tz로 KST ISO 8601 문자열 생성)
- 2026-05-20 — `backend/src/lib/defaultCategories.ts` 작성: 5개 기본 카테고리 상수 `DEFAULT_CATEGORIES` + `createDefaultCategoriesForUser(prisma, userId)` 함수 (upsert 기반 idempotent). Step 3 회원가입 트랜잭션과 시드 모두에서 재사용
- 2026-05-20 — `backend/src/config/prisma.ts` 작성: PrismaClient 싱글톤 + `PRAGMA foreign_keys = ON` 명시 실행 (DB-01 안전 장치)
- 2026-05-20 — `backend/prisma/seed.ts` 작성: 데모 사용자(`demo@planmate.local`) upsert + `createDefaultCategoriesForUser` 호출
- 2026-05-20 — `backend/.env` 생성 (개발용 더미 JWT 시크릿 + DATABASE_URL)
- 2026-05-20 — **이슈:** 초기 시드 시 `bcrypt` 네이티브 바이너리 누락(`napi-v3/bcrypt_lib.node` 미빌드, OneDrive+한글 경로의 node-gyp 빌드 실패 추정)으로 `MODULE_NOT_FOUND` 발생
- 2026-05-20 — **해결:** 시드에서 `bcrypt` import 제거. Step 1의 인증은 범위 외이므로 데모 사용자 `passwordHash`를 placeholder 문자열로 설정 (로그인 불가). 실제 bcrypt 해시는 Step 3(인증 API)에서 처리. bcrypt 네이티브 빌드 문제는 Step 3 진입 전 `npm rebuild bcrypt` 또는 `bcryptjs` 교체 검토 필요 → 남은 문제 1번에 기록
- 2026-05-20 — `prisma migrate dev --name init` 실행: `dev.db` 생성, `migrations/20260520004220_init/migration.sql` 작성, Prisma Client v5.22.0 자동 생성
- 2026-05-20 — 시드 3회 실행(idempotency 검증): 매번 동일 결과(데모 사용자 id=1, 카테고리 5개)
- 2026-05-20 — **이슈:** ESLint 8개 warning (unused `eslint-disable` directives — flat config에 `no-console`·`no-var` 룰 미활성)
- 2026-05-20 — **해결:** `prisma/seed.ts`의 6개, `src/config/prisma.ts`의 2개 disable 주석 모두 제거. lint 0 warning 통과
- 2026-05-20 — `npm run typecheck` 양쪽 통과 / `npm run lint` 양쪽 통과 / 시드 idempotent 동작 확인

### 변경 파일

**backend/**
- `package.json` — scripts를 node 직접 호출로 통일 + Prisma 5개 + db:seed script 추가 + `prisma.seed` 필드 등록
- `.env` — 신규 (개발용 더미 — `.gitignore`에 의해 git 추적 제외)
- `prisma/schema.prisma` — 신규 (User/Category/Plan 모델 + 인덱스 + 관계)
- `prisma/migrations/20260520004220_init/migration.sql` — 신규 (Prisma migrate 자동 생성)
- `prisma/migrations/migration_lock.toml` — 신규 (provider="sqlite")
- `prisma/seed.ts` — 신규 (데모 사용자 + 5개 카테고리 idempotent 시드)
- `prisma/dev.db` — 신규 (SQLite DB 파일, `.gitignore`에 의해 git 제외)
- `src/utils/dateUtil.ts` — 신규 (`nowKST()` 헬퍼)
- `src/lib/defaultCategories.ts` — 신규 (5개 기본 카테고리 + `createDefaultCategoriesForUser`)
- `src/config/prisma.ts` — 신규 (PrismaClient 싱글톤 + PRAGMA FK ON)

**Prisma Client 자동 생성:** `node_modules/@prisma/client/` (자동 — git 제외)

### 실행 명령어

```bash
# scripts 정리 후 마이그레이션 실행
cd backend
node ../node_modules/prisma/build/index.js migrate dev --name init --skip-seed

# 시드 실행 (idempotent 검증을 위해 3회 반복)
node ../node_modules/tsx/dist/cli.mjs prisma/seed.ts
node ../node_modules/tsx/dist/cli.mjs prisma/seed.ts
node ../node_modules/tsx/dist/cli.mjs prisma/seed.ts

# 루트에서 통합 검증
cd ..
npm run typecheck
npm run lint
```

대안 (workspace script로 호출):
- `node ../node_modules/tsx/dist/cli.mjs prisma/seed.ts` ↔ `npm --workspace backend run db:seed`
- `node ../node_modules/prisma/build/index.js migrate dev --name init` ↔ `npm --workspace backend run prisma:migrate -- --name init`

### 검증 결과

- [x] `prisma migrate dev` 성공 — `dev.db` 생성, `20260520004220_init` 마이그레이션 적용
- [x] Prisma Client 생성 확인 — v5.22.0, `node_modules/@prisma/client`
- [x] 시드 실행 가능 — 1차 실행 시 데모 사용자 + 5개 카테고리 모두 INSERT
- [x] 시드 idempotency — 3회 반복 실행 시 동일 결과 (upsert 동작), 중복 생성 없음
- [x] 5개 카테고리 색상 HEX 정확성 — 미팅 #7C3AED · 과제 #2563EB · 시험 #DC2626 · 개인 일정 #16A34A · 약속 #EA580C
- [x] `users` 테이블에 `refresh_token_hash` 컬럼 존재 (BE-01)
- [x] `categories` 테이블 `@@unique([userId, name])` 적용 (DB-03)
- [x] `plans` 테이블 `deletedAt`, `displayDate`, `isRemind` 컬럼 존재 (K-07=B, K-10=B)
- [x] 모든 타임스탬프 컬럼에 `@default(now())`·`@updatedAt` 없음 — 애플리케이션 `nowKST()` 명시 전달 강제 (DB-02·DB-14)
- [x] data-model.md §2~§4 정의와 실제 schema.prisma 일치
- [x] `npm run typecheck` 통과 (frontend/backend 양쪽 0 에러)
- [x] `npm run lint` 통과 (frontend/backend 양쪽 0 에러/warning)

### 생성된 Prisma 모델 요약

| 모델 | 주요 컬럼 | 관계 (onDelete) | 인덱스/제약 |
|---|---|---|---|
| `User` | `id` (Int, PK auto), `email` (unique), `passwordHash`, `nickname`, `avatarUrl?`, `refreshTokenHash?`, `createdAt`, `updatedAt` | `plans User→Plan[]`, `categories User→Category[]` | `email @unique` |
| `Category` | `id`, `userId` (FK), `name`, `color` (HEX), `sortOrder`, `createdAt`, `updatedAt` | `user User (Cascade)`, `plans Category→Plan[]` | `@@unique([userId, name])`, `@@index([userId])` |
| `Plan` | `id`, `userId`, `title`, `dueDate`, `dueTime?`, `displayDate`, `categoryId?`, `priority` (default `"normal"`), `memo?`, `isCompleted`, `isRemind`, `createdAt`, `updatedAt`, `deletedAt?` | `user User (Cascade)`, `category Category? (SetNull)` | `@@index([userId, displayDate])`, `@@index([userId, dueDate])`, `@@index([userId, isCompleted])`, `@@index([deletedAt])` |

### 생성된 기본 카테고리 목록 (DB-03 + K-03=A)

| sortOrder | name | color | 색상 설명 |
|---|---|---|---|
| 1 | 미팅 | `#7C3AED` | 보라 |
| 2 | 과제 | `#2563EB` | 파랑 |
| 3 | 시험 | `#DC2626` | 빨강 |
| 4 | 개인 일정 | `#16A34A` | 초록 |
| 5 | 약속 | `#EA580C` | 주황 |

회원가입 트랜잭션(Step 3)과 시드 모두 `createDefaultCategoriesForUser(prisma, userId)` 함수를 재사용하므로 정의가 일관됨.

### 남은 문제

1. **`bcrypt` 네이티브 바이너리 빌드 실패** — 시드에서 임시로 bcrypt 사용을 제거하여 우회. Step 3 진입 전 다음 중 하나 처리 필요:
   - (A) `cd backend && node ../node_modules/npm/bin/npm-cli.js rebuild bcrypt` — node-gyp 재빌드 시도 (Windows 빌드 도구 필요)
   - (B) `bcrypt` → `bcryptjs`(순수 JS, 동일 API) 교체 — 의존성 변경, 코드 영향 적음
   - (C) `argon2` 등 다른 해싱 알고리즘 채택 — backend-spec.md 수정 필요
   - **권장:** B안. design-review.md §5에 PRD/spec 수정 필요 항목으로 추가 권고.
2. **데모 사용자 비밀번호 placeholder** — Step 1 시드의 `demo@planmate.local`은 `passwordHash = "seeded-not-for-login"`이라 로그인 불가. Step 3 회원가입 흐름이 구현된 후 (1) 정식 가입으로 재생성하거나 (2) 시드를 bcrypt(bcryptjs)로 보강해야 함.
3. **레거시 `.eslintrc.cjs` 잔류** — Step 0 잔여. 양쪽 워크스페이스에 무해하지만 후속 정리 권장.
4. **Tailwind 디자인 토큰 미적용** — Step 0 잔여. Step 9 진입 전 처리 예정.
5. **마이그레이션 이름 형식** — Step 0 가이드는 `yyyymmdd_<change>`(예: `20260520_init`)였으나, Prisma CLI는 기본 `--name` 인자 앞에 자동으로 yyyyMMddHHmmss를 붙여 `20260520004220_init`로 생성. 가이드와 다른 형식이지만 Prisma 기본 동작이므로 그대로 수용 (data-model.md §8 명명 규칙 보완 권고 — 영향 없음).

### 다음 Step에서 해야 할 일 (Step 2 — 공통 미들웨어 + AppError 계층)

- **사전 정리 (선택):**
  - bcrypt 빌드 문제 해결(위 남은 문제 1번) — Step 3 직전 처리해도 됨
- **Step 2 본 작업 (harness.md §3 Step 2 범위):**
  - `backend/src/middlewares/` 디렉토리 신설
  - `authMiddleware.ts` — Authorization 헤더 검증, JWT 디코딩, `req.user` 주입, 401 에러
  - `errorHandler.ts` — 전역 에러 핸들러 (AppError → 표준 응답, Zod 에러 → 422, Prisma 에러 매핑)
  - `validate.ts` — `validate(schema, target)` 미들웨어 (body/query/params 검증)
  - `requestLogger.ts` — morgan + 커스텀 포맷
  - `rateLimit.ts` — 인증 엔드포인트 5req/min/IP
  - `backend/src/utils/errors.ts` — AppError, AuthError, ForbiddenError, NotFoundError, ConflictError, ValidationError 계층
  - `backend/src/utils/jwt.ts` — `generateAccessToken`, `generateRefreshToken`, `verifyAccess`, `verifyRefresh`
  - 단위 테스트(Vitest)로 미들웨어 동작 검증
- **검증:**
  - `npm run typecheck` 통과
  - `npm run lint` 통과
  - 각 미들웨어 단위 테스트 통과 (Vitest)
  - validation.md §3 (백엔드 API 검증) 기준 중 미들웨어 관련 항목 통과

---

## Step 2. 공통 미들웨어 + AppError 계층

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** backend-spec.md §3·§4, api-spec.md §2, design-review.md BE-05

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `backend/src/middlewares/authMiddleware.ts`
- 예시: `backend/src/middlewares/errorHandler.ts`
- 예시: `backend/src/middlewares/validate.ts`
- 예시: `backend/src/middlewares/requestLogger.ts`
- 예시: `backend/src/middlewares/rateLimiter.ts`
- 예시: `backend/src/utils/errors.ts`
- 예시: `backend/src/utils/jwt.ts`
- 예시: `backend/src/utils/password.ts`
- 예시: `backend/src/types/express.d.ts`
- 예시: `backend/src/types/api.ts`
- 예시: `backend/src/config/env.ts`
- 예시: `backend/src/app.ts`
- 예시: `backend/src/server.ts`
- 예시: `backend/tests/unit/middlewares/authMiddleware.test.ts`
- 예시: `backend/tests/unit/middlewares/errorHandler.test.ts`

### 실행 명령어

(완료 시 채움)

- 예시: `cd backend && npm run test`
- 예시: `cd backend && npm run typecheck`

### 검증 결과

- [ ] authMiddleware 단위 테스트 통과 (토큰 없음·만료·서명 오류 케이스)
- [ ] errorHandler 단위 테스트 통과 (AppError → 표준 응답 포맷 변환)
- [ ] validate 미들웨어 단위 테스트 통과 (Zod 스키마 검증 실패 → 422)
- [ ] rateLimiter 5req/min/IP 동작 확인
- [ ] AppError 계층 클래스 정의 완료 (AuthError, ValidationError, NotFoundError 등)
- [ ] api-spec.md §2 공통 에러 코드 표 전체 구현 확인
- [ ] validation.md §1·§2 기준 통과

### 남은 문제

- 없음

---

## Step 3. 인증 API 5개

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** api-spec.md §3, backend-spec.md §5, design-review.md BE-01·BE-02·BE-12

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `backend/src/routes/auth.route.ts`
- 예시: `backend/src/controllers/auth.controller.ts`
- 예시: `backend/src/services/auth.service.ts`
- 예시: `backend/src/repositories/user.repository.ts`
- 예시: `backend/src/schemas/auth.schema.ts`
- 예시: `backend/tests/integration/auth.test.ts`

### 실행 명령어

(완료 시 채움)

- 예시: `cd backend && npm run test -- auth`
- 예시: `cd backend && npm run typecheck`

### 검증 결과

- [ ] POST /auth/register → 201, categories 5건 동시 INSERT 확인
- [ ] POST /auth/login → 200, Set-Cookie refresh_token(HttpOnly, Path=/api/v1/auth) 확인
- [ ] POST /auth/login → users.refresh_token_hash DB 저장 확인 (bcrypt prefix $2b$12$)
- [ ] POST /auth/refresh → 200, 새 accessToken + 새 Set-Cookie 확인 (Token Rotation)
- [ ] POST /auth/refresh 재사용 → 401 AUTH_INVALID_TOKEN + DB refresh_token_hash=NULL 확인
- [ ] POST /auth/logout → 200, Set-Cookie Max-Age=0, DB refresh_token_hash=NULL 확인
- [ ] GET /auth/me → 200, 사용자 정보 반환 확인
- [ ] 중복 이메일 register → 409 EMAIL_ALREADY_EXISTS
- [ ] 잘못된 비밀번호 login → 401 AUTH_INVALID_CREDENTIALS
- [ ] Rate Limit 초과 → 429 TOO_MANY_REQUESTS
- [ ] supertest 통합 테스트 전체 통과 (회원가입→로그인→refresh→me→logout 시나리오)
- [ ] validation.md §3-1·§7 기준 통과

### 남은 문제

- 없음

---

## Step 4. 일정 API 6개

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** api-spec.md §4, backend-spec.md §8-1~§8-3, data-model.md §4, design-review.md BE-03·BE-04·DB-06·DB-07·DB-12

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `backend/src/routes/plans.route.ts`
- 예시: `backend/src/controllers/plans.controller.ts`
- 예시: `backend/src/services/plans.service.ts`
- 예시: `backend/src/repositories/plan.repository.ts`
- 예시: `backend/src/schemas/plan.schema.ts`
- 예시: `backend/tests/integration/plans.test.ts`

### 실행 명령어

(완료 시 채움)

- 예시: `cd backend && npm run test -- plans`
- 예시: `cd backend && npm run typecheck`

### 검증 결과

- [ ] GET /plans → 200, 서버 고정 정렬 순서 확인 (is_completed→priority→due_time→created_at)
- [ ] GET /plans?month=2026-05 → display_date 기준 월 필터 동작 확인
- [ ] GET /plans?search=키워드 → title+memo LIKE 검색 동작 확인
- [ ] GET /plans?category=1&category=2 → OR 필터 동작 확인
- [ ] GET /plans?uncategorized=1 → category_id IS NULL 필터 확인
- [ ] POST /plans → 201, display_date≤due_date 정상 케이스 통과
- [ ] POST /plans (display_date > due_date) → 422, details 배열에 display_date 에러 포함
- [ ] GET /plans/:id (타인 ID) → 404 PLAN_NOT_FOUND (격리 확인)
- [ ] PATCH /plans/:id → 200, updated_at KST 갱신 확인
- [ ] DELETE /plans/:id → 204, DB deleted_at 채워짐 확인
- [ ] DELETE 후 GET /plans → 목록에서 제외 확인
- [ ] PATCH /plans/:id/complete → is_completed 토글 확인
- [ ] 모든 쿼리에 where: { userId } 조건 포함 확인 (코드 리뷰)
- [ ] supertest 통합 테스트 전체 통과
- [ ] validation.md §3-2·§8 기준 통과

### 남은 문제

- 없음

---

## Step 5. 카테고리 API 4개

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** api-spec.md §5, backend-spec.md §8-4, data-model.md §3, design-review.md DB-03·DB-09

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `backend/src/routes/categories.route.ts`
- 예시: `backend/src/controllers/categories.controller.ts`
- 예시: `backend/src/services/categories.service.ts`
- 예시: `backend/src/repositories/category.repository.ts`
- 예시: `backend/src/schemas/category.schema.ts`
- 예시: `backend/tests/integration/categories.test.ts`

### 실행 명령어

(완료 시 채움)

- 예시: `cd backend && npm run test -- categories`
- 예시: `cd backend && npm run typecheck`

### 검증 결과

- [ ] GET /categories → 200, sort_order 오름차순 반환 확인
- [ ] POST /categories → 201, (userId, name) UNIQUE 제약 동작 확인
- [ ] POST /categories (중복명) → 409 CATEGORY_NAME_ALREADY_EXISTS (Prisma P2002 → AppError 변환)
- [ ] PUT /categories/:id → 200, name·color·sort_order 전체 교체 확인
- [ ] PUT /categories/:id (다른 카테고리와 동일명) → 409 CATEGORY_NAME_ALREADY_EXISTS
- [ ] DELETE /categories/:id → 204
- [ ] DELETE 후 연결 plans.category_id = NULL 확인 (DB 직접 조회)
- [ ] PRAGMA foreign_keys = ON 없을 경우 SET NULL 미동작 → 활성화 상태 재확인
- [ ] 타인 소유 category_id로 PUT/DELETE → 404 CATEGORY_NOT_FOUND
- [ ] supertest 통합 테스트 전체 통과
- [ ] validation.md §3-3·§4 기준 통과

### 남은 문제

- 없음

---

## Step 6. 프로필 API 4개

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** api-spec.md §6, backend-spec.md §8-5, screen-flow.md §10, PRD §40 U-06

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `backend/src/routes/profile.route.ts`
- 예시: `backend/src/controllers/profile.controller.ts`
- 예시: `backend/src/services/profile.service.ts`
- 예시: `backend/src/middlewares/upload.ts`
- 예시: `backend/src/schemas/profile.schema.ts`
- 예시: `backend/uploads/.gitkeep`
- 예시: `backend/tests/integration/profile.test.ts`

### 실행 명령어

(완료 시 채움)

- 예시: `cd backend && npm run test -- profile`
- 예시: `cd backend && npm run typecheck`

### 검증 결과

- [ ] GET /profile → 200, 현재 사용자 정보 반환
- [ ] PATCH /profile → 200, nickname 수정 + updated_at 갱신 확인
- [ ] PATCH /profile/password → 200, 현재 비밀번호 검증 통과
- [ ] PATCH /profile/password (현재 비밀번호 오류) → 401 또는 422
- [ ] 비밀번호 변경 후 기존 비밀번호 로그인 → 401 AUTH_INVALID_CREDENTIALS
- [ ] POST /profile/avatar (jpg, 1MB) → 200, avatarUrl 반환, uploads/avatars/ 파일 존재 확인
- [ ] POST /profile/avatar (5MB 초과) → 400 FILE_TOO_LARGE
- [ ] POST /profile/avatar (허용 외 형식) → 400 INVALID_FILE_TYPE
- [ ] supertest 통합 테스트 전체 통과
- [ ] validation.md §3-4 기준 통과

### 남은 문제

- 없음

---

## Step 7. 프론트엔드 라우팅 골격 + httpClient

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** frontend-spec.md §2·§5·§7-1, screen-flow.md §12, design-review.md FE-12

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `frontend/src/routes/index.tsx`
- 예시: `frontend/src/routes/ProtectedRoute.tsx`
- 예시: `frontend/src/lib/api/httpClient.ts`
- 예시: `frontend/src/features/auth/stores/authStore.ts`
- 예시: `frontend/src/features/auth/hooks/useAuth.ts`
- 예시: `frontend/src/components/ui/Spinner.tsx`
- 예시: `frontend/tests/unit/httpClient.test.ts`
- 예시: `frontend/tests/unit/authStore.test.ts`

### 실행 명령어

(완료 시 채움)

- 예시: `cd frontend && npm run test`
- 예시: `cd frontend && npm run typecheck`

### 검증 결과

- [ ] 비로그인 상태에서 `/` 접근 → `/login` 리다이렉트 확인
- [ ] 비로그인 상태에서 `/plans/new` 접근 → `/login` 리다이렉트 확인
- [ ] 비로그인 상태에서 `/profile` 접근 → `/login` 리다이렉트 확인
- [ ] 로그인 상태에서 `/login` 접근 → `/` 리다이렉트 확인
- [ ] httpClient 인터셉터: 401 → refresh 호출 → 원 요청 재시도 단위 테스트 통과
- [ ] httpClient 인터셉터: refresh 실패 → 강제 로그아웃 + `/login` 리다이렉트 확인
- [ ] authStore: user·accessToken·isAuthenticated 상태 관리 단위 테스트 통과
- [ ] `refresh_token` 쿠키 클라이언트 JS 접근 코드 없음 확인 (코드 리뷰)
- [ ] validation.md §7 기준 통과

### 남은 문제

- 없음

---

## Step 8. 로그인/회원가입 페이지

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** wireframe-spec.md §1·§2, screen-flow.md §1, api-spec.md §3, design-review.md FE-09

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `frontend/src/pages/LoginPage.tsx`
- 예시: `frontend/src/pages/AuthPage.tsx`
- 예시: `frontend/src/features/auth/components/LoginForm.tsx`
- 예시: `frontend/src/features/auth/components/RegisterForm.tsx`
- 예시: `frontend/src/features/auth/schemas/login.schema.ts`
- 예시: `frontend/src/features/auth/schemas/register.schema.ts`
- 예시: `frontend/src/features/auth/api/login.ts`
- 예시: `frontend/src/features/auth/api/register.ts`
- 예시: `frontend/src/features/auth/api/logout.ts`
- 예시: `frontend/src/features/auth/api/refresh.ts`
- 예시: `frontend/src/features/auth/hooks/useLogin.ts`
- 예시: `frontend/src/features/auth/hooks/useRegister.ts`
- 예시: `frontend/src/features/auth/hooks/useLogout.ts`
- 예시: `frontend/src/components/ui/Button.tsx`
- 예시: `frontend/src/components/ui/Input.tsx`
- 예시: `frontend/src/components/ui/Toast.tsx`
- 예시: `frontend/tests/unit/auth/LoginForm.test.tsx`
- 예시: `frontend/tests/unit/auth/RegisterForm.test.tsx`

### 실행 명령어

(완료 시 채움)

- 예시: `cd frontend && npm run test -- auth`
- 예시: `cd frontend && npm run typecheck`

### 검증 결과

- [ ] 회원가입 폼: 닉네임·이메일·비밀번호·비밀번호 확인 필드 존재 확인
- [ ] 회원가입 Zod 검증: 이메일 형식 오류, 비밀번호 8자 미만, 비밀번호 불일치 에러 메시지 표시
- [ ] 회원가입 성공 → /login 이동 확인
- [ ] 로그인 폼: 이메일·비밀번호 필드 존재 확인
- [ ] 로그인 성공 → / 메인 이동 확인
- [ ] 로그인 실패 → 에러 토스트 표시 확인
- [ ] 비밀번호 찾기 링크 미표시 확인 (FE-09 결정: 초기 버전 hidden)
- [ ] RTL LoginForm 단위 테스트 통과
- [ ] RTL RegisterForm 단위 테스트 통과
- [ ] 브라우저 수동 확인: 회원가입→로그인→메인 전체 흐름
- [ ] validation.md §7 기준 통과 (Playwright P-01 일부)

### 남은 문제

- 없음

---

## Step 9. 메인 페이지 (캘린더·주간·오늘 + 상세 모달)

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** wireframe-spec.md §3·§5, frontend-spec.md §3-3, screen-flow.md §2·§4·§5, design-review.md FE-07·FE-11·FE-12, PRD §22·§23·§24

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `frontend/src/pages/MainPage.tsx`
- 예시: `frontend/src/features/calendar/components/MonthlyCalendar.tsx`
- 예시: `frontend/src/features/calendar/components/CalendarCell.tsx`
- 예시: `frontend/src/features/calendar/components/CalendarHeader.tsx`
- 예시: `frontend/src/features/calendar/components/CalendarDayPopup.tsx`
- 예시: `frontend/src/features/calendar/hooks/useCalendar.ts`
- 예시: `frontend/src/features/calendar/stores/calendarStore.ts`
- 예시: `frontend/src/features/plans/components/WeeklyPlanBar.tsx`
- 예시: `frontend/src/features/plans/components/TodayPlanList.tsx`
- 예시: `frontend/src/features/plans/components/PlanCard.tsx`
- 예시: `frontend/src/features/plans/components/PlanDetailModal.tsx`
- 예시: `frontend/src/features/plans/components/CreatePlanFAB.tsx`
- 예시: `frontend/src/features/plans/api/getPlans.ts`
- 예시: `frontend/src/features/plans/api/getPlan.ts`
- 예시: `frontend/src/features/plans/api/completePlan.ts`
- 예시: `frontend/src/features/plans/hooks/usePlans.ts`
- 예시: `frontend/src/features/plans/hooks/usePlan.ts`
- 예시: `frontend/src/features/plans/hooks/useCompletePlan.ts`
- 예시: `frontend/src/features/plans/stores/planStore.ts`
- 예시: `frontend/src/components/ui/Modal.tsx`
- 예시: `frontend/src/components/ui/Checkbox.tsx`
- 예시: `frontend/src/components/ui/Badge.tsx`
- 예시: `frontend/src/components/ui/FAB.tsx`
- 예시: `frontend/src/components/ui/Avatar.tsx`
- 예시: `frontend/src/components/ui/Chip.tsx`
- 예시: `frontend/e2e/main.spec.ts`

### 실행 명령어

(완료 시 채움)

- 예시: `cd frontend && npm run test -- calendar`
- 예시: `cd frontend && npx playwright test main.spec.ts`
- 예시: `cd frontend && npm run typecheck`

### 검증 결과

- [ ] 메인 페이지 섹션 순서: 캘린더 → 주간 → 오늘 (K-05=B)
- [ ] 월간 캘린더 6×7 격자 렌더링 확인
- [ ] 이전/다음 월 이동 정상 동작
- [ ] 캘린더 날짜 셀 클릭 → CalendarDayPopup 표시 확인
- [ ] PlanCard 클릭 → URL `?planId=X` 추가 + PlanDetailModal 오픈 확인
- [ ] PlanDetailModal 닫기 → URL에서 planId 제거 확인
- [ ] planStore에 planDetailId 상태 없음 확인 (URL이 SSoT, K-08=B)
- [ ] 완료 토글: 낙관적 업데이트 (즉시 중간줄+회색), API 성공 후 목록 최하위 이동
- [ ] 완료 토글: API 실패 시 롤백 + 에러 토스트 확인
- [ ] D-Day 배지 표시 조건 확인 (D-Day/D-1/D-3/마감 지남/날짜 문자열)
- [ ] 카테고리 색상 점 표시 (컬러풀 5색, 그레이스케일 금지)
- [ ] 오늘 할 일 빈 상태 메시지 표시 확인
- [ ] Playwright P-01 시나리오 통과
- [ ] Playwright P-03 시나리오 통과 (상세 모달 URL 연동)
- [ ] Playwright P-04 시나리오 통과 (완료 토글 낙관적 업데이트)
- [ ] validation.md §5·§10 기준 통과

### 남은 문제

- 없음

---

## Step 10. 할 일 등록/수정 페이지

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** wireframe-spec.md §4·§5, screen-flow.md §3·§5, design-review.md FE-06·FE-10, PRD §26

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `frontend/src/pages/PlanCreatePage.tsx`
- 예시: `frontend/src/features/plans/components/PlanForm.tsx`
- 예시: `frontend/src/features/plans/api/createPlan.ts`
- 예시: `frontend/src/features/plans/api/updatePlan.ts`
- 예시: `frontend/src/features/plans/api/deletePlan.ts`
- 예시: `frontend/src/features/plans/hooks/useCreatePlan.ts`
- 예시: `frontend/src/features/plans/hooks/useUpdatePlan.ts`
- 예시: `frontend/src/features/plans/hooks/useDeletePlan.ts`
- 예시: `frontend/src/features/plans/schemas/plan.schema.ts`
- 예시: `frontend/src/components/ui/ConfirmModal.tsx`
- 예시: `frontend/src/components/ui/Textarea.tsx`
- 예시: `frontend/tests/unit/PlanForm.test.tsx`
- 예시: `frontend/e2e/plan-create.spec.ts`

### 실행 명령어

(완료 시 채움)

- 예시: `cd frontend && npm run test -- PlanForm`
- 예시: `cd frontend && npx playwright test plan-create.spec.ts`
- 예시: `cd frontend && npm run typecheck`

### 검증 결과

- [ ] 등록 폼: title·due_date·due_time·display_date·category·priority·memo·is_remind 필드 존재 확인
- [ ] 등록 시 display_date 초기값 = due_date 자동 설정 확인 (사용자 변경 가능)
- [ ] display_date > due_date 입력 → 저장 불가 + 에러 메시지 표시
- [ ] 카테고리 칩 색상 (컬러풀 5색) 표시 확인
- [ ] 중요도 칩: 높음(빨강)/보통(노랑)/낮음(초록) 색상 표시 확인 (PRD §14-2)
- [ ] 저장 클릭 → 저장 확인 모달 → 확인 → / 복귀
- [ ] 취소 클릭 → 취소 확인 모달 (FE-06 결정)
- [ ] 헤더 ← 클릭 → 취소 확인 모달 (FE-06 결정: 취소 버튼과 동일 동작)
- [ ] 수정 모드: PlanDetailModal 내 인라인 편집 전환 (별도 페이지 이동 없음)
- [ ] 삭제 후 목록에서 즉시 제거 확인 (soft delete)
- [ ] RTL PlanForm 단위 테스트 통과
- [ ] Playwright P-02 시나리오 통과
- [ ] validation.md §8 기준 통과

### 남은 문제

- 없음

---

## Step 11. 프로필 페이지 + 카테고리 관리

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** wireframe-spec.md §6·§7, screen-flow.md §10, api-spec.md §5·§6, design-review.md DB-03

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `frontend/src/pages/ProfilePage.tsx`
- 예시: `frontend/src/features/categories/components/CategoryChip.tsx`
- 예시: `frontend/src/features/categories/components/CategoryList.tsx`
- 예시: `frontend/src/features/categories/components/CategoryFormModal.tsx`
- 예시: `frontend/src/features/categories/api/getCategories.ts`
- 예시: `frontend/src/features/categories/api/createCategory.ts`
- 예시: `frontend/src/features/categories/api/updateCategory.ts`
- 예시: `frontend/src/features/categories/api/deleteCategory.ts`
- 예시: `frontend/src/features/categories/hooks/useCategories.ts`
- 예시: `frontend/src/features/categories/hooks/useCreateCategory.ts`
- 예시: `frontend/src/features/categories/hooks/useUpdateCategory.ts`
- 예시: `frontend/src/features/categories/hooks/useDeleteCategory.ts`
- 예시: `frontend/src/features/categories/schemas/category.schema.ts`
- 예시: `frontend/src/features/profile/components/ProfileForm.tsx`
- 예시: `frontend/src/features/profile/components/PasswordForm.tsx`
- 예시: `frontend/src/features/profile/components/AvatarUpload.tsx`
- 예시: `frontend/src/features/profile/api/getProfile.ts`
- 예시: `frontend/src/features/profile/api/updateProfile.ts`
- 예시: `frontend/src/features/profile/api/changePassword.ts`
- 예시: `frontend/src/features/profile/api/uploadAvatar.ts`
- 예시: `frontend/src/features/profile/hooks/useProfile.ts`
- 예시: `frontend/src/features/profile/hooks/useUpdateProfile.ts`
- 예시: `frontend/src/features/profile/hooks/useChangePassword.ts`
- 예시: `frontend/src/features/profile/hooks/useUploadAvatar.ts`
- 예시: `frontend/src/features/profile/schemas/profile.schema.ts`
- 예시: `frontend/src/features/profile/schemas/password.schema.ts`
- 예시: `frontend/tests/unit/categories/CategoryFormModal.test.tsx`
- 예시: `frontend/tests/unit/profile/ProfileForm.test.tsx`
- 예시: `frontend/e2e/profile.spec.ts`

### 실행 명령어

(완료 시 채움)

- 예시: `cd frontend && npm run test -- profile`
- 예시: `cd frontend && npx playwright test profile.spec.ts`
- 예시: `cd frontend && npm run typecheck`

### 검증 결과

- [ ] 카테고리 목록 표시 (sort_order 순)
- [ ] 카테고리 추가 모달: 이름·색상 입력 → 저장 → 목록 추가 확인
- [ ] 중복 카테고리명 입력 → 409 에러 Toast 표시 확인
- [ ] 카테고리 수정: PUT /api/v1/categories/:id (전체 교체, name·color·sort_order 필수)
- [ ] 카테고리 삭제 → 삭제 확인 모달 → 삭제 → 연결 일정 "미분류" 표시 확인 (K-09=B)
- [ ] 카테고리 색상 선택기: 허용 HEX 형식 검증 (Zod `z.string().regex(/^#[0-9A-Fa-f]{6}$/)`)
- [ ] 닉네임 수정 → 2~20자, 공백 불가 검증
- [ ] 비밀번호 변경 → 현재 비밀번호 검증 + 새 비밀번호 8자 이상 검증
- [ ] 아바타 업로드 → 이미지 표시 갱신 확인
- [ ] Playwright P-06 시나리오 통과 (카테고리 CRUD)
- [ ] validation.md §3-3·§3-4 기준 통과

### 남은 문제

- 없음

---

## Step 12. 검색·필터 + 빈 상태 + Playwright E2E

- **상태:** 미시작
- **시작:** -
- **완료:** -
- **참조 문서:** screen-flow.md §8·§9, design-review.md FE-02·FE-03, validation.md §6 (P-01~P-08)

### 작업 노트

(시작 후 시간순으로 한 줄씩 추가)

### 변경 파일

(완료 시 채움)

- 예시: `frontend/src/components/ui/SearchBar.tsx`
- 예시: `frontend/src/features/plans/components/PlanFilterBar.tsx`
- 예시: `frontend/src/features/plans/components/SearchResultList.tsx`
- 예시: `frontend/src/components/ui/EmptyState.tsx`
- 예시: `frontend/src/components/ui/ErrorBoundary.tsx`
- 예시: `frontend/playwright.config.ts`
- 예시: `frontend/e2e/search.spec.ts`
- 예시: `frontend/e2e/filter.spec.ts`
- 예시: `frontend/e2e/auth-flow.spec.ts`
- 예시: `frontend/e2e/token-refresh.spec.ts`
- 예시: `frontend/e2e/logout.spec.ts`
- 예시: `frontend/e2e/category.spec.ts`
- 예시: `frontend/e2e/complete-toggle.spec.ts`
- 예시: `frontend/tests/unit/SearchResultList.test.tsx`
- 예시: `frontend/tests/unit/PlanFilterBar.test.tsx`

### 실행 명령어

(완료 시 채움)

- 예시: `cd frontend && npm run test`
- 예시: `cd frontend && npx playwright test --reporter=html`
- 예시: `cd frontend && npm run typecheck`
- 예시: `cd backend && npm run test`
- 예시: `cd backend && npm run typecheck`

### 검증 결과

- [ ] 검색바 debounce 300ms 동작 확인
- [ ] 검색어 입력 → 캘린더·주간 바 hidden + SearchResultList 표시 확인
- [ ] 검색어 삭제 → 메인 레이아웃 복귀 확인
- [ ] 검색 결과: 전체 기간 대상 (월 필터 없음) 확인
- [ ] 검색 결과 없음 → EmptyState "검색 결과가 없습니다" 표시
- [ ] PlanFilterBar: 카테고리·중요도·완료 여부 칩 표시 및 선택 상태 표시
- [ ] 필터 복합 조건 동작 확인 (카테고리 OR + 중요도 OR + 완료 여부 AND)
- [ ] 필터 초기화 버튼 동작 확인
- [ ] 미분류 필터(`uncategorized=1`) 동작 확인
- [ ] ErrorBoundary: API 실패 시 에러 화면 표시
- [ ] Playwright P-01 통과 (회원가입→로그인→메인)
- [ ] Playwright P-02 통과 (일정 등록)
- [ ] Playwright P-03 통과 (상세 모달)
- [ ] Playwright P-04 통과 (완료 토글)
- [ ] Playwright P-05 통과 (검색 모드)
- [ ] Playwright P-06 통과 (카테고리 커스터마이징)
- [ ] Playwright P-07 통과 (토큰 갱신)
- [ ] Playwright P-08 통과 (로그아웃)
- [ ] `cd frontend && npm run test` 전체 통과
- [ ] `cd backend && npm run test` 전체 통과
- [ ] 임시 코드(console.log, TODO, HACK, debugger) 0건 확인
- [ ] validation.md §6 P-01~P-08 전체 기준 통과

### 남은 문제

- 없음

---

## 변경 이력 (Changelog)

| 날짜 | 내용 |
|---|---|
| 2026-05-20 | 초기 progress.md 생성 (harness.md·validation.md와 함께 docs/05-harness/ 배치) |
| 2026-05-20T17:00:00+09:00 | **Step 0 완료** — frontend/backend 워크스페이스 부트스트랩, ESLint v9 flat config, OneDrive+한글 경로 우회(node 직접 호출), typecheck/lint 통과 |
| 2026-05-20T17:30:00+09:00 | **Step 1 완료** — Prisma schema(User/Category/Plan) + init 마이그레이션 + dev.db + 5개 기본 카테고리 idempotent 시드. DB-01/02/03/14·BE-01·K-02=B·K-03=A·K-09=B 모두 반영 |

---

## 남은 문제 (전역)

1. **[Step 3 차단 가능성] `bcrypt` 네이티브 바이너리 미빌드** — Step 1 시드 중 발견. OneDrive+한글 경로의 node-gyp 빌드 실패 추정. Step 3(인증) 진입 전 다음 중 하나 결정 필요:
   - (권장) `bcryptjs`(순수 JS)로 교체 — backend-spec.md §6 비밀번호 해싱 정책 보강 필요
   - `npm rebuild bcrypt` 시도 (Windows 빌드 도구 필요)
   - `argon2` 등 다른 알고리즘 채택
   - 임시 우회: 시드는 placeholder 해시 사용 중 (`prisma/seed.ts`)
2. **[Step 3 후속] 데모 사용자 비밀번호 placeholder** — `demo@planmate.local`이 placeholder 해시로 로그인 불가. Step 3 회원가입 흐름 구현 후 (1) 정식 가입으로 재생성 또는 (2) 시드를 bcrypt(bcryptjs)로 보강.
3. **[Step 0 잔여, 비차단] 레거시 `.eslintrc.cjs` 잔류** — `frontend/.eslintrc.cjs`, `backend/.eslintrc.cjs`. ESLint v9는 무시하지만 향후 혼동 방지를 위해 정리 권장.
4. **[Step 9 차단 후보, 사전 준비] Tailwind 디자인 토큰 자리표시자** — `frontend/tailwind.config.ts`의 `theme.extend` 비어있음. Step 9 진입 전 PRD §14의 charcoal #21201a, surface #f9f9f7, 카테고리 5색(보라/파랑/빨강/초록/주황) 토큰 추가 필요.
5. **[비차단, 정보] 마이그레이션 이름 형식 차이** — data-model.md §8은 `yyyymmdd_<change>`를 권장하나 Prisma CLI는 자동으로 `yyyyMMddHHmmss_<change>` 형식 사용 (현재 `20260520004220_init`). 영향 없음 — 데이터 모델 문서 보완만 권고.

---

## 사용자 결정 대기 항목

| 항목 | 내용 | 관련 문서 |
|---|---|---|
| P-01~P-05 | PRD 수정 필요 항목 (design-review.md §5) | design-review.md §5 |
| U-03 | 반응형 지원 범위 (최소 뷰포트 미확정) | PRD §40, design-review.md FE-08 |

> 위 항목은 결정 시 PRD v1.1을 발행하고 해당 Step에서 반영한다.
> 결정 전까지는 자체 우회 금지. progress.md "남은 문제"에 의존하는 Step이 있으면 보류 상태 유지.
