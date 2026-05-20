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
| Step 2 | 백엔드(미들웨어) | 완료 | 2026-05-20T17:35:00+09:00 | 2026-05-20T18:25:00+09:00 | 미들웨어 5종 + AppError 계층 + jwt/password 유틸 + app/server, 단위 테스트 25건 통과. bcrypt→bcryptjs 채택(네이티브 빌드 회피) |
| Step 3 | 백엔드(인증) | 완료 | - | 2026-05-20T23:59:10+09:00 | 37/37 통과 (통합 12 + 단위 25). C안: nowKST Intl 재구현 + jti UUID fix |
| Step 4 | 백엔드(일정) | 완료 | 2026-05-21 | 2026-05-21T00:55:00+09:00 | 일정 API 6개 + 통합 26건 통과(전체 8파일 63건, 회귀 무). 완료 토글 경로 /complete 확정, 사용자별 격리·타인 404 PLAN_NOT_FOUND. verifier-1 검증: 15/15 PASS (2026-05-21T01:00+09:00). 문서 편차 2건(api-spec §4-5 DELETE 200vs204, §4-2 category_id 필수vs nullable) — 비차단 |
| Step 5 | 백엔드(카테고리) | 완료 | 2026-05-21 | 2026-05-21T01:30:00+09:00 | 카테고리 API 4개 + 통합 25건 통과(전체 9파일 88건, 회귀 무). 수정=PUT 전체교체 확정, 사용자별 격리·타인 404 CATEGORY_NOT_FOUND, 중복명 409, 삭제 시 Plan.categoryId SetNull(affectedPlans 반환). DELETE 응답 200+{message,affectedPlans}(api-spec §5-4 채택). verifier-1 검증: 19/19 PASS (2026-05-21T01:40:00+09:00). 문서 편차 2건 → doc-fixer-1이 2026-05-21 정정 완료(validation §3-3 204→200, PUT/DELETE 에러표 AUTH_FORBIDDEN→CATEGORY_NOT_FOUND) |
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

- **상태:** 완료
- **시작:** 2026-05-20T17:35:00+09:00
- **완료:** 2026-05-20T18:25:00+09:00
- **참조 문서:** backend-spec.md §3·§4·§5·§6·§7·§10·§14, api-spec.md §1·§2, design-review.md BE-05, validation.md §1·§2·§7

### 작업 노트

- 2026-05-20 — `src/utils/errors.ts` 작성: `AppError` 베이스(statusCode/code/message/details?/isOperational) + 서브클래스 9종 (BadRequest 400, Unauthorized 401, InvalidCredentials 401, InvalidToken 401, RefreshExpired 401, Forbidden 403, NotFound 404, Conflict 409, Validation 422, TooManyRequests 429, InternalServer 500). 코드 문자열을 api-spec.md §2와 정렬
- 2026-05-20 — `src/config/env.ts` 작성: dotenv 로드 + Zod 검증, 누락 시 fail-fast(throw), 동결(`Object.freeze`)된 타입 안전 config export. TTL은 초 단위 number로 coerce(jsonwebtoken `expiresIn`에 number 전달 — `@types/jsonwebtoken` v9의 StringValue 제약 회피)
- 2026-05-20 — `src/types/express.d.ts` 작성: `Express.Request.user?: { userId: number; email: string }` 확장 (Access Token 페이로드와 일치). tsconfig `include: ["src"]`로 자동 인식
- 2026-05-20 — `src/types/api.ts` 작성: `SuccessResponse<T>` / `ErrorResponse` / `ApiResponse<T>` 유니온 + `successResponse()` 헬퍼 (api-spec.md §1-1·§1-2)
- 2026-05-20 — `src/utils/jwt.ts` 작성: `generateAccessToken({userId,email})`·`generateRefreshToken({userId})`·`verifyAccessToken`·`verifyRefreshToken`. 검증 시 Zod로 페이로드 형 안전 파싱. 만료/서명 오류를 AUTH_INVALID_TOKEN(access)·AUTH_REFRESH_EXPIRED(refresh)로 매핑 (validation.md §7-2)
- 2026-05-20 — `src/utils/password.ts` 작성: **bcryptjs** 기반 `hashPassword`(cost 12)·`verifyPassword`. 비동기
- 2026-05-20 — `src/middlewares/errorHandler.ts` 작성: 4-arg 시그니처. AppError→정의된 statusCode+표준 응답, ZodError→422 VALIDATION_FAILED+details, 그 외→500 INTERNAL_SERVER_ERROR(내부 미노출, 개발 환경만 스택 로깅)
- 2026-05-20 — `src/middlewares/validate.ts` 작성: `validate(schema, target='body')` 팩토리. safeParse 성공 시 파싱(coerce/transform) 결과를 `req[target]`에 재할당, 실패 시 ValidationError forward. 구체 API 스키마는 Step 3+ 범위로 미작성
- 2026-05-20 — `src/middlewares/authMiddleware.ts` 작성: `Bearer` 토큰 추출→`verifyAccessToken`→`req.user` 주입. 없음/형식오류 시 401 AUTH_UNAUTHORIZED. 리소스 소유권 검증(where:{userId}, 타인 404)은 Step 3+ 서비스 계층 담당임을 주석으로 명시
- 2026-05-20 — `src/middlewares/requestLogger.ts` 작성: morgan(dev/combined 포맷)
- 2026-05-20 — `src/middlewares/rateLimiter.ts` 작성: `authRateLimiter` (5req/1min/IP, 429 + 표준 TOO_MANY_REQUESTS 응답). export만 하고 라우트 부착은 Step 3+ 범위
- 2026-05-20 — `src/app.ts` 재작성: `express-async-errors` import(top) → helmet → cors(credentials, env.FRONT_ORIGIN) → express.json → cookie-parser → requestLogger → `GET /api/v1/health` → errorHandler(LAST). 도메인 라우터 미장착
- 2026-05-20 — `src/server.ts` 재작성: 기존 placeholder(`console.log`) 제거, app+env import 후 `app.listen(env.PORT)` + 기동 로그
- 2026-05-20 — `backend/package.json`: `bcryptjs ^2.4.3` 의존성 + `@types/bcryptjs ^2.4.6` devDependency 추가. 기존 `bcrypt`/`@types/bcrypt`는 미사용으로 잔류(제거 안 함)
- 2026-05-20 — 루트 `npm install` 실행: bcryptjs/@types/bcryptjs 2 패키지 추가 (네이티브 빌드 없음 — OneDrive+한글 경로에서도 정상 설치)
- 2026-05-20 — 단위 테스트 6파일 25건 작성·전체 통과 (errorHandler 5 / validate 4 / authMiddleware 5 / jwt 6 / password 4 / rateLimiter 1). vitest 제로 컨피그로 동작 — 별도 vitest.config.ts 불필요
- 2026-05-20 — `npm run typecheck`(양쪽 0 에러) / `npm run lint`(양쪽 0 에러·0 warning) / `backend npm run test`(25/25 통과)

