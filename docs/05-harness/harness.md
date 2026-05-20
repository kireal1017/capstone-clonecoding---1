# PlanMate 개발 하네스 (Implementation Harness)

> 작성일: 2026-05-20
> 적용 범위: PRD v1.0 + 04-design 문서 (보완 반영 v1.1, design-review.md 전체 결정 사항 포함)
> 원칙: **한 번에 하나의 Step만 구현. Step 완료·검증·progress.md 기록 후 다음 Step 진행.**

---

## 0. 하네스 개요

### 0-1. 목적

설계 문서(PRD v1.0 + 04-design 6개 문서)를 실제 구현으로 옮길 때, 작업 순서·범위·금지 사항·검증 방식을 한 곳에 고정한다. 구현 도중 임의 판단이 개입되는 지점을 최소화하고, 각 Step의 완료 조건을 명문화하여 "어디까지 했는지"를 항상 명확하게 유지한다.

### 0-2. 사용자 흐름

```
harness.md(이 문서)
  └── 각 Step 실행 (§3 파일 범위 엄수)
        └── validation.md 검증 기준 통과
              └── progress.md 기록 (완료 상태·변경 파일·실행 명령어·검증 결과)
                    └── 다음 Step 시작 (한 번에 하나)
```

### 0-3. 도구

| 도구 | 용도 |
|---|---|
| `npx tsc --noEmit` | TypeScript 타입 검사 |
| `npm run lint` | ESLint + Prettier 검사 |
| Vitest | 단위·통합 테스트 |
| supertest | 백엔드 API 통합 테스트 |
| Playwright | E2E 시나리오 테스트 |
| `npx prisma migrate dev` | DB 마이그레이션 실행 |
| `npx prisma migrate status` | 마이그레이션 상태 확인 |
| `npx prisma db seed` | 개발 환경 시드 실행 |

### 0-4. 핵심 결정 사항 요약 (변경 금지)

| 키 | 결정 내용 |
|---|---|
| K-01=A | 다중 사용자 (JWT Access 1h + Refresh 7d httpOnly 쿠키) |
| K-02=B | 카테고리 커스터마이징 허용 |
| K-03=A | 컬러풀 5색 (보라/파랑/빨강/초록/주황) |
| K-04=A | 중요도 우선 정렬 (is_completed → priority → due_time → created_at) |
| K-05=B | 메인 페이지 섹션 순서: 캘린더 → 주간 → 오늘 |
| K-06=A | 프로필 페이지 포함 |
| K-07=B | is_remind 저장만 (알림 실제 발송 없음) |
| K-08=B | 일정 상세 모달 + URL `?planId=` (SSoT) |
| K-09=B | 카테고리 삭제 시 plans.category_id SET NULL |
| K-10=B | display_date 사용자 지정 가능 |

---

## 1. 전체 구현 순서 (Step 0 ~ Step 12)

| Step | 분류 | 목표 | 의존성 |
|---|---|---|---|
| Step 0 | 인프라 | 프로젝트 부트스트랩 (frontend/backend workspace 분리, tsconfig·eslint·prettier·vite 설정, .env 템플릿) | 없음 |
| Step 1 | 백엔드(DB) | Prisma 스키마 + 마이그레이션 + 시드 (5개 기본 카테고리, PRAGMA FK 활성화) | Step 0 |
| Step 2 | 백엔드(미들웨어) | 공통 미들웨어 (authMiddleware, errorHandler, validate, requestLogger, rateLimiter) + AppError 계층 | Step 1 |
| Step 3 | 백엔드(인증) | 인증 API 5개 (register/login/refresh/logout/me) + JWT Token Rotation + refresh_token_hash | Step 2 |
| Step 4 | 백엔드(일정) | 일정 API 6개 (list/create/get/update/delete/complete) + 서버 고정 정렬 + soft delete | Step 3 |
| Step 5 | 백엔드(카테고리) | 카테고리 API 4개 (list/create/update/delete) + UNIQUE 제약 + SET NULL 트랜잭션 | Step 4 |
| Step 6 | 백엔드(프로필) | 프로필 API 4개 (get/update/change-password/avatar 업로드) + multer | Step 5 |
| Step 7 | 프론트(골격) | 라우팅 골격 + httpClient + authStore + 토큰 인터셉터 + Protected Route | Step 0 (Step 3 완료 후 통합) |
| Step 8 | 프론트(인증) | 로그인/회원가입 페이지 + LoginForm/RegisterForm + Zod 스키마 | Step 3, Step 7 |
| Step 9 | 프론트(메인) | 메인 페이지 (MonthlyCalendar + WeeklyPlanBar + TodayPlanList + FAB) + 일정 상세 모달 + CalendarDayPopup | Step 4, Step 8 |
| Step 10 | 프론트(등록/수정) | 할 일 등록/수정 페이지 + PlanForm + 카테고리 칩·중요도 칩 + display_date 연동 | Step 9 |
| Step 11 | 프론트(프로필) | 프로필 페이지 + 카테고리 커스터마이징 모달 + 아바타 업로드 | Step 6, Step 10 |
| Step 12 | 프론트(검색/필터+E2E) | 검색 + PlanFilterBar + SearchResultList + 빈 상태 + 에러 처리 + Playwright E2E | Step 11 |

