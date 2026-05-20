# PlanMate 검증 기준 (Validation Criteria)

> 작성일: 2026-05-20
> 적용 범위: 모든 Step의 완료 검증 (Step 0~12)
> 원칙: **검증을 통과하지 못한 Step은 "완료" 표시 불가. harness.md §10 DoD와 쌍을 이룬다.**

---

## 0. 검증 도구

| 도구 | 명령어 | 용도 |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | 타입 에러 0건 확인 |
| ESLint | `npx eslint . --ext .ts,.tsx` | Lint 에러 0건 확인 |
| Prettier | `npx prettier --check .` | 포맷 일치 확인 |
| Vitest | `npm run test` | 단위·통합 테스트 |
| supertest | Vitest 내에서 통합 테스트 | 백엔드 API 엔드포인트 검증 |
| React Testing Library | Vitest + RTL | 프론트엔드 컴포넌트 검증 |
| Playwright | `npx playwright test` | E2E 시나리오 검증 |
| prisma CLI | `npx prisma migrate status` | 마이그레이션 상태 확인 |
| sqlite3 CLI | `sqlite3 backend/prisma/planmate.db` | DB 스키마·데이터 직접 확인 |
| curl / REST Client | 아래 §3 예시 참조 | API 수동 검증 |

### 0-1. 검증 실행 순서 (Step 완료 전 필수)

```
1. npm run typecheck      # TypeScript strict 모드 에러 0건
2. npm run lint           # ESLint 에러 0건
3. npm run test           # 단위·통합 테스트 전체 통과
4. (해당 Step) 수동 검증  # §3~§10 해당 항목 수동 확인
5. progress.md 검증 결과 기록
```

---

## 1. TypeScript 검증 기준

### 1-1. 명령어

```
cd frontend && npm run typecheck    # 프론트엔드
cd backend && npm run typecheck     # 백엔드
```

`typecheck` 스크립트: `tsc --noEmit`

### 1-2. 통과 조건

- 에러 0건, 경고 0건
- `strict: true` 모드 적용 (tsconfig.json)

### 1-3. tsconfig 필수 옵션

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 1-4. 금지 패턴

| 금지 패턴 | 대안 |
|---|---|
| `any` 타입 | `unknown` 또는 명시적 제네릭 |
| `as any` 캐스팅 | 타입 가드 또는 Zod 파싱 |
| `!` 비-null 단언 (근거 없는 경우) | 조건부 체크 후 사용 |
| `@ts-ignore` | `@ts-expect-error` + 이유 주석 |

### 1-5. 검증 실패 시 처리

- 에러 메시지와 파일:줄번호를 progress.md "남은 문제"에 기록
- 동일 에러 3회 이상 반복 시 Step 보류, 사용자 결정 대기

---

## 2. Lint 검증 기준

### 2-1. 명령어

```
npm run lint          # 검사
npm run lint:fix      # 자동 수정 (안전한 규칙만)
npx prettier --check . && npx prettier --write .
```

### 2-2. 적용 ESLint 규칙

| 규칙 세트 | 적용 이유 |
|---|---|
| `@typescript-eslint/recommended` | TypeScript 안전 코드 |
| `react-hooks/exhaustive-deps` | useEffect/useCallback 의존성 누락 방지 |
| `react-hooks/rules-of-hooks` | 훅 규칙 위반 방지 |
| `no-unused-vars` | 데드 코드 제거 |
| `no-console` (경고) | 디버그 코드 남김 방지 |

### 2-3. 통과 조건

- 에러(error) 0건
- 경고(warning)는 허용하되 progress.md에 건수 명시
- Prettier 포맷 불일치 0건

---

## 3. 백엔드 API 검증 기준

### 3-0. 공통 규칙

- 모든 엔드포인트는 api-spec.md §1-1·§1-2 형식으로 응답
- 인증 필수 엔드포인트: 토큰 없이 호출 시 401 `AUTH_UNAUTHORIZED`
- 검증 실패: 422 `VALIDATION_FAILED` + `details` 배열
- 모든 응답에 `success: true|false` 포함
- 타인 리소스 접근: 404 (403 노출 금지 — 존재 자체를 숨김)
- 모든 plans/categories 쿼리: `where: { userId }` 필수 적용

### 3-1. 인증 API (Step 3)

#### POST /api/v1/auth/register — 회원가입

**요청 예시:**
```
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","nickname":"테스트"}'
```