### 변경 파일

**생성 (backend/src):**
- `utils/errors.ts` — AppError 계층 (베이스 + 서브클래스 + ErrorDetail)
- `config/env.ts` — dotenv + Zod 환경변수 검증, 동결 config export
- `types/express.d.ts` — Request.user 확장
- `types/api.ts` — SuccessResponse/ErrorResponse/ApiResponse + successResponse()
- `utils/jwt.ts` — 토큰 생성·검증 4함수
- `utils/password.ts` — bcryptjs hashPassword/verifyPassword
- `middlewares/errorHandler.ts` — 전역 에러 핸들러 (4-arg)
- `middlewares/validate.ts` — Zod 검증 팩토리
- `middlewares/authMiddleware.ts` — Bearer 토큰 검증 + req.user 주입
- `middlewares/requestLogger.ts` — morgan 요청 로거
- `middlewares/rateLimiter.ts` — authRateLimiter (5req/min/IP)
- `app.ts` — Express 앱 (미들웨어 등록 + /health + errorHandler)

**수정:**
- `server.ts` — placeholder → app.listen 엔트리
- `backend/package.json` — bcryptjs + @types/bcryptjs 의존성 추가

**생성 (backend/tests/unit/middlewares):**
- `errorHandler.test.ts` (5) · `validate.test.ts` (4) · `authMiddleware.test.ts` (5) · `jwt.test.ts` (6) · `password.test.ts` (4) · `rateLimiter.test.ts` (1)

### 실행 명령어

```bash
# 루트: bcryptjs 설치
npm install

# 루트: 통합 검증
npm run typecheck   # frontend + backend
npm run lint        # frontend + backend

# backend: 단위 테스트
cd backend
npm run test        # node ../node_modules/vitest/vitest.mjs run
```

### 검증 결과

- [x] authMiddleware 단위 테스트 통과 (토큰 없음·형식오류·빈토큰·서명오류·정상 주입 5건)
- [x] errorHandler 단위 테스트 통과 (AppError→표준 응답, Conflict 409, ValidationError 422+details, ZodError→422, unknown→500 내부 미노출 5건)
- [x] validate 미들웨어 단위 테스트 통과 (유효 통과 / 무효 422 / coerce 재할당 / 기본 target=body 4건)
- [x] rateLimiter 5req/min/IP 동작 확인 (6회째 429 + 표준 TOO_MANY_REQUESTS 응답)
- [x] jwt 라운드트립·만료·서명오류·페이로드 형 불일치 매핑 6건 통과
- [x] password(bcryptjs) cost 12 prefix·verify true/false·salt 라운드트립 4건 통과
- [x] AppError 계층 클래스 정의 완료 (Unauthorized/InvalidCredentials/InvalidToken/RefreshExpired/Forbidden/NotFound/Conflict/Validation/TooManyRequests/InternalServer)
- [x] api-spec.md §2 공통 에러 코드 표 정렬 확인 (AUTH_UNAUTHORIZED/AUTH_FORBIDDEN/AUTH_INVALID_CREDENTIALS/AUTH_REFRESH_EXPIRED/AUTH_INVALID_TOKEN/VALIDATION_FAILED/TOO_MANY_REQUESTS/INTERNAL_SERVER_ERROR 등)
- [x] `npm run typecheck` 통과 (frontend/backend 0 에러, strict 모드)
- [x] `npm run lint` 통과 (frontend/backend 0 에러·0 warning)
- [x] `cd backend && npm run test` 통과 (6 파일 25건)
- [x] 임시 코드(TODO/HACK/FIXME/debugger) 0건 (src 디렉토리 grep 확인)
- [x] validation.md §1·§2·§7 기준 통과

### 작성된 미들웨어/유틸 요약 (one-line)

- `errors.ts` — AppError 베이스 + 11개 서브클래스, code 문자열을 api-spec.md §2와 정렬
- `env.ts` — dotenv+Zod로 환경변수 검증·동결, 누락 시 fail-fast
- `express.d.ts` — `req.user?: { userId, email }` 타입 확장
- `api.ts` — Success/Error 응답 타입 + successResponse() 헬퍼
- `jwt.ts` — access/refresh 생성·검증, 실패를 AUTH_INVALID_TOKEN/AUTH_REFRESH_EXPIRED로 매핑
- `password.ts` — bcryptjs cost 12 해싱·비교
- `errorHandler.ts` — AppError/ZodError/unknown을 표준 에러 응답으로 변환 (4-arg)
- `validate.ts` — `validate(schema, target)` Zod 검증 팩토리, 파싱값 재할당
- `authMiddleware.ts` — Bearer 토큰 검증 후 req.user 주입 (인가는 Step 3+)
- `requestLogger.ts` — morgan 요청 로거
- `rateLimiter.ts` — 5req/min/IP authRateLimiter (export만, 부착은 Step 3+)
- `app.ts` — 미들웨어 체인 + /api/v1/health + errorHandler(last)
- `server.ts` — app.listen 엔트리

### 남은 문제

1. **bcryptjs 채택 — backend-spec.md 미수정 (doc 보완 권고)** — backend-spec.md §0·§6은 `bcrypt`(cost 12) 기준이나, OneDrive+한글 경로의 네이티브 빌드 실패(Step 1 남은 문제 1번)를 회피하기 위해 구현은 순수 JS인 `bcryptjs`(동일 API, cost 12)로 진행. spec 문서는 본 Step 범위 밖이라 미수정. design-review.md §5에 "bcrypt→bcryptjs" PRD/spec 보완 항목 추가 권고. 해시 호환: bcryptjs는 `$2a$`/`$2b$` prefix를 모두 생성·검증하므로 추후 bcrypt와 상호 호환됨
2. **레거시 `bcrypt`/`@types/bcrypt` 의존성 잔류 (비차단)** — package.json에 남아있으나 코드에서 미사용. 정리 시 제거 권장 (네이티브 빌드 실패하므로 설치 자체는 무해 — postinstall 빌드만 실패 가능, 현재 import 없음)
3. **레거시 `.eslintrc.cjs` 잔류 (Step 0~1 잔여, 비차단)** — 후속 정리 권장

### 다음 Step에서 해야 할 일 (Step 3 — 인증 API 5개)

- **본 작업 (harness.md §3 Step 3 범위):**
  - `routes/auth.route.ts` — register/login/refresh/logout/me 라우트. register·login에 `authRateLimiter`+`validate`, logout·me에 `authMiddleware` 부착 (backend-spec.md §3-1)
  - `controllers/auth.controller.ts` — 요청 파싱 + service 호출 + `successResponse()` 포맷팅
  - `services/auth.service.ts` — 회원가입 트랜잭션(user INSERT + `createDefaultCategoriesForUser` 5개 시드), 로그인(verifyPassword + JWT 발급 + refresh_token_hash 저장), Token Rotation(BE-02), 로그아웃(hash NULL)
  - `repositories/user.repository.ts` — users 테이블 Prisma 쿼리
  - `schemas/auth.schema.ts` — RegisterSchema/LoginSchema (Zod, password 8~72자 영문+숫자)
  - `tests/integration/auth.test.ts` — 회원가입→로그인→refresh→me→logout supertest 시나리오
