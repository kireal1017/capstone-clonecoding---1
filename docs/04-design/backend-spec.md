# PlanMate 백엔드 설계서

> 작성일: 2026-05-20
> 버전: 1.0
> 기반 문서: PRD v1.0 (§7, §19, §20, §33, §34, §35)

---

## 0. 기술 스택

[PRD 확정] PRD §7

| 항목 | 라이브러리/버전 | 역할 |
|---|---|---|
| 런타임 | Node.js 20 LTS + TypeScript | 서버 실행 환경 |
| 프레임워크 | Express.js + express-async-errors | REST API 서버 |
| ORM | Prisma (SQLite 어댑터) | DB 접근 |
| DB | SQLite 3 | 단일 파일 데이터베이스 |
| 인증 | jsonwebtoken | JWT 생성·검증 |
| 비밀번호 해싱 | bcrypt (cost 12) | 비밀번호 해싱·비교 |
| 파일 업로드 | multer | 아바타 이미지 multipart 처리 |
| 입력 검증 | Zod | 스키마 검증 (미들웨어) |
| CORS | cors 패키지 | 도메인 화이트리스트 |
| 보안 헤더 | helmet | HTTP 보안 헤더 설정 |
| Rate Limit | express-rate-limit | 인증 엔드포인트 5req/min/IP |
| 로깅 | morgan | 요청 로깅 |
| 테스트 | Vitest + supertest | 단위·통합 테스트 |

---

## 1. 폴더 구조

[AI 제안안] 4계층 아키텍처 (routes → controllers → services → repositories)

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.route.ts          # /api/v1/auth/*
│   │   ├── plans.route.ts         # /api/v1/plans/*
│   │   ├── categories.route.ts    # /api/v1/categories/*
│   │   └── profile.route.ts       # /api/v1/profile/*
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts     # 요청 파싱, 응답 포맷팅
│   │   ├── plans.controller.ts
│   │   ├── categories.controller.ts
│   │   └── profile.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts        # 비즈니스 로직 (회원가입 트랜잭션 등)
│   │   ├── plans.service.ts
│   │   ├── categories.service.ts
│   │   └── profile.service.ts
│   │
│   ├── repositories/
│   │   ├── user.repository.ts     # Prisma 쿼리 (users 테이블)
│   │   ├── plan.repository.ts     # Prisma 쿼리 (plans 테이블)
│   │   └── category.repository.ts # Prisma 쿼리 (categories 테이블)
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.ts      # JWT 검증, req.user 주입
│   │   ├── validate.ts            # Zod 스키마 검증 팩토리
│   │   ├── errorHandler.ts        # 전역 에러 핸들러
│   │   ├── requestLogger.ts       # morgan 기반 요청 로거
│   │   └── rateLimiter.ts         # express-rate-limit 인증용
│   │
│   ├── schemas/                   # Zod 공유 스키마 (프론트와 타입 공유 가능)
│   │   ├── auth.schema.ts         # RegisterSchema, LoginSchema
│   │   ├── plan.schema.ts         # CreatePlanSchema, UpdatePlanSchema
│   │   ├── category.schema.ts     # CreateCategorySchema, UpdateCategorySchema
│   │   └── profile.schema.ts      # UpdateProfileSchema, ChangePasswordSchema
│   │
│   ├── utils/
│   │   ├── jwt.ts                 # generateAccessToken, generateRefreshToken, verifyToken
│   │   ├── password.ts            # hashPassword, comparePassword (bcrypt 래핑)
│   │   ├── dateUtil.ts            # nowKST(), formatDateKST() — date-fns v3
│   │   └── errors.ts              # AppError 계층 클래스 정의
│   │
│   ├── types/
│   │   ├── express.d.ts           # req.user 타입 확장 (AuthUser 인터페이스)
│   │   └── api.ts                 # ApiResponse<T>, ApiError 타입
│   │
│   ├── config/
│   │   ├── env.ts                 # 환경변수 로드·검증 (dotenv + Zod)
│   │   └── prisma.ts              # Prisma Client 싱글톤
│   │
│   ├── app.ts                     # Express 앱 초기화, 미들웨어·라우터 등록
│   └── server.ts                  # HTTP 서버 listen
│
├── prisma/
│   ├── schema.prisma              # Prisma 스키마 정의
│   ├── migrations/                # 마이그레이션 파일
│   ├── planmate.db                # SQLite DB 파일 (gitignore)
│   └── seed.ts                    # 개발 환경 초기 데이터
│
├── uploads/
│   └── avatars/                   # 아바타 이미지 저장 (gitignore)
│
├── tests/
│   ├── unit/                      # 서비스·유틸 단위 테스트
│   └── integration/               # 라우터 통합 테스트 (supertest)
│
├── .env                           # 환경변수 (gitignore)
├── .env.example                   # 환경변수 템플릿
├── package.json
└── tsconfig.json
```

---

## 2. 요청 처리 흐름

[PRD 확정] PRD §7 4계층 아키텍처

```
HTTP Request
  │
  ├── [미들웨어 체인]
  │     ├── helmet()                  # 보안 헤더
  │     ├── cors(config)              # CORS 허용
  │     ├── express.json()            # JSON 파싱
  │     └── requestLogger             # 요청 로깅
  │
  ├── routes/plans.route.ts
  │     └── [라우트별 미들웨어]
  │           ├── rateLimiter         # 인증 엔드포인트만
  │           ├── authMiddleware       # Protected 경로
  │           └── validate(schema)    # Zod 검증
  │
  ├── controllers/plans.controller.ts
  │     └── req 파싱 (body, params, query) → service 호출 → 응답 포맷팅
  │
  ├── services/plans.service.ts
  │     └── 비즈니스 로직 (소유권 검증, 정렬, 트랜잭션)
  │
  ├── repositories/plan.repository.ts
  │     └── Prisma Client 쿼리
  │
  └── [전역 에러 핸들러]
        └── errorHandler.ts          # AppError → 표준 에러 응답