**기대 응답:**
- 성공: `201` + `{ success: true, data: { user: { id, email, nickname, createdAt } } }`
- 중복 이메일: `409` + `{ success: false, error: { code: "EMAIL_ALREADY_EXISTS" } }`
- 비밀번호 형식 오류: `422` + `{ success: false, error: { code: "VALIDATION_FAILED", details: [...] } }`
- Rate Limit 초과: `429` + `{ success: false, error: { code: "TOO_MANY_REQUESTS" } }`

**추가 확인:**
- 동일 트랜잭션에서 categories 5건 INSERT (미팅/과제/시험/개인일정/약속)
- `password_hash`가 bcrypt prefix `$2b$12$`로 시작하는지 DB에서 직접 확인

#### POST /api/v1/auth/login — 로그인

**요청 예시:**
```
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"test1234"}'
```

**기대 응답:**
- 성공: `200` + `{ success: true, data: { accessToken, user: { id, email, nickname, avatarUrl } } }`
- `Set-Cookie` 헤더: `refresh_token=...; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=604800`
- 이메일/비밀번호 불일치: `401` + `{ error: { code: "AUTH_INVALID_CREDENTIALS" } }`

**추가 확인:**
- `users.refresh_token_hash`가 새 Refresh Token의 bcrypt 해시로 DB에 저장되었는지 확인

#### POST /api/v1/auth/refresh — Token Rotation

**요청 예시:**
```
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -b cookies.txt -c cookies.txt
```

**기대 응답:**
- 성공: `200` + 새 `accessToken` + 새 `Set-Cookie: refresh_token=...`
- Refresh Token 쿠키 없음: `401` + `AUTH_REFRESH_EXPIRED`
- 이전 Refresh Token 재사용(Rotation 위반): `401` + `AUTH_INVALID_TOKEN` + `users.refresh_token_hash = NULL` (전체 세션 폐기)

**Token Rotation 검증 절차:**
1. 로그인 → refresh_token 쿠키 저장 (쿠키A)
2. refresh 호출 → 새 쿠키B 발급, 쿠키A 무효화
3. 쿠키A로 refresh 재시도 → 401 `AUTH_INVALID_TOKEN` + DB에서 `refresh_token_hash = NULL` 확인

#### POST /api/v1/auth/logout — 로그아웃

**기대 응답:**
- 성공: `200` + `{ data: { message: "로그아웃 완료" } }`
- `Set-Cookie: refresh_token=; ... Max-Age=0` (쿠키 삭제)
- DB: `users.refresh_token_hash = NULL`

#### GET /api/v1/auth/me — 사용자 정보

**기대 응답:**
- 성공: `200` + `{ data: { user: { id, email, nickname, avatarUrl, createdAt } } }`
- 토큰 없음: `401` + `AUTH_UNAUTHORIZED`

### 3-2. 일정 API (Step 4)

#### GET /api/v1/plans — 목록 조회

**요청 예시 (월 필터):**
```
curl -H "Authorization: Bearer <token>" \
  "http://localhost:4000/api/v1/plans?month=2026-05"
```

**기대 응답:** `200` + `{ data: { plans: [...], total: N } }`

**서버 고정 정렬 검증:**
- 응답 배열에서 `is_completed=false` 항목이 `is_completed=true` 항목보다 앞에 위치
- 동일 is_completed 그룹 내 `priority` 순서: high < normal < low
- 동일 priority 그룹 내 `due_time` 오름차순, null이 마지막
- 동일 due_time 그룹 내 `created_at` 오름차순
- 클라이언트에서 재정렬 없이 API 응답 순서 그대로 사용해야 함

**필터 검증:**
```
?category=1&category=2          # OR 조건: category_id IN (1, 2)
?priority=high&priority=normal  # OR 조건
?completed=0                    # 미완료만
?uncategorized=1                # category_id IS NULL
?uncategorized=1&category=1     # category_id IS NULL OR category_id = 1
?search=영상처리                 # title LIKE % OR memo LIKE %
```

#### POST /api/v1/plans — 일정 등록

**기대 응답:** `201` + plan 객체

**검증:**
- `display_date > due_date`: `422` + `{ error: { code: "VALIDATION_FAILED", details: [{ field: "display_date", message: "처리 예정일은 마감일 이후로 설정할 수 없습니다." }] } }`
- `category_id`가 타인 소유: `404` `CATEGORY_NOT_FOUND`
- title 101자: `422`
- `created_at`, `updated_at`이 KST ISO 8601 문자열로 저장되었는지 DB 직접 확인