- **활용 가능한 Step 2 산출물:** `hashPassword`/`verifyPassword`(bcryptjs), `generate*/verify*Token`, `validate`, `authMiddleware`, `authRateLimiter`, AppError(`ConflictError('EMAIL_ALREADY_EXISTS')` 등), `successResponse`
- **사전 권고:** Set-Cookie Path=`/api/v1/auth`(BE-12), refresh_token_hash는 `bcryptjs.hash(token, 10)` 저장(backend-spec.md §5-3). 시드 데모 사용자 placeholder 해시를 bcryptjs로 보강 가능(전역 남은 문제 2번)

---

## Step 3. 인증 API 5개

- **상태:** 완료
- **시작:** -
- **완료:** 2026-05-20T23:59:10+09:00
- **참조 문서:** api-spec.md §3, backend-spec.md §5, design-review.md BE-01·BE-02·BE-12

### 작업 노트

- 2026-05-20T23:39+09:00 — verifier-1 검증: 코드 구조 14/15 PASS, 통합 테스트 수집 FAIL (date-fns ESM 해석 오류)
- 2026-05-20T23:59+09:00 — fixer-1 C안 수정:
  - **차단 1 (date-fns ESM):** `dateUtil.ts`의 `date-fns-tz` 의존성 제거 → Node.js 내장 `Intl` + UTC 오프셋 연산 기반 `nowKST()` 재구현. `package.json`에서 `date-fns`·`date-fns-tz` 제거(1 패키지 감소). `vitest.config.ts`의 `server.deps.inline` 우회책 삭제.
  - **차단 2 (Token Rotation 오작동):** `generateRefreshToken()`이 `jti` 없이 `{userId}`만 포함 → 동일 초 내 발급 시 JWT 문자열 동일 → `bcrypt.compare(oldToken, newHash)` 가 `true` 반환 → 재사용 감지 불가. `jwt.ts`에 `jti: randomUUID()` 추가로 각 토큰을 항상 고유하게 보장.
  - `npm install` (루트) 실행: 1 패키지 제거 확인.
- 2026-05-21 — `dateUtil.ts` 헤더 주석 정정 (코드 무변경): "Intl.DateTimeFormat 기반" → "KST 고정 오프셋(+09:00, DST 없음) 산술 기반" — 실제 구현(UTC ms + 540분 오프셋 연산)과 주석을 일치시킴. typecheck/lint 재확인 통과.

### 변경 파일

- `backend/src/utils/dateUtil.ts` — **수정**: `date-fns-tz` → Node.js `Intl` 기반 재구현 (C안)
- `backend/src/utils/jwt.ts` — **수정**: `generateRefreshToken`에 `jti: randomUUID()` 추가
- `backend/vitest.config.ts` — **수정**: `server.deps.inline` 우회책 제거
- `backend/package.json` — **수정**: `date-fns ^3.6.0`·`date-fns-tz ^3.1.0` 의존성 제거

(이전 구현 파일 — git 커밋 전 untracked 상태)

- `backend/src/routes/auth.route.ts` — 신규
- `backend/src/controllers/auth.controller.ts` — 신규
- `backend/src/services/auth.service.ts` — 신규
- `backend/src/repositories/user.repository.ts` — 신규
- `backend/src/schemas/auth.schema.ts` — 신규
- `backend/tests/integration/auth.test.ts` — 신규
- `backend/tests/setup/globalSetup.ts` / `testEnv.ts` — 신규
- `backend/src/app.ts` — 수정 (authRouter 장착)
- `backend/src/server.ts` — 수정

### dep 제거 근거

`date-fns`·`date-fns-tz`는 `dateUtil.ts` 한 파일에서만 사용되었으며, Vitest(Vite ESM 리졸버)가 `date-fns` v3.6.0의 서브패스 `.mjs` 파일을 찾지 못해 통합 테스트 수집 단계에서 실패하는 차단 이슈의 근원이었다. `nowKST()`의 요구사항(KST 고정 +09:00 오프셋, ISO 8601 형식)은 Node.js 내장 API만으로 완전히 구현 가능하므로 외부 의존성을 제거하는 것이 최적 해결책(C안)이다.

### 실행 명령어

```bash
# 루트: dep 제거 후 lockfile 동기화
npm install           # 1 패키지 제거 확인

# 루트: 통합 검증
npm run typecheck     # PASS — 에러 0건 (frontend + backend)
npm run lint          # PASS — 에러 0건 (frontend + backend)

# backend: 전체 테스트
cd backend && npm run test  # PASS — 7파일 37건 통과 (통합 12 + 단위 25)
```

### 검증 결과 (fixer-1, 2026-05-20T23:59:10+09:00)

- [x] POST /auth/register → 201, categories 5건 동시 INSERT 확인
- [x] POST /auth/login → 200, Set-Cookie refresh_token(HttpOnly, Path=/api/v1/auth) 확인
- [x] POST /auth/login → users.refresh_token_hash DB 저장 확인 (bcrypt prefix $2)
- [x] POST /auth/refresh → 200, 새 accessToken + 새 Set-Cookie 확인 (Token Rotation)
- [x] POST /auth/refresh 재사용 → 401 AUTH_INVALID_TOKEN + DB refresh_token_hash=NULL 확인 (전체 세션 폐기, §7-5)
- [x] POST /auth/logout → 200, Set-Cookie Max-Age=0, DB refresh_token_hash=NULL 확인
- [x] GET /auth/me → 200, 사용자 정보 반환 확인
- [x] 중복 이메일 register → 409 EMAIL_ALREADY_EXISTS
- [x] 잘못된 비밀번호 login → 401 AUTH_INVALID_CREDENTIALS
- [x] Rate Limit 초과 → 429 TOO_MANY_REQUESTS
- [x] supertest 통합 테스트 전체 통과 — **PASS**: auth.test.ts 12건 수집·실행 성공
- [x] Step 2 단위 테스트 25건 여전히 통과 (회귀 없음)
- [x] `npm run typecheck` 통과 (frontend/backend 0 에러)
- [x] `npm run lint` 통과 (frontend/backend 0 에러·0 warning)
- [x] `cd backend && npm run test` 통과 (7파일 37건: 통합 12 + 단위 25)
- [x] `nowKST()` 출력 형식 `YYYY-MM-DDTHH:mm:ss+09:00` 유지 (DB-02·DB-14 준수)
- [x] `export function nowKST(): string` 시그니처 유지 (호출자 무수정)
- [x] validation.md §3-1·§7 기준 통과