```

---

## 3. 라우터-컨트롤러-서비스 매핑 표

[PRD 확정] PRD §20 엔드포인트 전체

### 3-1. 인증 라우터 (`auth.route.ts`)

| HTTP | 경로 | 미들웨어 | 컨트롤러 함수 |
|---|---|---|---|
| POST | `/api/v1/auth/register` | `rateLimiter`, `validate(RegisterSchema)` | `authController.register` |
| POST | `/api/v1/auth/login` | `rateLimiter`, `validate(LoginSchema)` | `authController.login` |
| POST | `/api/v1/auth/refresh` | — | `authController.refresh` |
| POST | `/api/v1/auth/logout` | `authMiddleware` | `authController.logout` |
| GET | `/api/v1/auth/me` | `authMiddleware` | `authController.me` |

### 3-2. 일정 라우터 (`plans.route.ts`)

| HTTP | 경로 | 미들웨어 | 컨트롤러 함수 |
|---|---|---|---|
| GET | `/api/v1/plans` | `authMiddleware` | `plansController.list` |
| POST | `/api/v1/plans` | `authMiddleware`, `validate(CreatePlanSchema)` | `plansController.create` |
| GET | `/api/v1/plans/:id` | `authMiddleware` | `plansController.get` |
| PATCH | `/api/v1/plans/:id` | `authMiddleware`, `validate(UpdatePlanSchema)` | `plansController.update` |
| DELETE | `/api/v1/plans/:id` | `authMiddleware` | `plansController.remove` |
| PATCH | `/api/v1/plans/:id/complete` | `authMiddleware` | `plansController.toggleComplete` |

### 3-3. 카테고리 라우터 (`categories.route.ts`)

| HTTP | 경로 | 미들웨어 | 컨트롤러 함수 |
|---|---|---|---|
| GET | `/api/v1/categories` | `authMiddleware` | `categoriesController.list` |
| POST | `/api/v1/categories` | `authMiddleware`, `validate(CreateCategorySchema)` | `categoriesController.create` |
| PUT | `/api/v1/categories/:id` | `authMiddleware`, `validate(UpdateCategorySchema)` | `categoriesController.update` |
| DELETE | `/api/v1/categories/:id` | `authMiddleware` | `categoriesController.remove` |

### 3-4. 프로필 라우터 (`profile.route.ts`)

| HTTP | 경로 | 미들웨어 | 컨트롤러 함수 |
|---|---|---|---|
| GET | `/api/v1/profile` | `authMiddleware` | `profileController.get` |
| PATCH | `/api/v1/profile` | `authMiddleware`, `validate(UpdateProfileSchema)` | `profileController.update` |
| PATCH | `/api/v1/profile/password` | `authMiddleware`, `validate(ChangePasswordSchema)` | `profileController.changePassword` |
| POST | `/api/v1/profile/avatar` | `authMiddleware`, `multer.single('avatar')` | `profileController.uploadAvatar` |

---

## 4. 미들웨어 상세

### 4-1. authMiddleware (`middlewares/authMiddleware.ts`)

[PRD 확정] PRD §19-2

**동작 순서:**
1. `req.headers.authorization` 에서 `Bearer <token>` 추출
2. 없거나 형식 오류 → `throw new AuthError('AUTH_UNAUTHORIZED', 401)`
3. `jwt.verify(token, JWT_ACCESS_SECRET)` 실행
4. 만료 시 → `throw new AuthError('AUTH_UNAUTHORIZED', 401)` (클라이언트가 /refresh 호출)
5. 서명 불일치 → `throw new AuthError('AUTH_INVALID_TOKEN', 401)`
6. 성공 시 → `req.user = { id: userId, email }` 주입

**Express 타입 확장 (`types/express.d.ts`):**

```typescript
// 의사 정의
namespace Express {
  interface Request {
    user?: { id: number; email: string }
  }
}
```

### 4-2. validate(schema) (`middlewares/validate.ts`)

[PRD 확정] PRD §34

**동작:**
- `schema.safeParse(req.body)` 실행
- 실패 시 → `throw new ValidationError('VALIDATION_FAILED', zod.errors)`
- `req.query`, `req.params` 검증도 동일 팩토리로 처리 (`validate(schema, 'query')` 형태) [AI 제안안]

**사용 예시 (의사 코드):**

```
router.post('/register', validate(RegisterSchema, 'body'), controller.register)
router.get('/plans', validate(GetPlansQuerySchema, 'query'), controller.list)
```

### 4-3. errorHandler (`middlewares/errorHandler.ts`)

[PRD 확정] PRD §35

**위치:** `app.ts` 에서 모든 라우터 등록 후 마지막 미들웨어로 등록

**처리 규칙:**

| 에러 타입 | HTTP | 응답 |
|---|---|---|
| `AppError` 인스턴스 | `AppError.statusCode` | `{ success: false, error: { code, message } }` |
| `ValidationError` (AppError 하위) | 422 | `{ success: false, error: { code, message, details } }` |
| Prisma `P2002` (unique 제약) | 409 | `EMAIL_ALREADY_EXISTS` 로 변환 |
| Prisma `P2025` (레코드 없음) | 404 | `PLAN_NOT_FOUND` 또는 `CATEGORY_NOT_FOUND` 로 변환 |
| multer `LIMIT_FILE_SIZE` | 400 | `FILE_TOO_LARGE` |
| 기타 모든 에러 | 500 | `INTERNAL_SERVER_ERROR` (상세 내용 클라이언트에 미노출) |

**개발 환경:** 500 에러 시 `error.stack` 로그 출력 (운영 환경 제외)

### 4-4. rateLimiter (`middlewares/rateLimiter.ts`)

[PRD 확정] PRD §19-5

- `express-rate-limit` 사용
- 대상: `POST /auth/register`, `POST /auth/login`
- 제한: 5req/min/IP
- 초과 시: 429 + `{ success: false, error: { code: 'TOO_MANY_REQUESTS', message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' } }`

### 4-5. multer 설정 (`routes/profile.route.ts` 내 설정)

[PRD 확정] PRD §12-9

- 저장 위치: `diskStorage` → `uploads/avatars/{userId}_{timestamp}.{ext}`
- 허용 MIME: `image/jpeg`, `image/png`, `image/webp`
- 최대 파일 크기: 5MB [AI 제안안] (PRD 미명시)
- 허용 외 파일 → `throw new AppError('INVALID_FILE_TYPE', 400)`

---

## 5. JWT 처리

[PRD 확정] PRD §19-1

### 5-1. 토큰 생성 (`utils/jwt.ts`)

| 함수 | 페이로드 | 유효기간 | 비밀키 |
|---|---|---|---|
| `generateAccessToken(userId, email)` | `{ userId, email }` | `1h` | `JWT_ACCESS_SECRET` |
| `generateRefreshToken(userId)` | `{ userId }` | `7d` | `JWT_REFRESH_SECRET` |

### 5-2. 토큰 검증

```
verifyToken(token, secret) → DecodedPayload | throws AuthError
```

### 5-3. Refresh 흐름 (`authService.refresh`)

**[BE-02] Token Rotation 채택 확정:**

1. 요청 쿠키에서 `refresh_token` 추출 → 없으면 401
2. `verifyToken(refreshToken, JWT_REFRESH_SECRET)` → 실패 시 401 `AUTH_REFRESH_EXPIRED`
3. `userId`로 사용자 조회 → 없으면 401
4. **[BE-01] DB에서 `users.refresh_token_hash` 조회 → `bcrypt.compare(refreshToken, hash)` 비교**
   - 불일치 시(재사용 감지): `users.refresh_token_hash = NULL` 설정(전체 세션 폐기) → 401
5. 새 Access Token 생성 → 응답 body
6. **Token Rotation: 새 Refresh Token 생성 → `Set-Cookie` 갱신**
7. **새 Refresh Token의 hash를 `users.refresh_token_hash`에 저장 (BE-01)**

**[BE-01] 로그인/로그아웃 시 refresh_token_hash 처리:**
- 로그인 시: 새 Refresh Token 발급 → `bcrypt.hash(token, 10)` → `users.refresh_token_hash` 저장
- 로그아웃 시: `users.refresh_token_hash = NULL` 설정 (서버 측 무효화)
- Refresh 재사용 감지(이전 토큰으로 재요청): `refresh_token_hash = NULL` → 전체 세션 폐기

### 5-4. 쿠키 설정 (`authService.login`, `authService.refresh`)

**[BE-12] Refresh Token 쿠키 Path 정책 확정 — (A) 권장안 채택:**
- Refresh Token 쿠키 Path를 `/api/v1/auth`로 변경
- 이로써 `/api/v1/auth/refresh`(갱신)와 `/api/v1/auth/logout`(로그아웃) 양쪽에서 쿠키 수신 가능
- 로그아웃 응답의 `Set-Cookie` 삭제 헤더에도 동일 Path(`/api/v1/auth`) 명시 필수

```
Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Lax;
            Path=/api/v1/auth; Max-Age=604800
```

로그아웃 시 쿠키 삭제:
```
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Lax;
            Path=/api/v1/auth; Max-Age=0
```

- `HttpOnly`: XSS 방지
- `Secure`: HTTPS에서만 전송 (개발 환경 `NODE_ENV !== 'production'`이면 생략)
- `SameSite=Lax`: CSRF 방지
- `Path=/api/v1/auth`: refresh + logout 엔드포인트 모두 쿠키 수신 (BE-12)

---

## 6. 비밀번호 해싱

[PRD 확정] PRD §19-6, §12-1

`utils/password.ts`

| 함수 | 동작 |
|---|---|
| `hashPassword(plaintext)` | `bcrypt.hash(plaintext, 12)` → hash 문자열 반환 |
| `comparePassword(plaintext, hash)` | `bcrypt.compare(plaintext, hash)` → boolean 반환 |

- bcrypt cost factor: 12 [PRD 확정]
- 최대 처리 길이: 72자 (bcrypt 제한, Zod 스키마에서 max 72 검증)
- 원문 비밀번호 로그 출력 금지

---

## 7. 에러 클래스 계층 (`utils/errors.ts`)

[AI 제안안] AppError 계층 구조 — 컨트롤러·서비스에서 throw, errorHandler에서 일괄 처리

```
AppError (base)
  ├── statusCode: number
  ├── code: string
  └── message: string

├── AuthError          (401) — AUTH_UNAUTHORIZED, AUTH_INVALID_CREDENTIALS 등
├── ForbiddenError     (403) — AUTH_FORBIDDEN
├── NotFoundError      (404) — PLAN_NOT_FOUND, CATEGORY_NOT_FOUND
├── ConflictError      (409) — EMAIL_ALREADY_EXISTS
└── ValidationError    (422) — VALIDATION_FAILED + details 배열 포함
```

**사용 패턴 (서비스 계층 의사 코드):**

```
// 소유권 검증
if (plan.userId !== requestUserId) {
  throw new ForbiddenError('AUTH_FORBIDDEN', '접근 권한이 없습니다.')
}

// 존재 여부 검증
if (!plan) {
  throw new NotFoundError('PLAN_NOT_FOUND', '일정을 찾을 수 없습니다.')
}
```

---

## 8. 서비스 계층 주요 로직

### 8-1. authService.register — 회원가입 트랜잭션

[PRD 확정] PRD §12-1, K-02=B

```
authService.register(email, password, nickname):
  1. userRepository.findByEmail(email) → 존재 시 throw ConflictError
  2. hashPassword(password) → passwordHash
  3. prisma.$transaction([
       userRepository.create({ email, passwordHash, nickname }),
       categoryRepository.createMany(userId, DEFAULT_CATEGORIES)  ← 5개 시드
     ])
  4. return { user }
```

기본 카테고리 상수 (`auth.service.ts` 내 정의):

| sort_order | name | color |
|---|---|---|
| 1 | 미팅 | `#7C3AED` |
| 2 | 과제 | `#2563EB` |
| 3 | 시험 | `#DC2626` |
| 4 | 개인 일정 | `#16A34A` |
| 5 | 약속 | `#EA580C` |

### 8-2. plansService.list — 일정 목록 조회

[PRD 확정] PRD §20-2 P-01

**[BE-03] 서버 고정 정렬 확정 (클라이언트 sort 파라미터 없음):**

```
plansService.list(userId, filters):
  조건: { userId, deletedAt: null }
  선택적 조건:
    - month: displayDate BETWEEN '{YYYY}-{MM}-01' AND '{YYYY}-{MM}-31'
    - search: OR [ title LIKE '%keyword%', memo LIKE '%keyword%' ]
    - category: categoryId IN [ids]  (OR 조건)
    - priority: priority IN [values] (OR 조건, 다중 선택 가능)  (DB-07)
    - completed: isCompleted = value (단일 선택)
    - uncategorized: categoryId IS NULL  (DB-07: 미분류 필터)
  정렬 (서버 고정, 클라이언트 추가 정렬 없음):
    ORDER BY
      is_completed ASC,                          -- 1순위: 미완료 우선
      CASE priority
        WHEN 'high'   THEN 0
        WHEN 'normal' THEN 1
        WHEN 'low'    THEN 2
      END ASC,                                   -- 2순위: 중요도
      due_time ASC NULLS LAST,                   -- 3순위: 마감시간 (없으면 후순위)
      created_at ASC                             -- 4순위: 등록 순서 (PRD §22-2)
  반환: Plan[] (category join 포함)
```

**[BE-04] `GetPlansQuerySchema` Zod 스키마 의사 정의 (`schemas/plan.schema.ts`):**

```typescript
// 의사 정의 — 구현 코드 아님
const GetPlansQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  search: z.string().max(100).optional(),
  // category: 단일값("?category=1")과 다중값("?category=1&category=2") 모두 처리
  category: z.preprocess(
    v => Array.isArray(v) ? v : (v ? [v] : []),
    z.array(z.coerce.number().int().positive()).optional()
  ),
  // priority: 단일값과 다중값 모두 처리 (동일 패턴)
  priority: z.preprocess(
    v => Array.isArray(v) ? v : (v ? [v] : []),
    z.array(z.enum(['high', 'normal', 'low'])).optional()
  ),
  completed: z.enum(['0', '1']).optional(),
  uncategorized: z.coerce.boolean().optional(),  // DB-07: 미분류 필터
})
```

### 8-3. plansService.toggleComplete — 완료 토글

[PRD 확정] PRD §25

```
plansService.toggleComplete(planId, userId):
  1. planRepository.findById(planId) → 없으면 NotFoundError
  2. plan.userId !== userId → ForbiddenError
  3. planRepository.update(planId, { isCompleted: !plan.isCompleted, updatedAt: nowKST() })
  4. return { id, isCompleted, updatedAt }
```

### 8-4. categoriesService.delete — 카테고리 삭제 (K-09=B)

[PRD 확정] PRD §12-8, K-09=B

```
categoriesService.delete(categoryId, userId):
  1. categoryRepository.findById(categoryId) → 없으면 NotFoundError
  2. category.userId !== userId → ForbiddenError
  3. prisma.$transaction([
       planRepository.updateMany({ categoryId }, { categoryId: null }),  ← SET NULL
       categoryRepository.delete(categoryId)
     ])
  4. return { message: '삭제 완료', affectedPlans: count }
```

### 8-5. profileService.changePassword — 비밀번호 변경

[PRD 확정] PRD §12-9

```
profileService.changePassword(userId, currentPassword, newPassword):
  1. userRepository.findById(userId) → user
  2. comparePassword(currentPassword, user.passwordHash) → false이면 AuthError
  3. hashPassword(newPassword) → newHash
  4. userRepository.update(userId, { passwordHash: newHash })
  5. return { message: '비밀번호 변경 완료' }
```

---

## 9. 데이터베이스 접근 (리포지토리 계층)

### 9-1. Prisma Client 싱글톤 (`config/prisma.ts`)

```
// 의사 정의 — 구현 코드 아님
const prisma = globalThis.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
export default prisma
```

개발 환경에서 핫 리로드 시 PrismaClient 인스턴스 중복 생성 방지 [AI 제안안]

### 9-2. Soft Delete 필터 전략

**방법 A — 명시적 조건 (채택):** 모든 `planRepository` 함수에서 `where: { deletedAt: null }` 명시

```
// plan.repository.ts 의사 정의
findById(id):  prisma.plan.findFirst({ where: { id, deletedAt: null } })
findMany(...): prisma.plan.findMany({ where: { ...filters, deletedAt: null } })
```

**방법 B — Prisma $extends 자동화:** [AI 제안안] 향후 리팩터링 시 적용 가능

### 9-3. 트랜잭션 사용 위치

| 위치 | 트랜잭션 이유 |
|---|---|
| `authService.register` | users INSERT + categories 5개 INSERT 원자성 보장 |
| `categoriesService.delete` | categories DELETE + plans category_id SET NULL 원자성 보장 |

---

## 9-4. Prisma schema.prisma 핵심 의사 정의 (BE-05)

[PRD 확정] PRD §15, §16, §17, §33

**[BE-05] 개발 착수 전 schema.prisma 핵심 구조 확정:**

```prisma
// 의사 정의 — 구현 코드 아님. 실제 파일: backend/prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                 Int        @id @default(autoincrement())
  email              String     @unique               // users.email UNIQUE (BE-05)
  passwordHash       String
  nickname           String
  avatarUrl          String?
  refreshTokenHash   String?                          // BE-01: Refresh Token 서버 측 무효화용
  createdAt          String                           // DB-02: @default(now()) 제거, 앱에서 nowKST() 명시 전달
  updatedAt          String                           // DB-14: @updatedAt 제거, 앱에서 nowKST() 명시 전달

  plans              Plan[]
  categories         Category[]

  @@map("users")
}

model Category {
  id        Int      @id @default(autoincrement())
  userId    Int
  name      String
  color     String
  sortOrder Int      @default(0)
  createdAt String                                    // DB-02: 앱에서 nowKST() 명시 전달
  updatedAt String                                    // DB-14: @updatedAt 제거

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  plans     Plan[]

  @@unique([userId, name])                            // DB-03: 동일 사용자 내 카테고리명 중복 금지
  @@index([userId])
  @@map("categories")
}

model Plan {
  id          Int       @id @default(autoincrement())
  userId      Int
  title       String
  dueDate     String
  dueTime     String?
  displayDate String
  categoryId  Int?
  priority    String    @default("normal")
  memo        String?
  isCompleted Boolean   @default(false)
  isRemind    Boolean   @default(false)
  createdAt   String                                  // DB-02: 앱에서 nowKST() 명시 전달
  updatedAt   String                                  // DB-14: @updatedAt 제거
  deletedAt   String?

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  @@index([userId, displayDate])
  @@index([userId, dueDate])
  @@index([userId, isCompleted])
  @@index([deletedAt])
  @@map("plans")
}
```

**onDelete 정책 요약 (BE-05):**
| 관계 | onDelete | 근거 |
|---|---|---|
| User → Plan | `Cascade` | 사용자 삭제 시 모든 일정 삭제 |
| User → Category | `Cascade` | 사용자 삭제 시 모든 카테고리 삭제 |
| Category → Plan | `SetNull` | K-09=B: 카테고리 삭제 시 plans.category_id = NULL |

---

## 10. 환경 변수

[PRD 확정] PRD §7

`backend/.env` (gitignore 대상):

| 변수명 | 예시 값 | 설명 |
|---|---|---|
| `DATABASE_URL` | `file:./prisma/planmate.db` | Prisma SQLite 경로 |
| `JWT_ACCESS_SECRET` | `<임의 64자 이상 랜덤 문자열>` | Access Token 서명 비밀키 |
| `JWT_REFRESH_SECRET` | `<임의 64자 이상 랜덤 문자열>` | Refresh Token 서명 비밀키 |
| `PORT` | `4000` | 서버 포트 |
| `NODE_ENV` | `development` \| `production` | 실행 환경 |
| `FRONT_ORIGIN` | `http://localhost:5173` | CORS 허용 도메인 |
| `UPLOAD_DIR` | `./uploads` | 업로드 파일 저장 경로 [AI 제안안] |

환경변수 검증: `config/env.ts` 에서 서버 시작 시 Zod로 검증, 누락 시 즉시 종료

---

## 11. 로깅

[AI 제안안]

### 11-1. 요청 로거 (`middlewares/requestLogger.ts`)

- morgan `'combined'` 포맷 사용 (개발: `'dev'`)
- 민감 정보(`password`, `passwordHash`) 마스킹: 요청 body 로깅 시 해당 필드 `[REDACTED]` 치환

### 11-2. 에러 로거

- `errorHandler.ts` 에서 500 에러 발생 시 `console.error(error.stack)` 출력
- 운영 환경에서는 별도 로깅 솔루션(예: winston) 연동 권장 [확인 필요]

---

## 12. 보안

[PRD 확정] PRD §7, §19

| 항목 | 구현 방법 |
|---|---|
| CORS | `cors({ origin: process.env.FRONT_ORIGIN, credentials: true })` |
| 보안 헤더 | `helmet()` 미들웨어 — XSS Protection, HSTS 등 |
| 비밀번호 해싱 | bcrypt cost 12 |
| JWT 비밀키 | 개발·운영 환경 별도 설정, 64자 이상 랜덤 문자열 |
| Refresh Token 쿠키 | `HttpOnly; Secure; SameSite=Lax` |
| Rate Limit | 인증 엔드포인트 5req/min/IP |
| SQL Injection | Prisma 파라미터화 쿼리 자동 적용 |
| XSS | Helmet + 입력 이스케이프 (서버 측 검증) |
| 권한 검증 | 서비스 레벨에서 `plan.userId === req.user.id` 검증 |

---

## 13. 테스트 전략

[PRD 확정] PRD §7

### 13-1. 단위 테스트 (Vitest)

| 대상 | 파일 위치 | 주요 시나리오 |
|---|---|---|
| `authService` | `tests/unit/auth.service.test.ts` | 회원가입 이메일 중복, 비밀번호 해싱, 카테고리 시드 |
| `plansService` | `tests/unit/plans.service.test.ts` | 소유권 검증, 정렬, soft delete 필터 |
| `jwt.ts` | `tests/unit/jwt.test.ts` | 토큰 생성·검증·만료 |
| `password.ts` | `tests/unit/password.test.ts` | 해싱·비교 |
| `dateUtil.ts` | `tests/unit/dateUtil.test.ts` | KST 날짜 포맷 |

### 13-2. 통합 테스트 (Vitest + supertest + 인메모리 SQLite)

| 대상 | 파일 위치 | 주요 시나리오 |
|---|---|---|
| `/api/v1/auth/*` | `tests/integration/auth.test.ts` | 회원가입 성공/중복, 로그인 성공/실패, Refresh |
| `/api/v1/plans/*` | `tests/integration/plans.test.ts` | CRUD, 완료 토글, soft delete, 필터 |
| `/api/v1/categories/*` | `tests/integration/categories.test.ts` | CRUD, K-09 삭제 후 plans NULL |
| `/api/v1/profile/*` | `tests/integration/profile.test.ts` | 조회, 닉네임 수정, 비밀번호 변경 |

**테스트 DB 전략:** 각 테스트 파일 실행 전 `beforeEach`에서 인메모리 SQLite (`DATABASE_URL=file::memory:?cache=shared`) 초기화 [AI 제안안]

---

## 14. app.ts 미들웨어·라우터 등록 순서

[AI 제안안] Express 미들웨어 순서는 선언 순서에 의존하므로 아래 순서 엄수

```
1. helmet()
2. cors(corsConfig)
3. express.json()
4. requestLogger (morgan)
5. [라우터 등록]
   - /api/v1/auth   → auth.route.ts
   - /api/v1/plans  → plans.route.ts
   - /api/v1/categories → categories.route.ts
   - /api/v1/profile → profile.route.ts
6. 404 핸들러  (라우터에 매칭되지 않은 경로)
7. errorHandler (전역 에러 핸들러) ← 반드시 마지막
```

Static 서빙: `express.static('uploads')` → `/uploads/avatars/...` URL로 아바타 이미지 제공