---

## 2. 각 Step의 목표

### Step 0 — 프로젝트 부트스트랩

- **입력:** 빈 디렉토리
- **출력:** `frontend/`와 `backend/` 두 workspace가 분리된 모노레포 구조, 각각 `package.json`·`tsconfig.json`·`.eslintrc`·`.prettierrc` 완비, `frontend/vite.config.ts`, `backend/.env.example`, 최상위 `README.md`
- **완료 시 갖춰야 하는 상태:** `npm run typecheck`와 `npm run lint`가 양쪽 workspace에서 에러 없이 통과. 실행 가능한 코드는 없어도 됨.

### Step 1 — Prisma 스키마 + 마이그레이션 + 시드

- **입력:** Step 0 인프라
- **출력:** `backend/prisma/schema.prisma` (users·categories·plans 3개 모델, data-model.md §2~§4 완전 반영), 초기 마이그레이션 파일, `backend/prisma/seed.ts` (5개 기본 카테고리), `backend/src/config/prisma.ts` (PRAGMA FK 활성화 포함)
- **완료 시 갖춰야 하는 상태:** `prisma migrate status` → "up to date". 시드 실행 후 users 1건 + categories 5건 확인.

### Step 2 — 공통 미들웨어 + AppError 계층

- **입력:** Step 1 DB
- **출력:** `authMiddleware.ts`, `errorHandler.ts`, `validate.ts`, `requestLogger.ts`, `rateLimiter.ts`, `utils/errors.ts`, `utils/jwt.ts`
- **완료 시 갖춰야 하는 상태:** 각 미들웨어 단위 테스트 통과. 라우터·서비스 파일은 존재하지 않아도 됨.

### Step 3 — 인증 API 5개

- **입력:** Step 2 미들웨어
- **출력:** register / login / refresh / logout / me 엔드포인트 완전 동작, refresh_token_hash DB 저장, Token Rotation 구현, Set-Cookie Path=/api/v1/auth
- **완료 시 갖춰야 하는 상태:** supertest 통합 테스트로 회원가입→로그인→refresh→me→logout 전체 시나리오 통과.

### Step 4 — 일정 API 6개

- **입력:** Step 3 인증
- **출력:** list / create / get / update / delete / complete 엔드포인트, 서버 고정 정렬 (is_completed→priority→due_time→created_at), soft delete (deleted_at), display_date≤due_date Zod refine
- **완료 시 갖춰야 하는 상태:** 인증된 사용자로 일정 CRUD 전체 supertest 통과. 타인 일정 접근 시 404 확인.

### Step 5 — 카테고리 API 4개

- **입력:** Step 4 일정 API
- **출력:** list / create / update / delete 엔드포인트, (userId, name) UNIQUE 제약, 삭제 시 plans.category_id SET NULL (FK ON DELETE SET NULL + PRAGMA FK)
- **완료 시 갖춰야 하는 상태:** 중복 카테고리명 생성 시 409 CATEGORY_NAME_ALREADY_EXISTS. 삭제 후 연결 plans SELECT 결과 category_id=NULL 확인.

### Step 6 — 프로필 API 4개

- **입력:** Step 5 카테고리 API
- **출력:** get / update / change-password / avatar 엔드포인트, multer 아바타 업로드, `/uploads/avatars/` 저장
- **완료 시 갖춰야 하는 상태:** 아바타 업로드 후 `avatar_url` 반환 확인. 비밀번호 변경 후 기존 비밀번호로 로그인 실패 확인.

### Step 7 — 프론트엔드 라우팅 골격 + httpClient

- **입력:** Step 0 (Step 3 완료 후 백엔드 통합)
- **출력:** React Router v6 라우팅, Protected Route, httpClient (axios 인터셉터: 401→refresh→재시도), authStore (Zustand: user·accessToken·isAuthenticated)
- **완료 시 갖춰야 하는 상태:** 비로그인 상태에서 `/` 접근 시 `/login` 리다이렉트. 인터셉터 단위 테스트 통과.

### Step 8 — 로그인/회원가입 페이지