### 남은 문제

없음 — Step 3 DoD 전체 통과.

---

## Step 4. 일정 API 6개

- **상태:** 완료
- **시작:** 2026-05-21
- **완료:** 2026-05-21T00:55:00+09:00
- **참조 문서:** api-spec.md §4, backend-spec.md §8-1~§8-3·§9-2, data-model.md §4, validation.md §3-2·§8, design-review.md BE-03·BE-04·DB-07

### 확정 사항

- **완료 토글 경로는 `/complete`로 확정** (api-spec.md §4-6 / validation.md P-06 기준). 요청서 초안의 `/completed`가 아님. → `PATCH /api/v1/plans/:id/complete`.
- **타인 소유/미존재 일정은 일괄 404 `PLAN_NOT_FOUND`** 로 응답(403 소유권 노출 금지). api-spec §4-3~§4-6 표에는 403 AUTH_FORBIDDEN도 병기되어 있으나, 정보 비노출 원칙(Step 3 auth 패턴과 일관)에 따라 404로 통일.
- 요청 본문은 api-spec §4-2/§4-4 요청 표 기준 **snake_case**(`due_date`/`due_time`/`display_date`/`category_id`/`is_remind`) 수용, 응답·DB는 **카멜케이스**(Prisma 필드 `dueDate`/`displayDate`/`categoryId`/`isCompleted`/`isRemind`/`memo`).
- DELETE 응답은 **204**(본문 없음)으로 확정(validation.md §8-3 기준; api-spec §4-5의 200+message 표기 대신 204 채택).

### 작업 노트

- 2026-05-21 — `schemas/plan.schema.ts`: `CreatePlanSchema`(title 1~100, due_date/display_date YYYY-MM-DD, due_time HH:mm|null, category_id 양의정수|null, priority enum, memo 0~500|null, is_remind bool) + `superRefine`로 display_date≤due_date 교차검증(422 details[display_date]) / `UpdatePlanSchema`(전부 optional, 둘 다 제공 시 교차검증) / `GetPlansQuerySchema`(month, search, category·priority 단/다중값 배열 정규화, completed '0'|'1', uncategorized '1').
- 2026-05-21 — `repositories/plan.repository.ts`: **모든 where에 `userId` + `deletedAt: null` 강제.** 목록은 month(displayDate 사전식 범위)·search(title|memo OR)·category/uncategorized OR 그룹·priority IN·completed AND 조합. 수정/삭제/토글은 `updateMany({ id, userId, deletedAt:null })` 영향행 0 → null(타인/미존재/삭제됨 동일 취급). 모든 타임스탬프 `nowKST()` 명시 전달.
- 2026-05-21 — `services/plan.service.ts`: 서버 고정 정렬을 애플리케이션 계층에서 수행(SQLite가 priority CASE/NULLS LAST를 orderBy로 직접 표현 곤란) — isCompleted ASC → priority(high0/normal1/low2) → dueTime ASC NULLS LAST → createdAt ASC → id. category_id 지정 시 소유 카테고리 확인(아니면 404 CATEGORY_NOT_FOUND). 수정 시 최종 적용값으로 display_date≤due_date 재검증.
- 2026-05-21 — `controllers/plan.controller.ts`: 얇은 컨트롤러. `:id` 비정수 → 404 PLAN_NOT_FOUND. 상태코드 목록/단건/수정/토글 200, 생성 201, 삭제 204.
- 2026-05-21 — `routes/plan.route.ts`: `router.use(authMiddleware)`로 6개 전부 인증. list/create/update에 `validate` 부착. `app.ts`에 `/api/v1/plans` 마운트.
- 2026-05-21 — `tests/integration/plans.test.ts`: 26건 작성. 인증없음 401 / 생성·null카테고리·타인카테고리404·422(title/날짜형식)·교차검증422·동일날짜통과 / 서버고정정렬(B→C→E→A→D, validation §8-2) / month·search·category OR·uncategorized·priority OR·completed 필터 / 단건·999404·비정수404 / 수정·교차검증422·타인404 / soft delete 204·DB deletedAt·목록제외·재삭제404 / 토글 false→true→false·타인404 / 사용자별 격리(목록 분리, 타인 단건 404).
- 2026-05-21 — typecheck/lint/test 전부 통과. 회귀(auth 12 + 단위 25) 무영향 확인.

### 변경 파일

**생성 (backend/src):**
- `schemas/plan.schema.ts` — CreatePlanSchema / UpdatePlanSchema / GetPlansQuerySchema (Zod, snake_case 입력 + 교차검증)
- `repositories/plan.repository.ts` — plans Prisma 쿼리 (where userId+deletedAt 강제, nowKST 명시)
- `services/plan.service.ts` — 비즈니스 로직 + 서버 고정 정렬 + 카테고리 소유권 검증 + 응답 뷰 매핑
- `controllers/plan.controller.ts` — 얇은 컨트롤러 (상태코드·successResponse)
- `routes/plan.route.ts` — 6개 엔드포인트 (전부 authMiddleware)

**수정:**
- `src/app.ts` — `plansRouter`를 `/api/v1/plans`에 마운트

**생성 (backend/tests/integration):**
- `plans.test.ts` — 일정 API 통합 테스트 26건

### 구현된 일정 API 6개

| # | 메서드 | 경로 | 상태코드 | 기능 |
|---|---|---|---|---|
| P-01 | GET | `/api/v1/plans` | 200 | 목록 조회 (month/search/category/uncategorized/priority/completed 필터 + 서버 고정 정렬) |
| P-02 | POST | `/api/v1/plans` | 201 | 등록 |
| P-03 | GET | `/api/v1/plans/:id` | 200 | 단건 조회 |
| P-04 | PATCH | `/api/v1/plans/:id` | 200 | 부분 수정 |
| P-05 | DELETE | `/api/v1/plans/:id` | 204 | soft delete (deletedAt=nowKST()) |
| P-06 | PATCH | `/api/v1/plans/:id/complete` | 200 | 완료 토글 |

### 사용자별 데이터 격리 / 타인 리소스 404 처리 방식

- **격리:** `plan.repository.ts`의 모든 쿼리 where에 `userId`(+`deletedAt: null`) 포함. 목록은 `findManyByUser(userId, ...)`, 단건은 `findFirst({ id, userId, deletedAt: null })`, 수정/삭제/토글은 `updateMany({ id, userId, deletedAt: null })`로 타인 행이 절대 매칭되지 않음.
- **타인 리소스 404:** 단건/수정/삭제/토글에서 조회·영향행이 0이면 `NotFoundError('일정을 찾을 수 없습니다.', 'PLAN_NOT_FOUND')` throw. 소유권 존재 여부를 403으로 노출하지 않고 미존재와 동일하게 처리.

### 실행 명령어