#### GET /api/v1/plans/:id — 단건 조회

**검증:**
- 자신 소유: `200`
- 타인 소유 ID: `404` `PLAN_NOT_FOUND` (403 반환 금지)
- soft delete된 ID: `404` `PLAN_NOT_FOUND`

#### PATCH /api/v1/plans/:id — 수정

**검증:**
- 부분 업데이트 가능 (title만 보내도 동작)
- `updated_at`이 nowKST()로 갱신되었는지 DB 확인

#### DELETE /api/v1/plans/:id — 삭제 (soft delete)

**기대 응답:** `204 No Content`

**검증:**
```sql
SELECT deleted_at FROM plans WHERE id = ?;
-- 결과: KST 타임스탬프 문자열 (예: "2026-05-20T10:00:00")
```
- 삭제 후 GET /api/v1/plans 목록에서 제외 확인
- 삭제 후 GET /api/v1/plans/:id → `404`

#### PATCH /api/v1/plans/:id/complete — 완료 토글

**기대 응답:** `200` + 업데이트된 plan 객체

**검증:**
- `is_completed: false → true` 토글
- `is_completed: true → false` 재토글 (취소 가능, U-01 결정)
- 응답 순서가 고정 정렬 기준에 따라 재배치되는지 목록 재조회로 확인

### 3-3. 카테고리 API (Step 5)

#### GET /api/v1/categories — 목록

**기대 응답:** `200` + `{ data: { categories: [...] } }` (sort_order 순)

**회원가입 직후 확인:**
```
# 회원가입 → 로그인 → GET /categories
# 기대: 5건 (미팅/과제/시험/개인일정/약속, sort_order 1~5)
```

#### POST /api/v1/categories — 생성

**중복명 검증:**
```
curl -X POST ... -d '{"name":"미팅","color":"#7C3AED","sort_order":6}'
# 기대: 409 CATEGORY_NAME_ALREADY_EXISTS
```

#### PUT /api/v1/categories/:id — 수정 (전체 교체)

**검증:**
- name·color·sort_order 모두 필수 (PUT 의미: 전체 교체)
- 수정 후 다른 카테고리와 동일명으로 변경 시 `409 CATEGORY_NAME_ALREADY_EXISTS`

#### DELETE /api/v1/categories/:id — 삭제

**기대 응답:** `200 OK` + `{ success: true, data: { message: "삭제 완료", affectedPlans: N } }`

> **일정 vs 카테고리 DELETE 응답 비교:**
> - `DELETE /api/v1/plans/:id` → `204 No Content` (본문 없음, soft delete만 수행)
> - `DELETE /api/v1/categories/:id` → `200 OK` + JSON 본문 (연결 일정의 `categoryId`를 NULL로 일괄 처리한 건수 `affectedPlans` 반환이 필요하므로 본문 있음)

**SET NULL 검증:**
```sql
-- 삭제 전 해당 category_id를 가진 plan ID 기록
SELECT id FROM plans WHERE category_id = ?;

-- 카테고리 삭제 후 DB 직접 확인
SELECT id, category_id FROM plans WHERE id IN (...);
-- 기대: category_id = NULL
```

**응답 본문 검증:**
- `affectedPlans`: NULL 처리된 일정 수 (0 이상의 정수)
- 오류 시 `404 CATEGORY_NOT_FOUND` (타인 소유 카테고리 포함 — 존재 자체를 숨김)

### 3-4. 프로필 API (Step 6)

#### GET /api/v1/profile — 조회

**기대 응답:** `200` + `{ data: { user: { id, email, nickname, avatarUrl, createdAt, updatedAt } } }`

#### PATCH /api/v1/profile — 수정

**검증:**
- nickname 2~20자, 공백 포함 불가
- `updated_at` DB 갱신 확인

#### PATCH /api/v1/profile/password — 비밀번호 변경

**검증:**
- 현재 비밀번호 틀림: `401` 또는 `422`
- 변경 후 기존 비밀번호로 로그인: `401 AUTH_INVALID_CREDENTIALS`
- 변경 후 새 비밀번호로 로그인: `200` 성공

#### POST /api/v1/profile/avatar — 아바타 업로드

```
curl -X POST http://localhost:4000/api/v1/profile/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@photo.jpg"
```