- **입력:** Step 3, Step 7
- **출력:** LoginPage, AuthPage, LoginForm, RegisterForm, Zod 스키마 (login.schema.ts, register.schema.ts)
- **완료 시 갖춰야 하는 상태:** 회원가입→/login 리다이렉트→로그인→/ 메인 진입 흐름이 브라우저에서 정상 동작. RTL 컴포넌트 테스트 통과.

### Step 9 — 메인 페이지 (캘린더·주간·오늘 + 상세 모달)

- **입력:** Step 4, Step 8
- **출력:** MonthlyCalendar, WeeklyPlanBar, TodayPlanList, PlanCard, PlanDetailModal (K-08: URL ?planId=), CalendarDayPopup, CreatePlanFAB, 관련 hooks·stores
- **완료 시 갖춰야 하는 상태:** Playwright P-01 시나리오 통과. PlanCard 클릭 시 URL에 ?planId= 추가 및 모달 오픈 확인.

### Step 10 — 할 일 등록/수정 페이지

- **입력:** Step 9
- **출력:** PlanCreatePage, PlanForm (카테고리 칩·중요도 칩·display_date 연동), 수정 모드 인라인 편집 (PlanDetailModal 내)
- **완료 시 갖춰야 하는 상태:** Playwright P-02 시나리오 통과. display_date > due_date 입력 시 422 에러 표시 확인.

### Step 11 — 프로필 페이지 + 카테고리 관리

- **입력:** Step 6, Step 10
- **출력:** ProfilePage, CategoryList, CategoryFormModal, AvatarUpload, ProfileForm, PasswordForm
- **완료 시 갖춰야 하는 상태:** Playwright P-06 시나리오 통과. 카테고리 삭제 후 연결 일정 "미분류" 표시 확인.

### Step 12 — 검색·필터 + 빈 상태 + E2E

- **입력:** Step 11
- **출력:** SearchBar (debounce 300ms), PlanFilterBar (카테고리·중요도·완료 여부 칩), SearchResultList (캘린더/주간 바 숨김), 공통 빈 상태 컴포넌트, Playwright 전체 시나리오 (P-01~P-08)
- **완료 시 갖춰야 하는 상태:** Playwright P-01~P-08 모두 통과. `npm run test` 전체 통과.

---

## 3. 각 Step에서 수정 가능한 파일 범위

**주의:** 아래에 명시되지 않은 파일은 해당 Step에서 수정·생성 금지.

### Step 0
허용:
- `package.json`, `frontend/package.json`, `backend/package.json`
- `tsconfig*.json` (최상위, frontend/, backend/ 각각)
- `.eslintrc.*`, `.prettierrc`, `.eslintignore`, `.prettierignore`
- `frontend/vite.config.ts`, `frontend/tailwind.config.ts`, `frontend/postcss.config.js`
- `backend/.env.example`, `.env.example`
- `README.md`, `.gitignore`, `.npmrc`

금지: 그 외 모든 소스 파일.