```bash
# 루트: 통합 검증
npm run typecheck     # PASS — 에러 0건 (frontend + backend)
npm run lint          # PASS — 에러/warning 0건 (frontend + backend)

# backend: 전체 테스트
cd backend && npm run test  # PASS — 8파일 63건 (plans 26 + auth 12 + 단위 25)
```

### 검증 결과

- [x] GET /plans → 200, 서버 고정 정렬 순서 확인 (B→C→E→A→D, validation.md §8-2 데이터)
- [x] GET /plans?month=2026-05 → display_date 기준 월 필터 동작 확인
- [x] GET /plans?search=키워드 → title+memo LIKE 검색 동작 확인
- [x] GET /plans?category=1&category=2 → OR 필터 동작 확인
- [x] GET /plans?uncategorized=1 (+category 혼합) → category_id IS NULL OR IN 확인
- [x] GET /plans?priority OR / completed 단일 필터 확인
- [x] POST /plans → 201, display_date≤due_date 정상 케이스 통과 (동일 날짜 포함)
- [x] POST /plans (display_date > due_date) → 422, details 배열에 display_date 에러 포함
- [x] POST /plans (타인 category_id) → 404 CATEGORY_NOT_FOUND
- [x] GET /plans/:id (타인 ID / 미존재 / 비정수) → 404 PLAN_NOT_FOUND
- [x] PATCH /plans/:id → 200, updatedAt KST(+09:00) 갱신 확인 / 타인 → 404
- [x] PATCH /plans/:id (display_date만 변경해 기존 due_date 초과) → 422
- [x] DELETE /plans/:id → 204, DB deletedAt 채워짐 / 목록·단건 제외 / 재삭제 404
- [x] PATCH /plans/:id/complete → isCompleted false→true→false 토글 / 타인 → 404
- [x] 모든 쿼리에 where: { userId, deletedAt: null } 조건 포함 확인 (코드 리뷰)
- [x] 사용자별 격리: 다른 사용자 일정 목록 미노출 + 타인 단건 404
- [x] supertest 통합 테스트 전체 통과 (plans 26건)
- [x] Step 0~3 회귀 무영향 (auth 12 + 단위 25 통과)
- [x] typecheck/lint 통과 (any/@ts-ignore 0, skip 테스트 0)
- [x] validation.md §3-2·§8 기준 통과

### 남은 문제

- 없음 — Step 4 DoD 전체 통과.

---

### Step 4 독립 검증 결과 (verifier-1, 2026-05-21T01:00:16+09:00)

**15개 기준 판정표:**