**기대 응답:** `200` + `{ data: { avatarUrl: "/uploads/avatars/1_1716192000.jpg" } }`

**검증:**
- `backend/uploads/avatars/` 디렉토리에 파일 존재 확인
- 5MB 초과 파일: `400 FILE_TOO_LARGE`
- 허용 외 형식 (gif 등): `400 INVALID_FILE_TYPE`

---

## 4. DB 검증 기준

### 4-1. 마이그레이션 상태

```
cd backend
npx prisma migrate status
# 기대 출력: "Database schema is up to date!"
```

### 4-2. FK 활성화 확인

```sql
PRAGMA foreign_keys;
-- 기대: 1
```

PrismaClient 초기화 시 `$executeRawUnsafe('PRAGMA foreign_keys = ON')` 호출 여부를 `backend/src/config/prisma.ts`에서 코드 리뷰로 확인.

### 4-3. 스키마 컬럼 확인

```
sqlite3 backend/prisma/planmate.db ".schema users"
sqlite3 backend/prisma/planmate.db ".schema categories"
sqlite3 backend/prisma/planmate.db ".schema plans"
```

**users 필수 컬럼:** id, email, password_hash, nickname, avatar_url, **refresh_token_hash**, created_at, updated_at

**categories 필수 제약:** UNIQUE(user_id, name) 인덱스 존재 확인
```
sqlite3 backend/prisma/planmate.db ".indexes categories"
# 기대: categories_user_id_name_key 또는 유사 UNIQUE 인덱스
```

**plans 필수 컬럼:** deleted_at, display_date, is_remind

### 4-4. 타임스탬프 저장 형식

```sql
SELECT created_at, updated_at FROM users WHERE id = 1;
-- 기대: "2026-05-20T10:00:00" (KST ISO 8601, UTC가 아닌 KST)
-- 금지: "2026-05-20T01:00:00Z" (UTC 형식)
-- 금지: NULL
```

### 4-5. Soft Delete 확인

```sql
-- 삭제 전
SELECT deleted_at FROM plans WHERE id = ?;  -- NULL

-- DELETE API 호출 후
SELECT deleted_at FROM plans WHERE id = ?;  -- "2026-05-20T10:00:00"

-- 목록 쿼리에서 제외 확인
SELECT count(*) FROM plans WHERE deleted_at IS NULL AND user_id = ?;
```

### 4-6. 비밀번호 해시 형식

```sql
SELECT password_hash FROM users WHERE id = 1;
-- 기대: $2b$12$... (bcrypt cost 12, prefix "$2b$12$")
```

### 4-7. 시드 데이터 확인

```sql
SELECT sort_order, name, color FROM categories
WHERE user_id = 1 ORDER BY sort_order;
-- 기대:
-- 1 | 미팅      | #7C3AED
-- 2 | 과제      | #2563EB
-- 3 | 시험      | #DC2626
-- 4 | 개인 일정  | #16A34A
-- 5 | 약속      | #EA580C
```

---

## 5. 프론트엔드 화면 검증 기준

### 5-1. 개발 서버 기동 및 기본 확인

```
cd frontend && npm run dev
# 브라우저에서 http://localhost:5173 접근
```

**콘솔 에러 확인:** 각 페이지 진입 시 브라우저 콘솔 에러 0건

### 5-2. 디자인 시스템 토큰 확인

| 항목 | 기댓값 | 확인 방법 |
|---|---|---|
| 주조색 | `#21201a` (charcoal) | DevTools → Elements → background-color |
| 배경색 | `#f9f9f7` (surface) | body background |
| 폰트 | Inter | DevTools → Computed → font-family |
| 기본 단위 | 4px 배수 | 패딩·마진 DevTools 측정 |

### 5-3. 카테고리 색상 확인 (K-03=A)

카테고리 칩 색상이 아래 5색인지 확인 (그레이스케일 금지):

| 카테고리 | 색상 HEX |
|---|---|
| 미팅 | `#7C3AED` (보라) |
| 과제 | `#2563EB` (파랑) |
| 시험 | `#DC2626` (빨강) |
| 개인 일정 | `#16A34A` (초록) |
| 약속 | `#EA580C` (주황) |

### 5-4. 메인 페이지 섹션 순서 확인 (K-05=B)

페이지 스크롤 시 섹션 순서:
1. 월간 캘린더 (상단)
2. 주간 일정 바
3. 오늘 할 일 목록 (하단)