### Step 1
허용:
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/**`
- `backend/prisma/seed.ts`
- `backend/src/config/prisma.ts`
- `backend/src/utils/dateUtil.ts` (nowKST 함수)

금지: 라우터·컨트롤러·서비스·미들웨어 수정.

### Step 2
허용:
- `backend/src/middlewares/authMiddleware.ts`
- `backend/src/middlewares/errorHandler.ts`
- `backend/src/middlewares/validate.ts`
- `backend/src/middlewares/requestLogger.ts`
- `backend/src/middlewares/rateLimiter.ts`
- `backend/src/utils/errors.ts`
- `backend/src/utils/jwt.ts`
- `backend/src/utils/password.ts`
- `backend/src/types/express.d.ts`
- `backend/src/types/api.ts`
- `backend/src/config/env.ts`
- `backend/src/app.ts` (미들웨어 등록만)
- `backend/src/server.ts`
- `backend/tests/unit/middlewares/**`

금지: 라우터·서비스·리포지토리 수정.

### Step 3
허용:
- `backend/src/routes/auth.route.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/repositories/user.repository.ts`
- `backend/src/schemas/auth.schema.ts`
- `backend/tests/integration/auth.test.ts`

금지: plans/categories/profile 관련 파일 작업.

### Step 4
허용:
- `backend/src/routes/plans.route.ts`
- `backend/src/controllers/plans.controller.ts`
- `backend/src/services/plans.service.ts`
- `backend/src/repositories/plan.repository.ts`
- `backend/src/schemas/plan.schema.ts`
- `backend/tests/integration/plans.test.ts`

금지: auth/categories/profile 관련 파일 작업.

### Step 5
허용:
- `backend/src/routes/categories.route.ts`
- `backend/src/controllers/categories.controller.ts`
- `backend/src/services/categories.service.ts`
- `backend/src/repositories/category.repository.ts`
- `backend/src/schemas/category.schema.ts`
- `backend/tests/integration/categories.test.ts`

금지: auth/plans/profile 관련 파일 작업.

### Step 6
허용:
- `backend/src/routes/profile.route.ts`
- `backend/src/controllers/profile.controller.ts`
- `backend/src/services/profile.service.ts`
- `backend/src/middlewares/upload.ts`
- `backend/src/schemas/profile.schema.ts`
- `backend/uploads/.gitkeep`
- `backend/tests/integration/profile.test.ts`

금지: auth/plans/categories 관련 파일 작업.

### Step 7
허용:
- `frontend/src/routes/**`
- `frontend/src/lib/api/httpClient.ts`
- `frontend/src/lib/auth/**`
- `frontend/src/features/auth/stores/authStore.ts`
- `frontend/src/features/auth/hooks/useAuth.ts`
- `frontend/src/components/ui/Spinner.tsx` (로딩 폴백용)
- `frontend/tests/unit/httpClient.test.ts`
- `frontend/tests/unit/authStore.test.ts`

금지: 페이지 컴포넌트, 기능 컴포넌트 작업.

### Step 8
허용:
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/AuthPage.tsx`
- `frontend/src/features/auth/components/LoginForm.tsx`
- `frontend/src/features/auth/components/RegisterForm.tsx`
- `frontend/src/features/auth/schemas/login.schema.ts`
- `frontend/src/features/auth/schemas/register.schema.ts`
- `frontend/src/features/auth/api/login.ts`
- `frontend/src/features/auth/api/register.ts`
- `frontend/src/features/auth/api/logout.ts`
- `frontend/src/features/auth/api/refresh.ts`
- `frontend/src/features/auth/hooks/useLogin.ts`
- `frontend/src/features/auth/hooks/useRegister.ts`
- `frontend/src/features/auth/hooks/useLogout.ts`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Toast.tsx`
- `frontend/tests/unit/auth/**`

금지: 메인·일정·카테고리·프로필 관련 파일 작업.

### Step 9
허용:
- `frontend/src/pages/MainPage.tsx`
- `frontend/src/features/plans/components/PlanCard.tsx`
- `frontend/src/features/plans/components/PlanDetailModal.tsx`
- `frontend/src/features/plans/components/TodayPlanList.tsx`
- `frontend/src/features/plans/components/CreatePlanFAB.tsx`
- `frontend/src/features/plans/api/getPlans.ts`
- `frontend/src/features/plans/api/getPlan.ts`
- `frontend/src/features/plans/api/completePlan.ts`
- `frontend/src/features/plans/hooks/usePlans.ts`
- `frontend/src/features/plans/hooks/usePlan.ts`
- `frontend/src/features/plans/hooks/useCompletePlan.ts`
- `frontend/src/features/plans/stores/planStore.ts`
- `frontend/src/features/calendar/components/MonthlyCalendar.tsx`
- `frontend/src/features/calendar/components/CalendarCell.tsx`
- `frontend/src/features/calendar/components/CalendarHeader.tsx`
- `frontend/src/features/calendar/components/CalendarDayPopup.tsx`
- `frontend/src/features/calendar/hooks/useCalendar.ts`
- `frontend/src/features/calendar/stores/calendarStore.ts`
- `frontend/src/features/plans/components/WeeklyPlanBar.tsx`
- `frontend/src/components/ui/Modal.tsx`
- `frontend/src/components/ui/Checkbox.tsx`
- `frontend/src/components/ui/Badge.tsx`
- `frontend/src/components/ui/FAB.tsx`
- `frontend/src/components/ui/Avatar.tsx`
- `frontend/src/components/ui/Chip.tsx`
- `frontend/tests/unit/plans/**`
- `frontend/tests/unit/calendar/**`
- `frontend/e2e/main.spec.ts`

금지: 등록·프로필·카테고리·검색 관련 파일 작업.

### Step 10
허용:
- `frontend/src/pages/PlanCreatePage.tsx`
- `frontend/src/features/plans/components/PlanForm.tsx`
- `frontend/src/features/plans/api/createPlan.ts`
- `frontend/src/features/plans/api/updatePlan.ts`
- `frontend/src/features/plans/api/deletePlan.ts`
- `frontend/src/features/plans/hooks/useCreatePlan.ts`
- `frontend/src/features/plans/hooks/useUpdatePlan.ts`
- `frontend/src/features/plans/hooks/useDeletePlan.ts`
- `frontend/src/features/plans/schemas/plan.schema.ts`
- `frontend/src/components/ui/ConfirmModal.tsx`
- `frontend/src/components/ui/Textarea.tsx`
- `frontend/tests/unit/PlanForm.test.tsx`
- `frontend/e2e/plan-create.spec.ts`

금지: 프로필·카테고리·검색 관련 파일 작업.

### Step 11
허용:
- `frontend/src/pages/ProfilePage.tsx`
- `frontend/src/features/categories/components/CategoryChip.tsx`
- `frontend/src/features/categories/components/CategoryList.tsx`
- `frontend/src/features/categories/components/CategoryFormModal.tsx`
- `frontend/src/features/categories/api/**`
- `frontend/src/features/categories/hooks/**`
- `frontend/src/features/categories/schemas/category.schema.ts`
- `frontend/src/features/profile/components/ProfileForm.tsx`
- `frontend/src/features/profile/components/PasswordForm.tsx`
- `frontend/src/features/profile/components/AvatarUpload.tsx`
- `frontend/src/features/profile/api/**`
- `frontend/src/features/profile/hooks/**`
- `frontend/src/features/profile/schemas/**`
- `frontend/tests/unit/profile/**`
- `frontend/tests/unit/categories/**`
- `frontend/e2e/profile.spec.ts`

금지: 검색·필터 관련 파일 작업.

### Step 12
허용:
- `frontend/src/components/ui/SearchBar.tsx`
- `frontend/src/features/plans/components/PlanFilterBar.tsx`
- `frontend/src/features/plans/components/SearchResultList.tsx`
- `frontend/src/components/ui/EmptyState.tsx`
- `frontend/src/components/ui/ErrorBoundary.tsx`
- `frontend/e2e/search.spec.ts`
- `frontend/e2e/filter.spec.ts`
- `frontend/e2e/auth-flow.spec.ts`
- `frontend/e2e/token-refresh.spec.ts`
- `frontend/e2e/logout.spec.ts`
- `frontend/e2e/category.spec.ts`
- `frontend/e2e/complete-toggle.spec.ts`
- `frontend/playwright.config.ts`
- `frontend/tests/unit/SearchResultList.test.tsx`
- `frontend/tests/unit/PlanFilterBar.test.tsx`

금지: Step 0~11에서 완성된 파일 기능 수정 (버그 수정은 허용, 기능 추가는 금지).

---

## 4. 각 Step에서 참조해야 할 문서

| Step | 1차 참고 | 2차 참고 |
|---|---|---|
| Step 0 | frontend-spec.md §0~§1, backend-spec.md §0~§1 | PRD §39 |
| Step 1 | data-model.md 전체, backend-spec.md §9 | design-review.md DB-01·DB-02·DB-14, DB-03 |
| Step 2 | backend-spec.md §3·§4, api-spec.md §2 | design-review.md BE-05 |
| Step 3 | api-spec.md §3, backend-spec.md §5 | design-review.md BE-01·BE-02·BE-12 |
| Step 4 | api-spec.md §4, backend-spec.md §8-1~§8-3, data-model.md §4 | design-review.md BE-03·BE-04, DB-06·DB-07·DB-12 |
| Step 5 | api-spec.md §5, backend-spec.md §8-4, data-model.md §3 | design-review.md DB-03·DB-09 |
| Step 6 | api-spec.md §6, backend-spec.md §8-5 | screen-flow.md §10, PRD §40 U-06 |
| Step 7 | frontend-spec.md §2·§5·§7-1, screen-flow.md §12 | design-review.md FE-12 |
| Step 8 | wireframe-spec.md §1·§2, screen-flow.md §1 | api-spec.md §3, design-review.md FE-09 |
| Step 9 | wireframe-spec.md §3·§5, frontend-spec.md §3-3, screen-flow.md §2·§4·§5 | design-review.md FE-07·FE-11·FE-12, PRD §22·§23·§24 |
| Step 10 | wireframe-spec.md §4·§5, screen-flow.md §3·§5 | design-review.md FE-06·FE-10, PRD §26 |
| Step 11 | wireframe-spec.md §6·§7, screen-flow.md §10 | api-spec.md §5·§6, design-review.md DB-03 |
| Step 12 | screen-flow.md §8·§9, design-review.md FE-02·FE-03 | validation.md §6 (Playwright 시나리오 P-01~P-08) |

---

## 5. 금지 사항 (전역 규칙)

- **여러 Step을 동시에 진행 금지.** 한 번에 하나의 Step만. progress.md에 이전 Step 완료 기록 없으면 다음 Step 시작 불가.
- **Step에서 명시하지 않은 파일 수정 금지.** 새 파일 추가도 Step 범위 내에서만.
- **PRD §15~§38 확정 요구사항을 임의로 변경 금지.** 변경이 필요하면 별도 회의록 작성 후 PRD v1.1 발행.
- **테스트를 건너뛰고 Step 완료 처리 금지.** validation.md 기준 미충족 시 완료 처리 불가.
- **`@updatedAt`, `@default(now())` 사용 금지** (DB-14 결정: `nowKST()` 명시 전달).
- **`refresh_token` 쿠키를 클라이언트 JS에서 접근 금지** (httpOnly 유지).
- **사용자별 데이터 격리 코드 누락 금지.** `where: { userId }` 필터를 모든 plans/categories 쿼리에 필수 적용.
- **카테고리 색상 그레이스케일 사용 금지.** K-03=A: 컬러풀 5색(보라/파랑/빨강/초록/주황) 고정.
- **알림 실제 발송 구현 금지.** K-07=B: `is_remind` 컬럼 저장 + UI 체크박스만.
- **planStore에 planDetailId 상태 추가 금지.** K-08=B 결정: URL `?planId=`가 SSoT.
- **`display_date > due_date` 조합을 서버가 허용하는 코드 금지.** Zod refine 검증 필수.
- **`PRAGMA foreign_keys = ON` 누락 금지.** K-09 SET NULL이 DB에서 실제 동작해야 함.
- **`any` 타입 사용 금지.** `unknown` 또는 명시적 제네릭 사용.

---

## 6. 프론트엔드/백엔드 구현 순서

### 기본 순서 (백엔드 우선)

```
Step 0 (인프라)
  └── Step 1 (DB)
        └── Step 2 (미들웨어)
              └── Step 3 (인증 API)
                    ├── Step 4 (일정 API)
                    │     └── Step 5 (카테고리 API)
                    │           └── Step 6 (프로필 API)
                    └── Step 7 (프론트 골격, Step 3 완료 후 통합)
                          └── Step 8 (인증 화면)
                                └── Step 9 (메인 페이지)
                                      └── Step 10 (등록/수정)
                                            └── Step 11 (프로필/카테고리)
                                                  └── Step 12 (검색/필터 + E2E)
```

### 병렬 가능 구간

- Step 7 (프론트 골격)은 Step 0 완료 직후 백엔드와 독립적으로 시작 가능. 단, 실제 API 통합 테스트는 Step 3 완료 후 수행.
- Step 4·5·6 (백엔드 도메인 API)은 Step 3 의존이지만, 별도 개발자가 있다면 브랜치로 병렬 진행 가능. 이 경우 각 Step 완료 조건은 동일하게 적용.

---

## 7. DB 마이그레이션 순서

### 7-1. 명령어 규칙

| 상황 | 명령어 |
|---|---|
| 초기 마이그레이션 (Step 1) | `npx prisma migrate dev --name 20260520_init` |
| 스키마 변경 추가 | `npx prisma migrate dev --name <yyyymmdd>_<변경_설명>` |
| 운영 배포 | `npx prisma migrate deploy` |
| 개발 DB 초기화 | `npx prisma migrate reset` (개발 전용, 데이터 전체 삭제) |

### 7-2. 초기 마이그레이션 포함 내용 (Step 1에서 단 1회)

- `users` 테이블 전체 컬럼 (refresh_token_hash 포함)
- `categories` 테이블 전체 컬럼 (`@@unique([userId, name])` 포함)
- `plans` 테이블 전체 컬럼 (soft delete deleted_at 포함)
- 복합 인덱스: `idx_plans_user_display`, `idx_plans_user_due`, `idx_plans_deleted`
- CHECK 제약: `priority IN ('high','normal','low')`, `is_completed IN (0,1)`, `is_remind IN (0,1)`

### 7-3. 롤백 정책

SQLite는 `ALTER TABLE DROP COLUMN` 등 일부 DDL 제한이 있으므로, 스키마 변경 전 `backend/prisma/planmate.db` 파일을 날짜 접미사로 백업한다. 운영 환경에서는 백업 파일 복원으로 롤백한다.

---

## 8. API 구현 순서

### 8-1. Step 3 인증 API 구현 순서

각 엔드포인트는 `routes → controllers → services → repositories` 순서로 구현한다.

```
1. POST /api/v1/auth/register (회원가입 + 카테고리 시드 트랜잭션)
2. POST /api/v1/auth/login    (bcrypt 비교 + JWT 발급 + Set-Cookie)
3. POST /api/v1/auth/refresh  (Token Rotation: 검증→새 토큰 발급→hash 교체)
4. POST /api/v1/auth/logout   (hash NULL + Set-Cookie Max-Age=0)
5. GET  /api/v1/auth/me       (authMiddleware + users 조회)
```

### 8-2. Step 4 일정 API 구현 순서

```
1. GET    /api/v1/plans          (목록 + 고정 정렬 + 필터 + deleted_at IS NULL)
2. POST   /api/v1/plans          (생성 + display_date≤due_date 검증)
3. GET    /api/v1/plans/:id      (단건 조회 + userId 격리)
4. PATCH  /api/v1/plans/:id      (부분 수정 + userId 격리 + nowKST updated_at)
5. DELETE /api/v1/plans/:id      (soft delete: deleted_at=nowKST())
6. PATCH  /api/v1/plans/:id/complete (is_completed 토글)
```

### 8-3. Step 5 카테고리 API 구현 순서

```
1. GET    /api/v1/categories     (사용자 카테고리 목록, sort_order 순)
2. POST   /api/v1/categories     (생성 + UNIQUE 제약 + 409 처리)
3. PUT    /api/v1/categories/:id (전체 교체: name·color·sort_order 모두 필수)
4. DELETE /api/v1/categories/:id (삭제 → FK ON DELETE SET NULL 동작 확인)
```

### 8-4. Step 6 프로필 API 구현 순서

```
1. GET   /api/v1/profile
2. PATCH /api/v1/profile          (nickname·avatar_url)
3. PATCH /api/v1/profile/password (현재 비밀번호 검증 → bcrypt compare → 새 해시)
4. POST  /api/v1/profile/avatar   (multer single → /uploads/avatars/ 저장 → avatar_url 업데이트)
```

---

## 9. UI 구현 순서

### Step 7 — 라우팅 + httpClient + 가드

Protected Route 구현 후 인터셉터 단위 테스트로 401→refresh→재시도 흐름 검증.

### Step 8 — 인증 화면

간단한 화면이므로 먼저 구현하여 토큰 발급·저장·갱신 전체 흐름을 검증하는 기반으로 활용.

### Step 9 — 메인 페이지 (가장 복잡)

캘린더·주간·오늘 세 섹션이 하나의 페이지에 공존. 구현 순서:
1. MonthlyCalendar (6×7 격자, 이전/다음 월 이동)
2. CalendarDayPopup (날짜 셀 클릭 → 미니 팝업)
3. TodayPlanList + PlanCard (오늘 기준 display_date 필터)
4. WeeklyPlanBar (주간 display_date 집계, 클릭 확장/접힘)
5. PlanDetailModal (URL ?planId= 연동, 모달 닫기 시 URL에서 planId 제거)
6. CreatePlanFAB (fixed 우측 하단, /plans/new 이동)

낙관적 업데이트(완료 토글)는 useMutation onMutate/onError/onSettled 패턴으로 구현.

### Step 10 — 등록/수정 화면

- 등록: display_date 초기값 = due_date (사용자 변경 가능)
- 수정: PlanDetailModal 내 인라인 편집 (별도 페이지 이동 없음)
- 헤더 ← 클릭 = 취소 버튼과 동일하게 취소 확인 모달 트리거 (FE-06 결정)

### Step 11 — 프로필/카테고리 관리

카테고리 삭제 시 확인 모달 → 삭제 → 연결 일정의 카테고리 표시가 "미분류"로 변경되는지 화면에서 직접 확인.

### Step 12 — 검색/필터 + E2E

검색 모드 진입 시 캘린더·주간 바 `hidden` 처리 (CSS visibility 아닌 조건부 렌더링). SearchResultList는 전체 기간 대상. Playwright 시나리오 P-01~P-08 전부 구현.

---

## 10. Step 완료 조건 (Definition of Done)

### 공통 DoD (모든 Step 필수)

- [ ] Step 범위 내 모든 파일 수정 완료
- [ ] `npm run typecheck` 통과 (TypeScript 에러 0개, strict 모드)
- [ ] `npm run lint` 통과 (ESLint 에러 0개, Prettier 포맷 일치)
- [ ] 해당 Step의 단위/통합 테스트 추가 및 통과
- [ ] validation.md의 해당 Step 검증 항목 통과
- [ ] progress.md에 Step 완료 기록 (상태·시각·변경 파일·실행 명령어·검증 결과)
- [ ] 임시 코드(console.log, TODO, HACK, debugger) 0건

### Step별 추가 DoD

| Step | 추가 완료 조건 |
|---|---|
| Step 0 | 디렉토리 구조 확인 (`frontend/`, `backend/` 분리), `npm install` 양쪽 성공 |
| Step 1 | `prisma migrate status` → "up to date", `PRAGMA foreign_keys` = 1, 시드 후 categories 5건 확인 |
| Step 2 | 미들웨어 단위 테스트 전체 통과, AppError 계층 정의 완료 |
| Step 3 | 회원가입→로그인→refresh→me→logout 전체 supertest 통과, refresh_token_hash DB 저장 확인 |
| Step 4 | 일정 CRUD 전체 supertest 통과, 고정 정렬 순서 검증, soft delete(deleted_at) 확인, 타인 일정 404 확인 |
| Step 5 | 중복 카테고리명 409 확인, 삭제 후 plans.category_id = NULL 확인, supertest 통과 |
| Step 6 | 아바타 업로드 후 `/uploads/avatars/` 파일 존재 확인, avatar_url 반환 확인 |
| Step 7 | 비로그인 `/` 접근 → `/login` 리다이렉트 확인, 인터셉터 401→refresh→재시도 단위 테스트 통과 |
| Step 8 | 회원가입→로그인→메인 진입 브라우저 수동 확인, RTL LoginForm/RegisterForm 테스트 통과 |
| Step 9 | Playwright P-01·P-03·P-04 통과, CalendarDayPopup·PlanDetailModal(?planId=) 동작 확인 |
| Step 10 | Playwright P-02 통과, display_date > due_date 422 에러 UI 표시 확인 |
| Step 11 | Playwright P-06 통과, 카테고리 삭제 후 연결 일정 "미분류" 표시 확인 |
| Step 12 | Playwright P-01~P-08 전체 통과, `npm run test` 전체 통과 |

---

## 11. 오류 발생 시 처리 방식

### 11-1. 컴파일·타입 에러

1. 즉시 중단 → 원인 분석 → 단일 root cause 수정 → 재실행
2. 동일 에러 5회 이상 반복 → progress.md "남은 문제"에 기록 후 해당 Step 보류
3. 보류 상태에서 자체 우회 금지. 사용자 결정 대기.

### 11-2. 테스트 실패

- 단위 테스트 실패: 테스트가 사양을 검증하므로 코드 수정. 테스트 자체를 완화하는 수정 금지.
- 통합 테스트 실패: 서비스·리포지토리 계층 디버깅. 미들웨어 체인 순서 먼저 확인.
- E2E 실패: Playwright 트레이스(`--reporter=html`) 분석 → UI/API 동기화 문제 우선 의심. 타이밍 이슈라면 `waitForResponse`·`waitForSelector` 사용. 임의 `sleep` 추가 금지.

### 11-3. 마이그레이션 충돌

- 개발 환경: `npx prisma migrate reset` 후 재적용 (데이터 초기화 동의 필수 확인)
- 충돌이 발생한 마이그레이션 파일을 직접 편집하지 말 것. 새 마이그레이션으로 수정.
- 운영 환경: DB 백업 복원 → 마이그레이션 수정 후 재배포

### 11-4. 설계 모순 발견

- design-review.md §5 (PRD 수정 필요 항목 P-01~P-05)에 추가 기록
- 발견한 Step에서 임시 우회 처리 후 progress.md "남은 문제"에 명시
- 임시 우회 코드에는 `// FIXME: [날짜] [이슈 내용]` 주석 필수. 다음 Step 시작 전 해소 권장.

### 11-5. 3회 이상 동일 이슈 반복

progress.md에 재현 조건·시도한 수정·실패 원인을 기록하고, Step을 보류 상태로 변경. 사용자 결정 후 재개.

---

## 12. progress.md 기록 규칙

### 12-1. 기록 시점

| 시점 | 기록 내용 |
|---|---|
| Step 시작 시 | 상태 "진행 중", 시작 시각(KST ISO 8601), 의도 한 줄 |
| 주요 마일스톤 | 작업 노트 한 줄 (예: "authMiddleware 단위 테스트 3건 통과") |
| Step 완료 시 | 상태 "완료", 완료 시각, 변경 파일 목록, 실행 명령어, 검증 결과 체크리스트 |
| 오류 발생 시 | "남은 문제" 섹션에 추가 (해결 시 삭제) |
| 보류 시 | 상태 "보류", 보류 이유, 사용자 결정 필요 사항 명시 |

### 12-2. 기록 형식

progress.md §각 Step 섹션 내에 아래 필드를 채운다.

```
- 상태: 진행 중 | 완료 | 보류
- 시작: YYYY-MM-DDTHH:mm:ss+09:00
- 완료: YYYY-MM-DDTHH:mm:ss+09:00
- 변경 파일: [파일 경로 목록]
- 실행 명령어: [명령어 목록]
- 검증 결과: [체크리스트 항목별 통과/실패]
- 남은 문제: [없음 또는 이슈 설명]
```

### 12-3. 진행 규칙

- **한 Step 완료 기록 전에는 다음 Step 시작 금지.** 이 규칙은 하네스의 핵심이며, 예외 없음.
- "보류" 상태는 사용자 결정 대기 — 자체적으로 우회하지 말 것.
- 대시보드 표(§진행 요약)의 상태 칸을 Step 완료 시마다 즉시 갱신.