| # | 기준 | 판정 | 근거 |
|---|---|---|---|
| 1 | 일정 API 6개만 구현 | PASS | plan.route.ts:19~35 — GET/POST/GET:id/PATCH:id/DELETE:id/PATCH:id/complete 정확히 6개 |
| 2 | 카테고리/프로필/프론트 미구현 | PASS | git status 확인: plan.* 5파일+app.ts 수정만. 범위 외 파일 없음 |
| 3 | 모든 일정 API에 authMiddleware 적용 | PASS | plan.route.ts:17 `router.use(authMiddleware)` — 6개 전부 커버 |
| 4 | 모든 Plan 조회/수정/삭제 where에 userId 포함 | PASS | plan.repository.ts:39,89,151,169,188 — 전 함수 `userId`+`deletedAt:null` 강제 |
| 5 | 타인 리소스 접근 404 처리 (403 미노출) | PASS | plan.service.ts:125,174,221,229 — PLAN_NOT_FOUND(404) 통일, 403 없음. 테스트 26건 확인 |
| 6 | 생성/수정 입력 검증이 api-spec §4-2·§4-4와 일치 | PASS | plan.schema.ts — title 1~100, due_date/display_date YYYY-MM-DD regex, priority enum, memo 0~500, category_id nullable optional. 요청 snake_case / 응답 camelCase 일치 |
| 7 | completed 변경 API(/complete) 정상 동작 | PASS | plan.repository.ts:181~193 — 토글+updatedAt nowKST(). 테스트: false→true→false 확인 |
| 8 | nowKST() 기반 timestamp 정책 유지 | PASS | plan.repository.ts:110,124,153,168,188 — create/update/delete/toggle 모두 nowKST() 명시. @default(now())/@updatedAt 없음 |
| 9 | Prisma schema·migration 미수정 | PASS | `git diff HEAD -- backend/prisma/` 출력 없음 — 변경 없음 확인 |
| 10 | npm run typecheck 통과 | PASS | 실행 결과: frontend+backend 에러 0건 |
| 11 | npm run lint 통과 | PASS | 실행 결과: frontend+backend 에러/warning 0건 |
| 12 | cd backend; npm run test 통과 | PASS | 8파일 63건 전체 통과 (plans 26 + auth 12 + 단위 25) |
| 13 | 인증 API 테스트 회귀 없이 통과 | PASS | auth.test.ts 12건 + 단위 25건 모두 통과, 회귀 없음 |
| 14 | Step 4 범위 밖 파일 미수정 | PASS | git status: 범위 외 소스 파일 수정 없음 (.omc/** 내부 상태 파일만 변경됨) |
| 15 | progress.md에 Step 4 결과 기록 | PASS | 기존 작성 완료 + 본 검증 결과 추가 기록 |

**설계 편차 2건 평가:**

(a) **DELETE 응답: 204 vs api-spec §4-5의 200+message**
- api-spec.md §4-5(라인 509): `200 OK` + `{ "data": { "message": "삭제 완료" } }` 명시
- validation.md §8-3(라인 734): `204 No Content` 명시
- 구현: 204 채택 (plan.controller.ts:70, plan.route.ts:32)
- 평가: 문서 간 불일치 존재. validation.md §8-3이 구현 정본으로 채택됨. api-spec.md §4-5 수정 필요(문서 보완 과제). 기능 동작은 정상이며 204는 REST 관례상 더 올바른 선택이므로 비차단 이슈.

(b) **category_id: nullable 구현 vs api-spec §4-2 표의 필수(✓)**
- api-spec.md §4-2 요청 표: `category_id` 필수(✓) 표기
- data-model.md §4: `category_id INTEGER NULL` — NULL 허용, K-09=B(SET NULL) 명시
- 구현: `z.number().nullable().optional()` — nullable+optional (plan.schema.ts:38~41)
- 평가: data-model.md(K-09=B)와 구현이 정합함. api-spec.md §4-2의 필수(✓) 표기가 오기로 보임. 카테고리 없이 생성 테스트(plans.test.ts:114) 통과 확인. api-spec.md 수정 필요(문서 보완 과제). 기능 동작은 data-model 기준으로 올바름.

**발견된 문제 목록 (수정 금지 — 보고용):**

1. api-spec.md §4-5: DELETE 응답이 200+message로 기재되어 있으나 validation.md §8-3 및 구현은 204. 문서 정합성 보완 필요.
2. api-spec.md §4-2: `category_id` 필수(✓) 표기가 data-model.md K-09=B(NULL 허용)와 불일치. api-spec 수정 필요.
3. (비차단) api-spec.md §4-3·§4-4·§4-5·§4-6: 에러 표에 `AUTH_FORBIDDEN 403` 병기되어 있으나 구현은 정책적으로 404 통일. 문서와 구현 간 의도적 편차로 진행 기록에 명시 필요.

---

## Step 5. 카테고리 API 4개

- **상태:** 완료
- **시작:** 2026-05-21
- **완료:** 2026-05-21T01:30:00+09:00
- **참조 문서:** api-spec.md §5, backend-spec.md §8-4, data-model.md §3, design-review.md DB-03·DB-09, validation.md §3-3·§4

### 확정 사항

- **카테고리 수정 엔드포인트는 PUT /api/v1/categories/:id 전체 교체 방식으로 확정** (api-spec.md §5-3 FE-01 / validation.md §3-3). 요청 본문에 `name`·`color`·`sort_order` **모두 필수**. 부분 업데이트(PATCH) 아님 — 일정 수정(`PATCH /plans/:id`)과 메서드가 다름.
- **타인 소유/미존재 카테고리는 일괄 404 `CATEGORY_NOT_FOUND`** 로 응답(403 소유권 노출 금지). api-spec §5-3·§5-4 표에는 `AUTH_FORBIDDEN 403`도 병기되어 있으나, 정보 비노출 원칙(Step 3 auth / Step 4 plans 패턴과 일관)에 따라 404로 통일.
- **DELETE 응답은 200 + `{ message: "삭제 완료", affectedPlans }`** 로 확정(api-spec.md §5-4 채택). validation.md §3-3은 204 No Content로 표기하나, api-spec §5-4가 `affectedPlans`(NULL 처리된 일정 수) 페이로드를 명시 요구하므로 api-spec을 정본으로 채택. 문서 간 편차는 아래 "남은 문제"에 기록.
- 요청 본문은 snake_case(`sort_order`) 수용, 응답·DB는 카멜케이스(Prisma 필드 `sortOrder`).

### 작업 노트

- 2026-05-21 — `schemas/category.schema.ts`: `CreateCategorySchema`(name 1~30, color HEX #RRGGBB 정규식 필수, sort_order 선택 정수≥0) / `UpdateCategorySchema`(PUT 전체교체 — name·color·sort_order 모두 필수).
- 2026-05-21 — `repositories/category.repository.ts`: **모든 where에 `userId` 강제.** 목록 sortOrder ASC(동률 id ASC). 수정은 `updateMany({ id, userId })` 영향행 0 → null(타인/미존재 동일 취급). 삭제는 `deleteMany({ id, userId })` + 삭제 직전 `plan.count({ categoryId: id })`로 affectedPlans 집계. P2002(@@unique [userId,name]) 식별 헬퍼 `isUniqueConstraintError`. 모든 타임스탬프 `nowKST()` 명시 전달.
- 2026-05-21 — `services/category.service.ts`: userId 기준 비즈니스 로직. POST에서 sort_order 생략 시 `maxSortOrderForUser+1`(없으면 1). P2002 캐치 → 409 `CATEGORY_NAME_ALREADY_EXISTS`. PUT은 사전 조회로 404 판정 후 수정(P2002도 409로 변환). 응답 뷰 매핑.
- 2026-05-21 — `controllers/category.controller.ts`: 얇은 컨트롤러. `:id` 비정수 → 404 CATEGORY_NOT_FOUND. 상태코드 목록/수정/삭제 200, 생성 201. 삭제 응답 `{ message, affectedPlans }`.
- 2026-05-21 — `routes/category.route.ts`: `router.use(authMiddleware)`로 4개 전부 인증. POST/PUT에 `validate` 부착. `app.ts`에 `categoriesRouter`를 `/api/v1/categories` 마운트.
- 2026-05-21 — `tests/integration/categories.test.ts`: 25건 작성. 인증없음 401(4개 엔드포인트) / 목록 기본 5개 sortOrder 정렬·신규 삽입 정렬 / 생성 201·자동 sort_order·중복명 409·HEX 422·이름누락 422·31자 422·사용자간 동일명 허용(격리) / PUT 전체교체 200·필드누락 422·타카테고리 동일명 409·자기자신 200·미존재 404·비정수 404·타인 404 / DELETE 200+affectedPlans·**SetNull 검증(Plan 2건 연결→삭제→categoryId NULL, affectedPlans=2, DB+API 양쪽 확인)**·미존재 404·타인 404 미삭제 / 사용자별 격리 목록.
- 2026-05-21 — typecheck/lint/test 전부 통과. 회귀(plans 26 + auth 12 + 단위 25) 무영향 확인.

### 변경 파일

**생성 (backend/src):**
- `schemas/category.schema.ts` — CreateCategorySchema / UpdateCategorySchema (Zod, snake_case 입력, HEX 정규식, PUT 전체교체 모두 필수)
- `repositories/category.repository.ts` — categories Prisma 쿼리 (where userId 강제, nowKST 명시, P2002 식별, deleteMany+affectedPlans 집계)
- `services/category.service.ts` — 비즈니스 로직 (sort_order 자동 결정, 중복명 409, 404 통일, 응답 뷰 매핑)
- `controllers/category.controller.ts` — 얇은 컨트롤러 (상태코드·successResponse·삭제 affectedPlans)
- `routes/category.route.ts` — 4개 엔드포인트 (전부 authMiddleware, POST/PUT validate)

**수정:**
- `src/app.ts` — `categoriesRouter`를 `/api/v1/categories`에 마운트

**생성 (backend/tests/integration):**
- `categories.test.ts` — 카테고리 API 통합 테스트 25건

### 구현된 카테고리 API 4개

| # | 메서드 | 경로 | 상태코드 | 기능 |
|---|---|---|---|---|
| C-01 | GET | `/api/v1/categories` | 200 | 목록 조회 (sortOrder ASC) |
| C-02 | POST | `/api/v1/categories` | 201 | 생성 (sort_order 생략 시 최대값+1, 중복명 409) |
| C-03 | PUT | `/api/v1/categories/:id` | 200 | 전체 교체 수정 (name·color·sort_order 모두 필수) |
| C-04 | DELETE | `/api/v1/categories/:id` | 200 | 삭제 (`{ message, affectedPlans }`, 연결 Plan.categoryId SetNull) |

### 사용자별 데이터 격리 / 타인 리소스 404 처리 방식

- **격리:** `category.repository.ts`의 모든 쿼리 where에 `userId` 포함. 목록 `findManyByUser(userId)`, 단건 `findFirst({ id, userId })`, 수정 `updateMany({ id, userId })`, 삭제 `deleteMany({ id, userId })`로 타인 행이 절대 매칭되지 않음. 중복명 제약 `@@unique([userId, name])`는 사용자 경계 안에서만 적용되어 서로 다른 사용자는 동일명 카테고리 생성 가능(테스트로 확인).
- **타인 리소스 404:** 수정/삭제에서 조회·영향행이 0이면 `NotFoundError('카테고리를 찾을 수 없습니다.', 'CATEGORY_NOT_FOUND')` throw. 소유권 존재 여부를 403으로 노출하지 않고 미존재와 동일하게 처리.

### 카테고리 삭제 시 Plan.categoryId 처리 방식 (SetNull)

- Prisma schema의 `Plan.category` 관계가 `onDelete: SetNull`로 정의되어 있고, `config/prisma.ts`에서 `PRAGMA foreign_keys = ON`이 활성화되어 있어, 카테고리 레코드를 `prisma.category.deleteMany`로 삭제하면 DB가 해당 카테고리를 참조하던 모든 `plans.categoryId`를 자동으로 NULL로 설정한다(애플리케이션 측 별도 UPDATE 불필요).
- `affectedPlans`는 삭제 직전 `prisma.plan.count({ where: { categoryId: id } })`로 집계해 응답에 포함한다(api-spec §5-4).
- 통합 테스트 "삭제 후 연결 Plan.categoryId = NULL"에서 카테고리에 연결된 일정 2건 생성 → 카테고리 삭제 → `affectedPlans=2` 응답 + DB 직접 조회(`prisma.plan.findUniqueOrThrow`)와 GET /plans/:id API 양쪽에서 `categoryId`/`category`가 NULL임을 검증.

### 실행 명령어

```bash
# 루트: 통합 검증
npm run typecheck     # PASS — 에러 0건 (frontend + backend)
npm run lint          # PASS — 에러/warning 0건 (frontend + backend)

# backend: 전체 테스트
cd backend && npm run test  # PASS — 9파일 88건 (categories 25 + plans 26 + auth 12 + 단위 25)
```

### 검증 결과

- [x] GET /categories → 200, sortOrder 오름차순 반환 확인 (기본 5개 + 신규 삽입 정렬)
- [x] POST /categories → 201, (userId, name) UNIQUE 제약 동작 확인 / sort_order 생략 시 최대값+1
- [x] POST /categories (중복명) → 409 CATEGORY_NAME_ALREADY_EXISTS (Prisma P2002 → AppError 변환)
- [x] PUT /categories/:id → 200, name·color·sort_order 전체 교체 확인 / 필드 누락 시 422 (전체 교체)
- [x] PUT /categories/:id (다른 카테고리와 동일명) → 409 CATEGORY_NAME_ALREADY_EXISTS / 자기 자신 동일명 유지 200
- [x] DELETE /categories/:id → 200 + `{ message, affectedPlans }` (api-spec §5-4)
- [x] DELETE 후 연결 plans.categoryId = NULL 확인 (DB 직접 조회 + GET /plans/:id API 양쪽, affectedPlans=2)
- [x] PRAGMA foreign_keys = ON 상태에서 SET NULL 동작 확인 (config/prisma.ts 기 활성화 — SetNull 테스트 통과로 재확인)
- [x] HEX 색상 형식 오류 → 422 VALIDATION_FAILED (details에 color)
- [x] 타인 소유 카테고리로 PUT/DELETE → 404 CATEGORY_NOT_FOUND (403 미노출, 타인 DELETE 후 미삭제 확인)
- [x] 비정수/미존재 :id → 404 CATEGORY_NOT_FOUND
- [x] 사용자별 격리: 다른 사용자 카테고리 목록 미노출 / 사용자 간 동일명 생성 허용
- [x] supertest 통합 테스트 전체 통과 (categories 25건)
- [x] Step 0~4 회귀 무영향 (plans 26 + auth 12 + 단위 25 통과)
- [x] typecheck/lint 통과 (any/@ts-ignore 0, skip/완화 테스트 0)
- [x] 일정 API 코드·Prisma schema/migration·lib/defaultCategories.ts·seed 무수정 (테스트에서 Plan API 호출만 사용)
- [x] validation.md §3-3·§4 기준 통과 (DELETE 응답 코드는 api-spec §5-4 채택 — 아래 편차 기록)

### 남은 문제 / 문서 편차 (수정 금지 — 보고용)

1. **DELETE 응답 코드 문서 편차 (비차단)** — api-spec.md §5-4는 `200 OK` + `{ message, affectedPlans }`, validation.md §3-3은 `204 No Content`로 상이하게 기재. 구현은 api-spec §5-4(200+페이로드)를 채택 — `affectedPlans`(SetNull된 일정 수) 반환이 명시 요구사항이므로 204(본문 없음)와 양립 불가. validation.md §3-3 또는 api-spec.md §5-4 중 하나로 문서 정합성 보완 필요.
2. **PUT/DELETE 에러 표의 AUTH_FORBIDDEN(403) 병기 (의도적 편차)** — api-spec.md §5-3·§5-4 에러 표에 `AUTH_FORBIDDEN 403`이 병기되어 있으나, 정보 비노출 원칙(Step 3·4와 일관)에 따라 구현은 타인/미존재를 404 CATEGORY_NOT_FOUND로 통일. 문서와 구현 간 의도적 편차로 기록.

### 다음 Step에서 해야 할 일 (Step 6 — 프로필 API 4개)

- **본 작업 (harness.md §3 Step 6 범위):** `routes/profile.route.ts`(GET/PATCH/PATCH password/POST avatar, 전부 authMiddleware) · `controllers/profile.controller.ts` · `services/profile.service.ts` · `middlewares/upload.ts`(multer) · `schemas/profile.schema.ts` · `tests/integration/profile.test.ts`.
- **활용 가능한 산출물:** `authMiddleware`, `validate`, `successResponse`, AppError(`InvalidCredentialsError`/`ValidationError`/`BadRequestError`), `hashPassword`/`verifyPassword`(bcryptjs), `nowKST()`, `user.repository.ts`.
- **사전 권고:** 아바타 저장 경로 `/uploads/avatars/{userId}_{timestamp}.{ext}`, 5MB·jpg/png/webp 제한(FILE_TOO_LARGE 400 / INVALID_FILE_TYPE 400). 비밀번호 변경 후 기존 비밀번호 로그인 401 검증.

---

### Step 5 독립 검증 결과 (verifier-1, 2026-05-21T01:40:00+09:00)

**19개 기준 판정표:**

| # | 기준 | 판정 | 근거 (파일:라인) |
|---|---|---|---|
| 1 | 카테고리 API 4개만 구현 (C-01~C-04) | PASS | category.route.ts:19~29 — GET/POST/PUT:id/DELETE:id 정확히 4개 |
| 2 | 프로필/프론트 미구현 (범위 밖 파일 미수정) | PASS | git status: category.* 5파일+app.ts 수정만. profile/frontend 미생성 확인 |
| 3 | 모든 카테고리 API에 authMiddleware 적용 | PASS | category.route.ts:17 `router.use(authMiddleware)` — 4개 전부 커버 |
| 4 | 모든 Category 조회/수정/삭제 where에 userId 포함 | PASS | category.repository.ts:23(findMany), :34(findFirst), :89(updateMany), :119(deleteMany) — 전 함수 userId 강제 |
| 5 | 타인 리소스 접근 404 처리 (403 미노출) | PASS | category.service.ts:93,104,132 — CATEGORY_NOT_FOUND(404) 통일, 403 없음. 테스트 25건 확인 |
| 6 | C-01 GET /categories → 200, sortOrder ASC 정렬 | PASS | category.repository.ts:24 `orderBy:[{sortOrder:'asc'},{id:'asc'}]`. 테스트: 기본5개 sortOrder[1,2,3,4,5] 확인 |
| 7 | C-02 POST /categories → 201, sort_order 생략 시 max+1 | PASS | category.service.ts:57~59 `(max??0)+1`. 테스트: 기본5개 후 6 자동 배정 확인 |
| 8 | C-02 중복명 → 409 CATEGORY_NAME_ALREADY_EXISTS | PASS | category.service.ts:71~75 P2002→ConflictError 변환. 테스트: 기본"미팅" 재생성 409 확인 |
| 9 | C-03 PUT 전체 교체 (name·color·sort_order 모두 필수) | PASS | UpdateCategorySchema: sort_order 비optional(category.schema.ts:42~47). 테스트: 누락 시 422 details에 sort_order 확인 |
| 10 | C-03 동일명 타 카테고리 변경 → 409 / 자기자신 → 200 | PASS | category.service.ts:110~114 P2002→409. 테스트: 타카테고리 동일명 409·자기자신 200 양쪽 확인 |
| 11 | C-04 DELETE → 200 + { message, affectedPlans } | PASS | category.controller.ts:65~68 `res.status(200).json(successResponse({message:'삭제 완료',affectedPlans}))` |
| 12 | C-04 삭제 후 Plan.categoryId SetNull + affectedPlans 반환 | PASS | category.repository.ts:117 삭제 전 plan.count 집계. 테스트: 2건 연결→삭제→affectedPlans=2, DB+API 양쪽 categoryId=null 확인 |
| 13 | HEX 색상 형식 오류 → 422 (details에 color) | PASS | category.schema.ts:17~19 `/^#[0-9a-fA-F]{6}$/` 정규식. 테스트: '#' 없는 색상 422+details.color 확인 |
| 14 | nowKST() 기반 timestamp 정책 유지 | PASS | category.repository.ts:60,61,68,95 — create/update 모두 nowKST() 명시. @default(now())/@updatedAt 없음 |
| 15 | Prisma schema·migration 미수정 | PASS | `git diff HEAD -- backend/prisma/` 출력 없음 — 변경 없음 확인 |
| 16 | npm run typecheck 통과 | PASS | 실행 결과: frontend+backend 에러 0건 |
| 17 | npm run lint 통과 | PASS | 실행 결과: frontend+backend 에러/warning 0건 |
| 18 | cd backend; npm run test 통과 | PASS | 9파일 88건 전체 통과 (categories 25 + plans 26 + auth 12 + 단위 25) |
| 19 | Step 0~4 회귀 무영향 | PASS | plans 26건 + auth 12건 + 단위 25건 모두 통과, 회귀 없음 |

**설계 편차 평가:**

(a) **DELETE 응답: 200+{message,affectedPlans} vs validation.md §3-3의 204 No Content**
- api-spec.md §5-4: `200 OK` + `{ message, affectedPlans }` 명시
- validation.md §3-3: `204 No Content` 명시
- 구현: 200 채택 (category.controller.ts:65~68)
- 평가: affectedPlans 페이로드 반환이 api-spec §5-4의 명시 요구사항이므로 204(본문 없음)와 양립 불가. api-spec §5-4를 정본으로 채택한 결정은 타당하며 비차단. validation.md §3-3 문서 보완 과제.

(b) **PUT/DELETE 에러 표의 AUTH_FORBIDDEN(403) 병기 (의도적 편차)**
- api-spec.md §5-3·§5-4 에러 표: `AUTH_FORBIDDEN 403` 병기
- 구현: 정보 비노출 원칙(Step 3·4와 일관)으로 타인/미존재를 404 CATEGORY_NOT_FOUND 통일
- 평가: 보안상 올바른 설계 선택. 의도적 편차로 기록.

**발견된 문제 목록 (수정 금지 — 보고용):**

1. (비차단) api-spec.md §5-4: DELETE 응답 코드가 validation.md §3-3과 상이(200 vs 204). 문서 정합성 보완 필요.
2. (비차단) api-spec.md §5-3·§5-4: 에러 표에 AUTH_FORBIDDEN 403 병기되어 있으나 구현은 정책적으로 404 통일. 의도적 편차로 문서 보완 권고.

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
| 2026-05-20T18:25:00+09:00 | **Step 2 완료** — 공통 미들웨어 5종(authMiddleware/errorHandler/validate/requestLogger/rateLimiter) + AppError 계층 + jwt/password 유틸 + env/api/express 타입 + app/server. 단위 테스트 25건 통과. **bcrypt→bcryptjs 채택**(네이티브 빌드 회피, cost 12 유지) — 전역 남은 문제 1·2번 해소(우회) |
| 2026-05-21 | **api-spec.md 문서 오기 3건 정정** (코드 무수정) — (1) §4-5 DELETE 응답 200+body→204 No Content(validation.md §8-3 기준); (2) §4-2 POST category_id 필수(✓)→선택 integer\|null(data-model.md K-09=B NULL 허용); (3) §4-3·§4-4·§4-5·§4-6 에러 표 AUTH_FORBIDDEN 403 제거→PLAN_NOT_FOUND 404 통일 + 정보 비노출 정책 명시(validation.md §8-3: 403 반환 금지) |

---

## 남은 문제 (전역)

1. **[해소(우회) — Step 2에서 처리] `bcrypt` 네이티브 바이너리 미빌드** — Step 2에서 권장안(B) 채택: 비밀번호 해싱을 순수 JS `bcryptjs`(cost 12, 동일 API)로 구현(`src/utils/password.ts`). 루트 `npm install`로 네이티브 빌드 없이 정상 설치 확인. **잔여 후속:** backend-spec.md §0·§6이 여전히 `bcrypt` 기준 → doc 보완(bcrypt→bcryptjs) 권고. 레거시 `bcrypt`/`@types/bcrypt` 의존성은 미사용 상태로 잔류(정리 시 제거 권장).
2. **[Step 3 후속] 데모 사용자 비밀번호 placeholder** — `demo@planmate.local`이 placeholder 해시로 로그인 불가. Step 3 회원가입 흐름 구현 후 (1) 정식 가입으로 재생성 또는 (2) 시드를 bcryptjs로 보강. (이제 bcryptjs를 쓸 수 있으므로 시드 보강 가능)
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