### 5-5. 완료 항목 표시 확인

- 중간줄 (text-decoration: line-through)
- 회색 텍스트 (text-gray 또는 opacity 낮춤)
- 목록 최하위 이동 (완료 항목이 미완료 항목보다 아래 위치)

### 5-6. D-Day 배지 표시 확인 (wireframe-spec.md §10)

| 조건 | 표시 |
|---|---|
| diff = 0 (오늘 마감) | "D-Day" |
| diff = 1 | "D-1" |
| diff = 3 | "D-3" |
| diff < 0 (마감 지남) | "마감 지남" (빨강) |
| diff = 2 또는 diff >= 4 | "YYYY.MM.DD" 날짜 문자열 (배지 없음) |

### 5-7. 빈 상태 메시지 확인

| 상황 | 기대 메시지 |
|---|---|
| 오늘 할 일 없음 | "오늘 할 일이 없습니다" |
| 검색 결과 없음 | "검색 결과가 없습니다" |
| 카테고리 없음 | "카테고리가 없습니다" |
| 해당 월 일정 없음 | (캘린더 날짜 셀 비어있음, 별도 메시지 불필요) |

### 5-8. 검색 모드 레이아웃 확인 (design-review.md FE-03 결정)

- 검색어 입력 시: 월간 캘린더·주간 바 hidden 처리
- `<SearchResultList />` 영역 표시 (전체 기간 대상)
- 검색어 삭제 시: 메인 레이아웃 복귀 (캘린더·주간 바 재표시)

---

## 6. Playwright E2E 검증 시나리오 (P-01~P-08)

> 파일 위치: `frontend/e2e/`
> 실행: `npx playwright test --reporter=html`
> harness.md §3 Step 12 범위에서 모두 구현

### P-01. 회원가입 → 로그인 → 메인 진입

**파일:** `frontend/e2e/auth-flow.spec.ts`

**단계:**
1. `/auth` 접근 → 닉네임·이메일·비밀번호·비밀번호 확인 입력
2. "가입하기" 클릭 → 201 응답 수신 → `/login` 이동 확인
3. 이메일·비밀번호 입력 → "로그인" 클릭 → 200 응답 수신
4. `/` 메인 페이지 진입 확인
5. 캘린더·주간 바·오늘 할 일 세 영역 모두 DOM에 존재 확인

**통과 조건:**
- URL이 `/`로 변경됨
- `[data-testid="monthly-calendar"]`, `[data-testid="weekly-plan-bar"]`, `[data-testid="today-plan-list"]` 세 요소 모두 visible

### P-02. 일정 등록

**파일:** `frontend/e2e/plan-create.spec.ts`

**단계:**
1. 메인 페이지에서 FAB(+) 클릭 → `/plans/new` 이동 확인
2. 제목 입력: "영상처리 과제 제출"
3. 마감일 입력: 오늘 + 5일 (YYYY-MM-DD)
4. 마감 시간 입력: "23:59"
5. 처리 예정일: 마감일과 동일 (자동 설정 확인)
6. 카테고리 선택: "과제"
7. 우선순위 선택: "높음"
8. 메모 입력: "5장 분량"
9. "저장하기" 클릭 → 저장 확인 모달 → "확인"
10. `/` 복귀 확인
11. 메인 캘린더 해당 날짜에 점/배지 표시 확인
12. 오늘 처리 예정일이 오늘인 경우 오늘 할 일에 카드 추가 확인

**추가 검증:**
- display_date > due_date 입력 시 저장 불가 + 에러 메시지 표시

### P-03. 일정 상세 모달 (K-08=B)

**파일:** `frontend/e2e/main.spec.ts`

**단계:**
1. 오늘 할 일 목록에서 PlanCard 클릭
2. URL이 `?planId=X` 형태로 변경 확인 (`page.url()` 검사)
3. 모달 오픈 확인
4. 모달 내 제목·마감일·카테고리·우선순위·메모 정보 표시 확인
5. "수정" 버튼 클릭 → 인라인 편집 모드 전환 확인
6. ESC 또는 닫기(×) 클릭 → 모달 닫힘 확인
7. URL에서 `planId` 쿼리 파라미터 제거 확인

**통과 조건:**
- 모달 열림/닫힘 시 URL 쿼리 파라미터 동기화

### P-04. 완료 토글 (낙관적 업데이트)

**파일:** `frontend/e2e/complete-toggle.spec.ts`

**단계:**
1. 오늘 할 일 카드에서 체크박스 클릭
2. API 응답 수신 전(낙관적 업데이트): 해당 카드에 중간줄 + 회색 스타일 즉시 적용 확인
3. 카드가 목록 최하위로 이동 확인
4. API 응답 수신 후 정렬 안정화 확인 (재정렬 없음)

**낙관적 업데이트 검증:**
```javascript
// Playwright: 네트워크 지연 시뮬레이션 후 UI 상태 확인
await page.route('**/plans/*/complete', route => {
  setTimeout(() => route.continue(), 500);
});
```

### P-05. 검색 모드

**파일:** `frontend/e2e/search.spec.ts`

**단계:**
1. 검색바에 키워드 입력 (예: "영상처리")
2. 300ms debounce 대기 (`waitForTimeout(350)`)
3. 월간 캘린더 hidden 확인 (`expect(calendar).not.toBeVisible()`)
4. 주간 바 hidden 확인
5. `<SearchResultList />` 영역 표시 확인
6. 검색 결과 카드 중 "영상처리" 포함 항목 존재 확인
7. 검색어 전체 삭제
8. 월간 캘린더·주간 바 재표시 확인

### P-06. 카테고리 커스터마이징 (K-02=B)

**파일:** `frontend/e2e/category.spec.ts`

**단계:**
1. `/profile` 접근 → 카테고리 목록 표시 확인
2. "카테고리 추가" 버튼 클릭 → CategoryFormModal 오픈
3. 이름: "팀플", 색상: "#FF5733" 입력 → "저장" 클릭
4. 목록에 "팀플" 카테고리 추가 확인
5. "팀플" 이름으로 재등록 시도 → 에러 토스트 확인 ("이미 존재하는 카테고리입니다" 또는 유사 메시지)
6. "과제" 카테고리 삭제 클릭 → 삭제 확인 모달 → "삭제"
7. 카테고리 목록에서 "과제" 제거 확인
8. 일정 목록(또는 PlanCard)에서 이전에 "과제"였던 일정의 카테고리가 "미분류"로 표시 확인

**통과 조건:**
- 중복명 409 에러 → Toast UI로 사용자에게 표시
- 삭제 후 연결 일정 category_id = NULL → "미분류" 표시

### P-07. 토큰 갱신 흐름

**파일:** `frontend/e2e/token-refresh.spec.ts`

**단계:**
1. 로그인 후 accessToken을 조작하여 만료된 것처럼 변경 (`page.evaluate`)
2. API 호출이 필요한 동작 수행 (예: 메인 페이지 새로고침)
3. 401 응답 수신 → 인터셉터가 자동으로 `/auth/refresh` 호출
4. 새 accessToken 발급 후 원 요청 재시도 → 성공 확인
5. refresh도 실패 시나리오: refresh_token 쿠키도 제거 후 API 호출
6. 강제 로그아웃 → `/login` 리다이렉트 확인

**accessToken 만료 시뮬레이션:**
```javascript
await page.evaluate(() => {
  // localStorage 또는 메모리 스토어의 accessToken을 만료된 토큰으로 교체
  const store = window.__zustand_auth_store;
  store.setState({ accessToken: 'expired.token.value' });
});
```

### P-08. 로그아웃

**파일:** `frontend/e2e/logout.spec.ts`

**단계:**
1. 메인 페이지에서 프로필 메뉴(아바타 또는 프로필 링크) 접근
2. `/profile` 페이지 이동
3. "로그아웃" 버튼 클릭
4. POST `/api/v1/auth/logout` 호출 확인 (`waitForRequest`)
5. 쿠키에서 `refresh_token` 삭제 확인
6. authStore의 accessToken 제거 확인 (페이지가 비로그인 상태로 전환)
7. `/login` 리다이렉트 확인
8. 로그아웃 후 `/`로 직접 접근 시 `/login` 리다이렉트 확인

---

## 7. 인증·인가 검증 기준

### 7-1. Protected Route 검증

| 시나리오 | 기대 결과 |
|---|---|
| 비로그인 → `/` 접근 | `/login` 리다이렉트 |
| 비로그인 → `/plans/new` 접근 | `/login` 리다이렉트 |
| 비로그인 → `/profile` 접근 | `/login` 리다이렉트 |
| 로그인 → `/login` 접근 | `/` 리다이렉트 (이미 인증됨) |

### 7-2. JWT 검증

| 시나리오 | 기대 에러 코드 |
|---|---|
| Access Token 없음 | `401 AUTH_UNAUTHORIZED` |
| Access Token 만료 | `401 AUTH_UNAUTHORIZED` |
| Access Token 서명 오류 | `401 AUTH_INVALID_TOKEN` |
| Refresh Token 만료 | `401 AUTH_REFRESH_EXPIRED` |
| Refresh Token 재사용 | `401 AUTH_INVALID_TOKEN` + 세션 폐기 |

### 7-3. 사용자 격리 검증

```
# 사용자 A 토큰으로 사용자 B의 plan ID 접근
curl -H "Authorization: Bearer <A_token>" \
  "http://localhost:4000/api/v1/plans/<B_plan_id>"
# 기대: 404 PLAN_NOT_FOUND (403 반환 금지)

# 사용자 A 토큰으로 사용자 B의 category ID 접근
curl -H "Authorization: Bearer <A_token>" \
  "http://localhost:4000/api/v1/categories/<B_category_id>"
# 기대: 400 또는 404 (사용자 격리)
```

### 7-4. 비밀번호 정책 검증

| 입력 | 기대 결과 |
|---|---|
| 7자 이하 | `422 VALIDATION_FAILED` |
| 영문만 (숫자 없음) | `422 VALIDATION_FAILED` |
| 숫자만 (영문 없음) | `422 VALIDATION_FAILED` |
| 영문+숫자 8자 이상 | 통과 |
| 73자 이상 (bcrypt 한계) | `422 VALIDATION_FAILED` |

### 7-5. Refresh Token Rotation 완전 검증

```
1. 로그인 → refresh_token 쿠키A 저장
2. POST /refresh → 쿠키B 발급 (쿠키A는 DB에서 무효화)
3. 쿠키A로 POST /refresh 재시도
   → 401 AUTH_INVALID_TOKEN
   → DB: users.refresh_token_hash = NULL (전체 세션 폐기)
4. 쿠키B로 POST /refresh 시도
   → 401 AUTH_INVALID_TOKEN (세션 폐기 상태이므로)
5. 새 로그인으로만 세션 복구 가능
```

---

## 8. 일정 CRUD 검증 기준

### 8-1. 입력 검증 (422 케이스)

| 필드 | 위반 조건 | 기대 에러 |
|---|---|---|
| title | 빈 문자열 또는 누락 | 422 VALIDATION_FAILED |
| title | 101자 이상 | 422 VALIDATION_FAILED |
| due_date | 날짜 형식 오류 (`20260520`) | 422 VALIDATION_FAILED |
| display_date | due_date보다 늦은 날짜 | 422 + "처리 예정일은 마감일 이후로 설정할 수 없습니다." |
| priority | `urgent` 등 허용 외 값 | 422 VALIDATION_FAILED |
| memo | 501자 이상 | 422 VALIDATION_FAILED |
| category_id | 타인 소유 카테고리 ID | 404 CATEGORY_NOT_FOUND |

### 8-2. 서버 고정 정렬 완전 검증

아래 테스트 데이터로 GET /plans 호출 후 응답 배열 순서 확인:

```
계획A: is_completed=false, priority=low,    due_time=null,    created_at=3번째
계획B: is_completed=false, priority=high,   due_time="09:00", created_at=1번째
계획C: is_completed=false, priority=high,   due_time="10:00", created_at=2번째
계획D: is_completed=true,  priority=high,   due_time="09:00", created_at=4번째
계획E: is_completed=false, priority=normal, due_time=null,    created_at=5번째

기대 순서: B → C → E → A → D
(B: 미완료·high·09:00
 C: 미완료·high·10:00
 E: 미완료·normal·null
 A: 미완료·low·null (created_at으로 E보다 뒤)
 D: 완료·high·09:00)
```

### 8-3. Soft Delete 검증

1. DELETE API 호출 → `204`
2. GET /plans 목록에서 제외 확인
3. GET /plans/:id → `404`
4. DB 직접 확인: `deleted_at IS NOT NULL`
5. 같은 사용자로 POST /plans 후 새 일정 생성 → 이전 soft delete 항목과 다른 ID 부여 확인

### 8-4. display_date 검증

| 시나리오 | 기대 결과 |
|---|---|
| display_date = due_date | 통과 |
| display_date < due_date | 통과 |
| display_date > due_date | 422 |
| display_date가 과거 날짜 | 통과 (허용) |
| 수정 시 display_date 변경 | 새 값으로 갱신 |

---

## 9. 검색·필터 검증 기준

### 9-1. 검색 검증

| 시나리오 | 기대 결과 |
|---|---|
| title에 키워드 포함 | 결과에 포함 |
| memo에 키워드 포함 | 결과에 포함 |
| title과 memo 모두 키워드 없음 | 결과에서 제외 |
| 빈 검색어 (`search=`) | 검색 모드 미진입, 전체 목록 반환 |
| 삭제된 일정 제목으로 검색 | 결과에서 제외 (`deleted_at IS NULL`) |
| 전체 기간 대상 (월 필터 없음) | 특정 월에 없는 일정도 결과에 포함 |

**대소문자 처리:** SQLite LIKE는 ASCII 범위만 대소문자 무시. 한국어는 정확 일치. (추가 처리 불필요)

### 9-2. 필터 조합 검증

```
# 단일 필터
GET /plans?category=2                    # 과제만
GET /plans?priority=high                 # 높음 우선순위만
GET /plans?completed=0                   # 미완료만

# 복합 필터 (카테고리 OR, 중요도 OR, 그룹 간 AND)
GET /plans?category=1&category=2         # 미팅 OR 과제
GET /plans?priority=high&priority=normal # 높음 OR 보통
GET /plans?category=2&priority=high      # 과제 AND 높음 우선순위

# 미분류 필터
GET /plans?uncategorized=1               # category_id IS NULL
GET /plans?uncategorized=1&category=2   # IS NULL OR category_id=2

# 복합 + 완료 여부
GET /plans?category=2&completed=0        # 과제 중 미완료만
```

**각 케이스별 실제 DB 데이터와 응답 결과 비교 필수.**

### 9-3. 검색 모드 UI 검증

| 동작 | 기대 결과 |
|---|---|
| 검색바에 1자 이상 입력 + 300ms 대기 | 캘린더·주간 바 hidden, SearchResultList 표시 |
| 검색어 전체 삭제 | 메인 레이아웃 복귀 (캘린더·주간 바 재표시) |
| 검색어 입력 중 300ms 미만 | API 미호출 (debounce) |
| 검색어 변경 | 이전 요청 취소 후 새 요청 (TanStack Query enabled 조건) |

---

## 10. 완료 상태 검증 기준

### 10-1. 낙관적 업데이트 검증

| 단계 | 확인 항목 |
|---|---|
| 체크박스 클릭 직후 (API 응답 전) | 해당 카드: 중간줄 + 회색 텍스트 즉시 적용 |
| API 응답 성공 | TanStack Query 캐시 갱신 + 최종 정렬 적용 |
| API 실패 시 | 낙관적 업데이트 롤백 + 에러 토스트 표시 |

**구현 검증 (코드 리뷰):**
```
useMutation의 onMutate → 낙관적 업데이트 적용
useMutation의 onError  → 이전 상태 복원 (context.previousPlans)
useMutation의 onSettled → queryClient.invalidateQueries(['plans'])
```

### 10-2. 완료 항목 표시 검증

| 항목 | 기댓값 |
|---|---|
| 텍스트 스타일 | `line-through` + 회색 계열 (opacity 0.5 이상 변화) |
| 목록 위치 | 미완료 항목들보다 아래 |
| 캘린더 표시 | 완료된 일정도 캘린더 점/배지에 포함 (완료 표시 추가) |
| 상세 모달 | 완료된 일정도 모달로 조회 가능 |

### 10-3. 완료 토글 멱등성

```
# 동일 ID에 대해 complete 2회 호출
PATCH /api/v1/plans/1/complete  → { isCompleted: true }
PATCH /api/v1/plans/1/complete  → { isCompleted: false }

# 낙관적 업데이트이므로 중간 상태 표시 후 서버 응답 기준으로 최종 확정
# retry 비활성 설정 필수 (TanStack Query mutation retry: 0)
```

### 10-4. 캘린더·주간 바에서의 완료 항목

- 완료된 일정도 캘린더 날짜 셀의 카테고리 점 표시에 포함 (단, 완료된 일정이 많을 경우 시각적 구분 선택)
- 주간 바 일정 개수에 완료 항목 포함 (필터가 `completed=0`일 때만 미완료만 표시)
