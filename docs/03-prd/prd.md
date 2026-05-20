# PlanMate 제품 요구사항 정의서 (PRD)

> 작성일: 2026-05-20
> 버전: 1.0
> 상태: 확정 (K-01~K-10 사용자 결정 반영)
>
> **라벨 기준**
> - `[명세서]` — 기능명세서 기반 확정 사항
> - `[사용자 결정 K-XX]` — 사용자 직접 결정 사항
> - `[AI 보완]` — AI 제안으로 채택된 사항 (섹션 41에 일괄 기록)
> - `[디자인]` — 디자인 레퍼런스/이미지 기반 (공통 UI에만 적용)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 서비스명 | PlanMate |
| 서비스 유형 | 웹 기반 일정·과제 관리 서비스 (SPA) |
| 핵심 콘셉트 | 대학생이 과제·시험·미팅·약속·개인 일정을 월간 캘린더와 오늘 할 일 목록으로 직관적으로 관리하는 서비스 |
| 주요 타깃 | 대학생 |
| 기술 스택 | 프론트엔드: React 18 (TypeScript) + TailwindCSS v3 / 백엔드: Node.js (TypeScript) + Express.js / DB: SQLite |
| 인증 방식 | JWT (Access Token 1시간 + Refresh Token 7일) `[사용자 결정 K-01]` |
| 다중 사용자 | 지원 — 로그인·회원가입·JWT 인증 포함 `[사용자 결정 K-01]` |

`[명세서]` 서비스명, 타깃, 기술 스택(React+TS, Node.js+TS, SQLite)은 기능명세서에서 확정된 사항입니다.

---

## 2. 서비스 목표

1. `[명세서]` 마감일이 있는 일정과 할 일을 한눈에 확인할 수 있도록 월간 캘린더 중심 UI를 제공한다.
2. `[명세서]` 중요도·마감시간 기준 정렬로 오늘 처리해야 할 일의 우선순위를 빠르게 파악할 수 있도록 한다.
3. `[명세서]` 완료된 일정은 삭제하지 않고 중간줄+회색으로 표시하여 기록을 보존한다.
4. `[명세서]` 카테고리(미팅·과제·시험·개인 일정·약속)와 중요도(높음·보통·낮음)로 일정을 분류하여 관리 효율을 높인다.
5. `[사용자 결정 K-01]` 다중 사용자 구조로 각 사용자가 독립적인 일정·카테고리 데이터를 갖는다.

---

## 3. 대상 사용자

| 항목 | 내용 |
|---|---|
| 주 사용자 | 대학생 |
| 사용 환경 | 웹 브라우저 (PC 기준, 반응형 지원 범위는 섹션 40 참조) |
| 사용 목적 | 과제·시험·팀플·약속·개인 일정을 캘린더와 할 일 목록으로 통합 관리 |
| 핵심 문제 | 여러 과목과 활동에 일정이 흩어져 마감일을 놓치기 쉬움 |
| 계정 방식 | 이메일+비밀번호 기반 회원가입/로그인 `[사용자 결정 K-01]` |

`[명세서]` 주 사용자, 사용 목적, 핵심 문제는 기능명세서 섹션 3에서 확정된 사항입니다.

---

## 4. 사용자 역할

`[사용자 결정 K-01]` 다중 사용자 구조를 채택하므로 아래 두 역할이 존재합니다.

| 역할 | 설명 | 접근 가능 페이지 | 권한 범위 |
|---|---|---|---|
| 비로그인 사용자 | 미인증 접근자 | `/login`, `/auth` | 로그인·회원가입만 |
| 로그인 사용자 | 인증된 대학생 | 전체 서비스 (`/`, `/plans/new`, `/profile`) | 자신의 일정·카테고리만 CRUD |

**권한 매트릭스** `[AI 보완]`

| 리소스 | 생성 | 조회 | 수정 | 삭제 |
|---|---|---|---|---|
| 본인 일정 | O | O | O | O |
| 타인 일정 | X | X | X | X |
| 본인 카테고리 | O | O | O | O |
| 타인 카테고리 | X | X | X | X |
| 본인 프로필 | — | O | O | — |

- 서비스 레이어에서 `plan.user_id === req.user.id` 검증 필수
- 관리자 역할은 초기 버전에서 미정의

---

## 5. 전체 시스템 범위

`[명세서]` + `[사용자 결정 K-01]`

PlanMate는 **다중 사용자 SPA + REST API + SQLite** 구조로 구성됩니다.

| 구성 요소 | 범위 |
|---|---|
| 프론트엔드 | React SPA (6개 페이지 + 모달), 클라이언트 사이드 라우팅, Protected Routes |
| 백엔드 | Node.js REST API (`/api/v1`), JWT 인증 미들웨어, 4계층 아키텍처 |
| 데이터베이스 | SQLite 단일 파일, Prisma ORM, 3개 테이블 (users, categories, plans) |
| 인증 | JWT Access Token (1h) + Refresh Token (7d httpOnly 쿠키) |
| 파일 저장 | 로컬 `/uploads` 디렉터리 (아바타 이미지), Express static 서빙 |
| 제외 범위 | 알림 발송, AI 추천, 과제 진행률, 실시간 동기화, 소셜 로그인 |

초기 제외 기능 `[명세서]`
- 알림 기능 (단, `is_remind` 컬럼 저장 및 UI 체크박스는 유지 — `[사용자 결정 K-07]`)
- AI 추천 기능
- 과제 진행률

---

## 6. 프론트엔드 범위

`[AI 보완]` 기술 선택 사항, `[명세서]` 기능 범위

### 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | React 18 + TypeScript |
| 스타일링 | TailwindCSS v3 |
| 빌드 도구 | Vite |
| 라우팅 | React Router v6 |
| 서버 상태 관리 | TanStack Query v5 |
| 클라이언트 상태 관리 | Zustand |
| 폼 | React Hook Form + Zod |
| 날짜 유틸리티 | date-fns v3 |
| 테스트 | Vitest + React Testing Library + Playwright |

### 페이지 목록

| 경로 | 페이지명 | Protected |
|---|---|---|
| `/login` | 로그인 | X |
| `/auth` | 회원가입 | X |
| `/` | 메인 (캘린더 + 주간 바 + 오늘 할 일) | O |
| `/plans/new` | 일정 등록 | O |
| `/profile` | 프로필 + 카테고리 관리 | O |
| (모달) | 일정 상세·수정 (`?planId=123`) | O |

### 상태 관리 분리 원칙

- **TanStack Query:** 서버 데이터 (일정 목록, 카테고리 목록, 프로필) — 캐싱·갱신·로딩·에러
- **Zustand:** 클라이언트 UI 상태 (선택된 날짜, 모달 열림 여부, 검색 키워드, 필터 상태)

### Protected Route 동작

1. 인증 토큰 없음 → `/login`으로 리디렉션
2. 로그인 페이지 접근 (이미 인증됨) → `/`으로 리디렉션
3. Access Token 만료 시 Refresh Token으로 자동 갱신 시도
4. Refresh 실패 시 → `/login`으로 리디렉션

### 컴포넌트 구조 개요

```
src/
  components/ui/       # Button, Input, Textarea, Select, Chip, Checkbox, Modal, Card, Badge
  features/
    auth/              # LoginForm, RegisterForm
    plans/             # PlanCard, PlanForm, PlanDetailModal, DayPlanList
    calendar/          # MonthCalendar, CalendarCell, WeeklyBar
    categories/        # CategoryChip, CategoryForm, CategoryList
    profile/           # ProfileForm, PasswordForm, AvatarUpload
  pages/               # 라우트별 페이지 컴포넌트
  api/                 # axios 인스턴스 + API 함수
  hooks/               # useAuth, usePlans, useCategories
  utils/               # dday.ts, date.ts
  types/               # Plan, Category, User 타입
```

---

## 7. 백엔드 범위

`[AI 보완]` 기술 선택, `[명세서]` 기능 범위

### 기술 스택

| 항목 | 선택 |
|---|---|
| 런타임 | Node.js + TypeScript |
| 프레임워크 | Express.js (with express-async-errors) |
| ORM | Prisma (SQLite 어댑터) |
| 인증 | jsonwebtoken + bcrypt (cost 12) |
| 파일 업로드 | multer |
| 입력 검증 | Zod |
| CORS | dev: `*`, prod: 화이트리스트 |
| Rate limit | 인증 엔드포인트 5req/min/IP |

### 아키텍처 (4계층)

```
routes → controllers → services → repositories → Prisma (SQLite)
         미들웨어: authMiddleware, validate(zod), errorHandler, requestLogger
```

### API Base Path

`/api/v1`

### 응답 포맷

- 성공: `{ "success": true, "data": { ... } }`
- 실패: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details"?: [...] } }`

### HTTP 상태 코드 규칙 `[AI 보완]`

| 코드 | 상황 |
|---|---|
| 200 | 성공 (조회·수정·삭제) |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 형식 |
| 401 | 인증 실패 (토큰 없음·만료) |
| 403 | 권한 없음 (타인 리소스 접근) |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 이메일 등) |
| 422 | 유효성 검증 실패 |
| 500 | 서버 내부 오류 |

---

## 8. 데이터베이스 범위

`[AI 보완]` 설계 방식, `[명세서]` + `[사용자 결정 K-01, K-02]` 테이블 구성

### 테이블 목록

| 테이블 | 설명 |
|---|---|
| `users` | 사용자 계정 정보 |
| `categories` | 사용자별 커스텀 카테고리 (`user_id` FK 포함) |
| `plans` | 일정/할 일 데이터 (soft delete 포함) |

### 인덱스

| 인덱스 | 대상 | 목적 |
|---|---|---|
| `idx_plans_user_display` | `plans(user_id, display_date)` | 오늘 할 일 조회 |
| `idx_plans_user_due` | `plans(user_id, due_date)` | 마감일 기준 캘린더 조회 |
| `idx_categories_user` | `categories(user_id)` | 사용자별 카테고리 조회 |
| `idx_plans_deleted` | `plans(deleted_at)` | soft delete 필터 |

### ORM / 마이그레이션

- Prisma Migrate (`prisma migrate dev` / `prisma migrate deploy`)
- 스키마 파일: `prisma/schema.prisma`

---

## 9. 전체 페이지 구조

`[사용자 결정 K-01, K-06, K-08]`

| 경로 | 페이지명 | 인증 필요 | 주요 컴포넌트 | 모달 사용 여부 |
|---|---|---|---|---|
| `/login` | 로그인 페이지 | X | LoginForm | X |
| `/auth` | 회원가입 페이지 | X | RegisterForm | X |
| `/` | 메인 페이지 | O | MonthCalendar, WeeklyBar, TodayList, FAB | O (일정 상세 모달) |
| `/plans/new` | 일정 등록 페이지 | O | PlanForm | O (저장·취소 확인 모달) |
| `/profile` | 프로필·카테고리 관리 | O | ProfileForm, PasswordForm, AvatarUpload, CategoryList | O (카테고리 추가·수정 팝업) |
| `?planId=123` | 일정 상세 모달 | O (부모 페이지 인증) | PlanDetailModal | — (모달 자체) |

**모달 URL 정책** `[사용자 결정 K-08]`
- 일정 상세는 독립 페이지가 아닌 **모달 오버레이**로 표시
- URL은 `?planId=123` 쿼리 파라미터로 반영하여 링크 공유 가능
- 모달 닫기 시 쿼리 파라미터 제거, 이전 스크롤 위치 복원

**네비게이션 구조** `[디자인]`
- 상단 고정 헤더: 검색바 + 프로필 아이콘
- 별도 사이드바·하단 탭 없음
- 우측 하단 FAB(`+`): `/plans/new`로 이동

---

## 10. 전체 사용자 흐름

`[명세서]` + `[사용자 결정 K-01, K-08]`

### 10-1. 회원가입 → 로그인 흐름

```
/auth (회원가입 폼 작성)
  → POST /api/v1/auth/register
  → 성공: 5개 기본 카테고리 자동 시드 생성 → /login 리디렉션
  → 실패: 인라인 오류 메시지 (이메일 중복 등)

/login (이메일+비밀번호 입력)
  → POST /api/v1/auth/login
  → 성공: Access Token 저장, Refresh Token httpOnly 쿠키 설정 → / 리디렉션
  → 실패: "이메일 또는 비밀번호가 올바르지 않습니다" 오류
```

### 10-2. 메인 페이지 진입 흐름

```
/ 접근
  → authMiddleware: Access Token 검증
  → GET /api/v1/plans?month=YYYY-MM (현재 월 일정 로드)
  → GET /api/v1/categories (카테고리 목록 로드)
  → 메인 페이지 렌더: 캘린더 → 주간 일정 바 → 오늘 할 일 [사용자 결정 K-05]
```

### 10-3. 일정 등록 흐름

```
/ → FAB(+) 클릭
  → /plans/new 이동
  → 폼 작성 (제목·마감일·마감시간·display_date·카테고리·중요도·메모·is_remind)
  → "저장하기" 클릭 → 저장 확인 모달 [명세서]
  → 확인 클릭 → POST /api/v1/plans
  → 성공: / 리디렉션, TanStack Query 캐시 무효화
  → 취소 클릭 → 취소 확인 모달 → 확인 시 / 리디렉션
```

### 10-4. 일정 상세 확인·수정 흐름

```
오늘 할 일 카드 / 캘린더 날짜 / 주간 바 일정 클릭
  → URL: /?planId=123 [사용자 결정 K-08]
  → GET /api/v1/plans/123
  → PlanDetailModal 표시 (제목·마감일·시간·카테고리·중요도·메모·완료 여부)
  → 수정 버튼 클릭 → 인라인 편집 모드 전환
  → 저장 → PATCH /api/v1/plans/123 → 캐시 무효화 → 모달 닫기
```

### 10-5. 완료 처리 흐름

```
오늘 할 일 목록에서 체크박스 클릭
  → PATCH /api/v1/plans/123/complete
  → 성공: 중간줄+회색 처리, 목록 최하위 이동
```

### 10-6. 일정 삭제 흐름

```
상세 모달에서 삭제 버튼 클릭
  → 삭제 확인 모달 표시 [명세서]
  → 확인 클릭 → DELETE /api/v1/plans/123 (soft delete)
  → 성공: 모달 닫기, 캐시 무효화, 캘린더·오늘 할 일·주간 바에서 즉시 제거
```

### 10-7. 로그아웃 흐름

```
프로필 아이콘 → 로그아웃
  → POST /api/v1/auth/logout (Refresh Token 쿠키 삭제)
  → Access Token 로컬 제거 → /login 리디렉션
```

---

## 11. 기능 목록

`[명세서]` + `[사용자 결정 K-01, K-02, K-06, K-07]`

| 번호 | 기능 구분 | 기능명 | 설명 |
|---|---|---|---|
| F-01 | 인증 | 회원가입 | 이메일·닉네임·비밀번호 입력, 5개 기본 카테고리 자동 생성 |
| F-02 | 인증 | 로그인 | 이메일+비밀번호 → JWT 발급 |
| F-03 | 인증 | 로그아웃 | Refresh Token 무효화, 토큰 삭제 |
| F-04 | 일정 | 일정 등록 | 7개 필드 입력, 저장 확인 모달 |
| F-05 | 일정 | 일정 상세 확인 | 모달 오버레이, URL 쿼리 파라미터 반영 |
| F-06 | 일정 | 일정 수정 | 모달 인라인 편집, 저장 확인 모달 |
| F-07 | 일정 | 일정 삭제 | 삭제 확인 모달, soft delete |
| F-08 | 일정 | 완료 처리 | 체크박스 토글, 중간줄+회색+목록 최하위 이동 |
| F-09 | 일정 | 월간 캘린더 보기 | 날짜별 일정 개수·카테고리 점 표시, 월 이동 |
| F-10 | 일정 | 오늘 할 일 보기 | display_date 기준, 중요도→마감시간 정렬 |
| F-11 | 일정 | 주간 일정 바 보기 | 월~일 요일별 일정 개수, 클릭 시 목록 확장 |
| F-12 | 일정 | 검색 | 제목+메모 키워드 LIKE 검색 |
| F-13 | 일정 | 필터링 | 카테고리·중요도·완료 여부 AND 필터 |
| F-14 | 카테고리 | 카테고리 조회 | 사용자별 카테고리 목록 |
| F-15 | 카테고리 | 카테고리 추가 | 이름·색상 입력, 팝업 |
| F-16 | 카테고리 | 카테고리 수정 | 이름·색상 변경 |
| F-17 | 카테고리 | 카테고리 삭제 | 연결 일정의 category_id → NULL 처리 `[사용자 결정 K-09]` |
| F-18 | 프로필 | 프로필 조회·수정 | 닉네임·이메일 표시, 닉네임 수정 |
| F-19 | 프로필 | 비밀번호 변경 | 현재 비밀번호 확인 후 새 비밀번호 설정 |
| F-20 | 프로필 | 아바타 업로드 | 이미지 파일 업로드, 로컬 저장 |

---

## 12. 기능별 상세 요구사항

`[명세서]` + `[사용자 결정 K-01~K-10]`

### 12-1. 회원가입 (F-01)

**사전 조건:** 비로그인 상태

**입력:**

| 필드 | 필수 | 제약 |
|---|---|---|
| 닉네임 | O | 2~20자 |
| 이메일 | O | RFC 5322 단순화 형식, 중복 불가 |
| 비밀번호 | O | 영문+숫자 포함 8자 이상 |
| 비밀번호 확인 | O | 비밀번호와 동일 |

**처리:**
1. 이메일 중복 확인 → 중복 시 409 에러
2. 비밀번호 bcrypt (cost 12) 해싱
3. `users` 테이블에 INSERT
4. 해당 사용자의 기본 카테고리 5개 시드 자동 INSERT `[사용자 결정 K-02]`
   - 미팅(보라 #7C3AED), 과제(파랑 #2563EB), 시험(빨강 #DC2626), 개인 일정(초록 #16A34A), 약속(주황 #EA580C) `[사용자 결정 K-03]`

**출력:** 201 Created, 사용자 기본 정보 (id, nickname, email, created_at)

**예외:**
- 이메일 중복: `{ code: "EMAIL_ALREADY_EXISTS", message: "이미 사용 중인 이메일입니다." }`
- 비밀번호 불일치: 422 클라이언트 사이드 사전 차단

---

### 12-2. 로그인 (F-02)

**입력:** 이메일, 비밀번호

**처리:**
1. 이메일로 사용자 조회 → 없으면 401
2. bcrypt.compare(입력 비밀번호, password_hash) → 불일치 시 401
3. Access Token (1h) 생성 → 응답 body
4. Refresh Token (7d) 생성 → httpOnly, Secure 쿠키

**출력:** 200, `{ accessToken, user: { id, nickname, email, avatarUrl } }`

**예외:**
- 인증 실패: `{ code: "AUTH_INVALID_CREDENTIALS", message: "이메일 또는 비밀번호가 올바르지 않습니다." }`

---

### 12-3. 일정 등록 (F-04)

**사전 조건:** 로그인 상태 `[명세서]`

**입력:**

| 필드 | 필수 | 제약 |
|---|---|---|
| title | O | 1~100자 |
| due_date | O | YYYY-MM-DD 형식, 과거 날짜 허용 |
| due_time | X | HH:mm 형식 또는 null |
| display_date | O | YYYY-MM-DD 형식 `[사용자 결정 K-10]`, 폼 기본값: due_date 값 |
| category_id | O | 사용자 소유 카테고리 ID |
| priority | O | high / normal / low |
| memo | X | 0~500자 |
| is_remind | X | boolean, 기본값 false `[사용자 결정 K-07]` |

**처리:**
1. Zod 스키마 서버 재검증
2. category_id가 본인 소유인지 확인
3. `plans` 테이블에 INSERT (`user_id` = 요청자 ID)

**출력:** 201 Created, 생성된 일정 전체 필드

**후처리:** 클라이언트에서 TanStack Query `invalidateQueries(['plans'])` 실행

**예외:**
- 유효성 실패: `{ code: "VALIDATION_FAILED", details: [...] }`
- 타인 카테고리 사용: `{ code: "CATEGORY_NOT_FOUND" }`

---

### 12-4. 일정 상세 확인 (F-05)

**사전 조건:** 로그인 상태, 해당 일정 소유자

**진입 방식:** `[사용자 결정 K-08]`
- 오늘 할 일 카드, 주간 바 일정 카드, 캘린더 날짜 클릭
- URL: `/?planId=123` (쿼리 파라미터)
- PlanDetailModal 오버레이 표시

**표시 정보:**
- 제목, due_date, due_time (없으면 미표시), display_date, 카테고리 (칩+색상), 중요도 (칩), 메모 (없으면 미표시), 완료 여부, D-Day 배지, is_remind 상태

**제공 버튼:** 수정 (인라인 편집 모드 전환), 삭제, 완료 체크박스, 닫기

---

### 12-5. 일정 수정 (F-06)

**사전 조건:** 일정 상세 모달 열린 상태, 소유자

**동작:** 수정 버튼 클릭 → 모달 내 인라인 편집 모드 전환 `[AI 보완]`

**수정 가능 항목:** `[명세서]` title, due_date, due_time, display_date, category_id, priority, memo, is_remind

**저장 흐름:**
1. "저장" 클릭 → 저장 확인 모달 `[명세서]`
2. 확인 → PATCH /api/v1/plans/:id
3. 성공 → 캐시 무효화, 상세 모달 뷰 모드로 전환

**예외:** 동일 값으로 저장 시도 → 서버 정상 처리 (차이 없어도 updated_at 갱신)

---

### 12-6. 일정 삭제 (F-07)

**동작:** `[명세서]`
1. 삭제 버튼 클릭 → "이 일정을 삭제하시겠습니까?" 확인 모달
2. 확인 → DELETE /api/v1/plans/:id
3. 서버: `deleted_at = NOW()` (soft delete)
4. 클라이언트: 모달 닫기, 캐시 무효화 → 캘린더·오늘 할 일·주간 바에서 즉시 사라짐

---

### 12-7. 완료 처리 (F-08)

**동작:** `[명세서]`
- 체크박스 클릭 → PATCH /api/v1/plans/:id/complete
- 서버: `is_completed = !current_value`
- 클라이언트:
  - 완료 시: 제목에 `text-decoration: line-through`, 텍스트 회색, 오늘 할 일 목록 최하위 이동
  - 미완료 복귀 시: 스타일 제거, 정렬 기준 재적용

---

### 12-8. 카테고리 관리 (F-14~F-17)

**사전 조건:** 로그인 상태, 프로필 페이지 (`/profile`) `[사용자 결정 K-02]`

**조회:** GET /api/v1/categories → 사용자 카테고리 목록 (sort_order 순)

**추가:**
1. `+ 카테고리 추가` 클릭 → 카테고리 추가 팝업
2. 이름 (필수, 1~30자), 색상 (필수, 미리 정의된 색상 중 선택)
3. POST /api/v1/categories → 새 카테고리 생성

**수정:**
1. 연필 아이콘 클릭 → 카테고리 수정 팝업
2. 이름·색상 변경 → PUT /api/v1/categories/:id

**삭제:** `[사용자 결정 K-09]`
1. 휴지통 아이콘 클릭 → 삭제 확인 모달
2. 확인 → DELETE /api/v1/categories/:id
3. 서버: 해당 카테고리 삭제 + 연결된 모든 plans의 `category_id = NULL` 처리
4. 클라이언트: 해당 일정들은 "미분류"로 표시됨

---

### 12-9. 프로필 관리 (F-18~F-20)

`[사용자 결정 K-06]` 프로필 페이지 (`/profile`) 포함

**프로필 조회:** GET /api/v1/profile → nickname, email, avatarUrl

**닉네임 수정:** PATCH /api/v1/profile (body: `{ nickname }`)

**비밀번호 변경:**
- 입력: 현재 비밀번호, 새 비밀번호, 새 비밀번호 확인
- PATCH /api/v1/profile/password
- 현재 비밀번호 bcrypt 검증 후 새 비밀번호 해싱·저장

**아바타 업로드:**
- POST /api/v1/profile/avatar (multipart/form-data)
- multer로 `/uploads/avatars/{userId}_{timestamp}.{ext}` 저장
- 응답: avatarUrl 반환 → users.avatar_url 업데이트

---

## 13. 페이지별 UI 요구사항

`[명세서]` + `[디자인]` (공통 UI 참조), `[사용자 결정 K-05]`

### 13-1. 로그인 페이지 (`/login`)

`[디자인]` 01_login_page.png 참조

- **헤더:** PlanMate 로고 + 태그라인 "차분한 생산성의 시작"
- **폼 구성:** 이메일 입력, 비밀번호 입력, charcoal 채움 "로그인" 버튼
- **링크:** "비밀번호 찾기 | 회원가입"
- **동작:** 로그인 성공 시 `/` 리디렉션, 이미 로그인 상태이면 `/` 리디렉션

### 13-2. 회원가입 페이지 (`/auth`)

`[디자인]` 02_auth_page.png 참조

- **폼 구성:** 닉네임, 이메일, 비밀번호 (플레이스홀더: "영문+숫자 포함 8자 이상"), 비밀번호 확인
- **버튼:** charcoal "가입하기"
- **링크:** "이미 계정이 있으신가요? 로그인"
- **인라인 검증:** 각 필드 blur 시 실시간 오류 표시

### 13-3. 메인 페이지 (`/`)

`[사용자 결정 K-05]` 섹션 순서: 캘린더 → 주간 일정 바 → 오늘 할 일 (디자인 03_main_page.png 기준)

`[디자인]` 03_main_page.png 참조

**상단 헤더 (고정):**
- 검색바: 돋보기 아이콘 + 플레이스홀더 "일정명 또는 메모 검색"
- 우측: 프로필 아이콘 (클릭 시 `/profile` 이동 또는 드롭다운)

**섹션 1 — 월간 캘린더:**
- 현재 월 제목 + 이전/다음 달 화살표
- 6주×7일 격자, 일요일~토요일 헤더
- 날짜 셀: 일자 숫자, 해당 날의 일정 카테고리 색상 점 (최대 3개 표시 후 "+N")
- 오늘 날짜 강조 (charcoal 원형 배경)
- 이전/다음 달 날짜는 비활성 색상

**섹션 2 — 주간 일정 바:**
- 이번 주(월~일) 각 요일의 일정 개수를 바 형태로 표시
- 오늘 요일 강조
- 요일 클릭 시 아래로 확장, 해당 날의 일정 카드 목록 표시
- 이미 선택된 요일 재클릭 시 접힘

**섹션 3 — 오늘 할 일:**
- display_date == 오늘인 일정 목록 `[사용자 결정 K-10]`
- 각 카드: 체크박스, 제목, 카테고리 칩, 마감 시간, 중요도 칩, D-Day 배지
- 완료 항목: 중간줄+회색, 목록 최하위
- 정렬: 중요도 높음→보통→낮음, 동률 시 마감시간 빠른 순 `[사용자 결정 K-04]`

**우측 하단 FAB:** charcoal `+` 버튼 → `/plans/new`

### 13-4. 일정 등록 페이지 (`/plans/new`)

`[명세서]` + `[디자인]` 04_add_plan_page.png 참조

- **헤더:** ← 뒤로가기 + "할일 등록"
- **폼 필드:**
  1. 할 일 제목 (텍스트 입력, 필수)
  2. 마감 기한 (date picker, 필수)
  3. 마감 시간 (time picker, 선택)
  4. 오늘의 할 일에 표시 날짜 (date picker, 필수, 기본값: 마감일) `[사용자 결정 K-10]`
  5. "당일날 알려주기" 체크박스 (UI만 표시, 알림 미발송) `[사용자 결정 K-07]`
  6. 카테고리 (칩 선택, 필수) — 사용자 카테고리 목록
  7. 중요도 (높음/보통/낮음 칩 선택, 필수) `[명세서]`
  8. 메모 (텍스트 영역, 선택)
- **버튼:** charcoal "저장하기" (클릭 시 저장 확인 모달), ghost "취소" (클릭 시 취소 확인 모달) `[명세서]`

### 13-5. 프로필 페이지 (`/profile`)

`[사용자 결정 K-06]` + `[디자인]` 06_profile_page.png, 07_category_add_popup.png 참조

**프로필 섹션:**
- 프로필 이미지 + 편집 아이콘
- 닉네임 표시
- "프로필 이미지 변경" 버튼 (파일 선택)

**개인정보 수정 섹션:**
- 닉네임 수정 인풋
- 이메일 표시 (수정 불가, read-only)
- "비밀번호 변경" 링크/섹션

**카테고리 커스터마이징 섹션:** `[사용자 결정 K-02]`
- 카테고리 목록: 색상 점 + 이름 + 연필 아이콘 + 휴지통 아이콘
- `+ 카테고리 추가` 버튼
- 추가/수정 시 팝업: 이름 입력 + 색상 선택

**저장 버튼:** charcoal "저장"

### 13-6. 일정 상세 모달

`[사용자 결정 K-08]` 모달 오버레이 방식

- 모달 헤더: 제목, 닫기(X) 버튼
- 내용: 일정 전체 정보 표시
- D-Day 배지 (클라이언트 계산)
- 하단 버튼: 완료 체크박스, 수정, 삭제
- 오버레이 클릭 시 모달 닫기
- 수정 모드 전환 시 폼 필드로 인라인 전환

---

## 14. 디자인 시스템 적용 기준

`[디자인]` Serene Productivity 테마, `[사용자 결정 K-03]` 카테고리 색상은 컬러풀 5색

### 14-1. 색상 토큰 (Tailwind config 매핑)

| 토큰명 | 값 | 용도 |
|---|---|---|
| `charcoal` | `#21201a` | 주 색상, FAB, 버튼 채움, 텍스트 |
| `surface` | `#f9f9f7` | 배경 |
| `container` | `#eeeeec` | 카드·컨테이너 배경 |
| `on-surface` | `#1a1c1b` | 주 텍스트 |
| `outline` | `#7a776e` | 보조 텍스트, 비활성 아이콘 |
| `error` | `#ba1a1a` | 오류 상태 |
| `soft-border` | `#e5e7eb` | 카드·인풋 테두리 |

### 14-2. 카테고리 색상 토큰 `[사용자 결정 K-03]`

컬러풀 5색 고정 (명세서 기준):

| 카테고리 | 색상 | HEX |
|---|---|---|
| 미팅 | 보라 | `#7C3AED` |
| 과제 | 파랑 | `#2563EB` |
| 시험 | 빨강 | `#DC2626` |
| 개인 일정 | 초록 | `#16A34A` |
| 약속 | 주황 | `#EA580C` |

- 사용자가 추가하는 카테고리의 색상은 별도 색상 팔레트에서 선택 (`[사용자 결정 K-02]`)
- 기본 5개 시드의 색상은 위 표의 값으로 고정 생성

### 14-3. 타이포그래피 토큰

| 역할 | 폰트 | 크기 | 굵기 |
|---|---|---|---|
| h1 | Inter | 32px | 700 |
| h2 | Inter | 24px | 600 |
| h3 | Inter | 18px | 600 |
| body-lg | Inter | 16px | 400 |
| body-md | Inter | 14px | 400 |
| label-md | Inter | 14px | 500 |
| label-sm | Inter | 12px | 500 |

### 14-4. 간격·형태 토큰

| 항목 | 값 |
|---|---|
| 간격 베이스라인 | 4px |
| 컨테이너 최대 너비 | 800px |
| 거터 | 16px |
| 기본 모서리 반경 | 0.25rem (4px) |
| 카드·모달 모서리 반경 | 0.5rem (8px) |
| 칩·필 모서리 반경 | 9999px |

### 14-5. 컴포넌트 가이드라인

| 컴포넌트 | 규칙 |
|---|---|
| 버튼 (Primary) | charcoal 채움, 흰색 텍스트, 8px×12px 패딩 |
| 버튼 (Secondary/Ghost) | 투명 배경, charcoal 테두리 1px, charcoal 텍스트 |
| 체크박스 | 16px×16px, 4px radius, 완료 시 charcoal 채움+흰 체크 |
| 인풋 필드 | 1px 테두리 `#e5e7eb`, 포커스 시 테두리 진하게 |
| 카드 | 1px 테두리, 그림자 없음, 흰 배경 |
| 칩 | 회색 배경 `#f7f7f5`, medium weight 텍스트, 테두리 없음 |
| 중요도 칩 | 높음=빨강 계열, 보통=노랑 계열, 낮음=초록 계열 배경 `[AI 보완]` |

---

## 15. 일정 데이터 모델

`[명세서]` + `[사용자 결정 K-07, K-10]` + `[AI 보완]` (soft delete, updated_at)

**테이블명:** `plans`

| 컬럼명 | 타입 | NULL | 기본값 | 제약 | 설명 |
|---|---|---|---|---|---|
| id | INTEGER | NOT NULL | autoincrement | PK | 기본키 |
| user_id | INTEGER | NOT NULL | — | FK → users(id), ON DELETE CASCADE | 소유 사용자 |
| title | TEXT | NOT NULL | — | 1~100자 | 일정 제목 `[명세서]` |
| due_date | TEXT | NOT NULL | — | YYYY-MM-DD | 마감일 `[명세서]` |
| due_time | TEXT | NULL | NULL | HH:mm 또는 NULL | 마감 시간 `[명세서]` |
| display_date | TEXT | NOT NULL | — | YYYY-MM-DD | 오늘 할 일 표시 날짜, 사용자가 처리할 날짜 지정 `[사용자 결정 K-10]` |
| category_id | INTEGER | NULL | NULL | FK → categories(id), ON DELETE SET NULL | 카테고리 (삭제 시 NULL) `[사용자 결정 K-09]` |
| priority | TEXT | NOT NULL | 'normal' | CHECK IN ('high','normal','low') | 중요도 `[명세서]` |
| memo | TEXT | NULL | NULL | 0~500자 | 메모 `[명세서]` |
| is_completed | INTEGER | NOT NULL | 0 | CHECK IN (0,1) (boolean) | 완료 여부 `[명세서]` |
| is_remind | INTEGER | NOT NULL | 0 | CHECK IN (0,1) | 당일 알림 희망 여부 (UI만, 미발송) `[사용자 결정 K-07]` |
| created_at | TEXT | NOT NULL | CURRENT_TIMESTAMP | ISO 8601 | 등록일시 |
| updated_at | TEXT | NOT NULL | CURRENT_TIMESTAMP | ISO 8601 | 수정일시 |
| deleted_at | TEXT | NULL | NULL | ISO 8601 | soft delete 일시 `[AI 보완]` |

**인덱스:**
- `UNIQUE(id)`
- `INDEX idx_plans_user_display(user_id, display_date)`
- `INDEX idx_plans_user_due(user_id, due_date)`
- `INDEX idx_plans_deleted(deleted_at)`

**조회 기본 조건:** `WHERE deleted_at IS NULL`

---

## 16. 사용자 데이터 모델

`[사용자 결정 K-01]` + `[AI 보완]`

**테이블명:** `users`

| 컬럼명 | 타입 | NULL | 기본값 | 제약 | 설명 |
|---|---|---|---|---|---|
| id | INTEGER | NOT NULL | autoincrement | PK | 기본키 |
| email | TEXT | NOT NULL | — | UNIQUE | 로그인 이메일 |
| password_hash | TEXT | NOT NULL | — | — | bcrypt 해시 (cost 12) |
| nickname | TEXT | NOT NULL | — | 2~20자 | 닉네임 |
| avatar_url | TEXT | NULL | NULL | — | 프로필 이미지 경로 `[사용자 결정 K-06]` |
| created_at | TEXT | NOT NULL | CURRENT_TIMESTAMP | ISO 8601 | 가입일시 |
| updated_at | TEXT | NOT NULL | CURRENT_TIMESTAMP | ISO 8601 | 수정일시 |

**인덱스:**
- `UNIQUE(email)`

**비밀번호 정책:**
- 영문+숫자 포함 8자 이상
- bcrypt cost factor 12로 해싱
- 원문 비밀번호는 저장하지 않음

---

## 17. 카테고리 데이터 모델

`[사용자 결정 K-02, K-03]` + `[AI 보완]`

**테이블명:** `categories`

| 컬럼명 | 타입 | NULL | 기본값 | 제약 | 설명 |
|---|---|---|---|---|---|
| id | INTEGER | NOT NULL | autoincrement | PK | 기본키 |
| user_id | INTEGER | NOT NULL | — | FK → users(id), ON DELETE CASCADE | 소유 사용자 |
| name | TEXT | NOT NULL | — | 1~30자 | 카테고리 이름 |
| color | TEXT | NOT NULL | — | HEX 또는 색상명 | 카테고리 색상 |
| sort_order | INTEGER | NOT NULL | 0 | — | 정렬 순서 |
| created_at | TEXT | NOT NULL | CURRENT_TIMESTAMP | ISO 8601 | 생성일시 |
| updated_at | TEXT | NOT NULL | CURRENT_TIMESTAMP | ISO 8601 | 수정일시 |

**인덱스:**
- `INDEX idx_categories_user(user_id)`

**회원가입 시 자동 시드 생성 로직** `[사용자 결정 K-02]`

회원가입 완료 후 아래 5개 카테고리를 해당 `user_id`로 자동 INSERT:

| sort_order | name | color |
|---|---|---|
| 1 | 미팅 | `#7C3AED` |
| 2 | 과제 | `#2563EB` |
| 3 | 시험 | `#DC2626` |
| 4 | 개인 일정 | `#16A34A` |
| 5 | 약속 | `#EA580C` |

**카테고리 삭제 시 처리** `[사용자 결정 K-09]`
- 카테고리 삭제 시 연결된 `plans.category_id`를 NULL로 SET (ON DELETE SET NULL FK 규칙)
- 일정 자체는 삭제되지 않으며 "미분류"로 표시

---

## 18. 프로필 데이터 모델

`[사용자 결정 K-06]` + `[AI 보완]`

프로필 데이터는 `users` 테이블을 사용하며 별도 테이블 없음.

| 프로필 항목 | 컬럼 | 수정 가능 |
|---|---|---|
| 닉네임 | users.nickname | O |
| 이메일 | users.email | X (표시만) |
| 비밀번호 | users.password_hash | O (별도 변경 절차) |
| 아바타 이미지 | users.avatar_url | O |

**비밀번호 변경 절차:**
1. 현재 비밀번호 입력 → bcrypt.compare 검증
2. 새 비밀번호 + 확인 입력 → 동일 여부 및 정책 검증
3. 새 비밀번호 해싱 → `password_hash` UPDATE

**아바타 저장 경로:** `/uploads/avatars/{userId}_{timestamp}.{ext}`

---

## 19. 인증/인가 요구사항

`[사용자 결정 K-01]` + `[AI 보완]`

### 19-1. JWT 토큰 스펙

| 항목 | Access Token | Refresh Token |
|---|---|---|
| 유효기간 | 1시간 | 7일 |
| 전달 방식 | 응답 body → 클라이언트 메모리 | httpOnly Secure 쿠키 |
| API 사용 | Authorization: Bearer `<accessToken>` 헤더 | POST /api/v1/auth/refresh 쿠키 자동 전송 |
| 페이로드 | `{ userId, email, iat, exp }` | `{ userId, iat, exp }` |

### 19-2. 인증 미들웨어 동작

1. Authorization 헤더에서 Bearer 토큰 추출
2. `jwt.verify(token, JWT_SECRET)` → 실패 시 401
3. 토큰 만료 시 401 반환 → 클라이언트가 /auth/refresh 호출
4. Refresh 성공 시 새 Access Token 발급, 클라이언트 재시도
5. Refresh 실패 시 → 클라이언트 `/login` 리디렉션

### 19-3. 공개 경로 (인증 불필요)

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

### 19-4. 인가 규칙

- 모든 plans, categories, profile API에서 `user_id === req.user.id` 검증
- 타인 리소스 접근 시 403 반환

### 19-5. Rate Limit `[AI 보완]`

- 인증 엔드포인트 (login, register): 5req/min/IP
- 초과 시 429 Too Many Requests

### 19-6. 비밀번호 정책 `[AI 보완]`

- 영문(대소문자 무관) + 숫자 조합 8자 이상
- 최대 길이: 72자 (bcrypt 제한)
- 특수문자 필수 여부: 미결정 (섹션 40 참조)

---

## 20. API 요구사항

`[명세서]` + `[AI 보완]`, Base path: `/api/v1`

### 20-1. 인증 API

| # | METHOD | 경로 | 인증 | 요청 스키마 | 응답 스키마 | 에러 코드 |
|---|---|---|---|---|---|---|
| A-01 | POST | `/auth/register` | X | `{ email, password, nickname }` | `{ user: { id, email, nickname } }` | EMAIL_ALREADY_EXISTS, VALIDATION_FAILED |
| A-02 | POST | `/auth/login` | X | `{ email, password }` | `{ accessToken, user: { id, email, nickname, avatarUrl } }` | AUTH_INVALID_CREDENTIALS |
| A-03 | POST | `/auth/refresh` | X (쿠키) | — | `{ accessToken }` | AUTH_REFRESH_EXPIRED |
| A-04 | POST | `/auth/logout` | O | — | `{ message: "로그아웃 완료" }` | — |
| A-05 | GET | `/auth/me` | O | — | `{ user: { id, email, nickname, avatarUrl } }` | AUTH_UNAUTHORIZED |

### 20-2. 일정 API

| # | METHOD | 경로 | 인증 | 요청 스키마 | 응답 스키마 | 에러 코드 |
|---|---|---|---|---|---|---|
| P-01 | GET | `/plans` | O | Query: `month=YYYY-MM`, `search=`, `category=`, `priority=`, `completed=` | `{ plans: [...] }` | AUTH_UNAUTHORIZED |
| P-02 | POST | `/plans` | O | `{ title, due_date, due_time?, display_date, category_id, priority, memo?, is_remind? }` | `{ plan: {...} }` | VALIDATION_FAILED, CATEGORY_NOT_FOUND |
| P-03 | GET | `/plans/:id` | O | — | `{ plan: {...} }` | PLAN_NOT_FOUND, AUTH_FORBIDDEN |
| P-04 | PATCH | `/plans/:id` | O | `{ title?, due_date?, due_time?, display_date?, category_id?, priority?, memo?, is_remind? }` | `{ plan: {...} }` | PLAN_NOT_FOUND, AUTH_FORBIDDEN, VALIDATION_FAILED |
| P-05 | DELETE | `/plans/:id` | O | — | `{ message: "삭제 완료" }` | PLAN_NOT_FOUND, AUTH_FORBIDDEN |
| P-06 | PATCH | `/plans/:id/complete` | O | — | `{ plan: { id, is_completed } }` | PLAN_NOT_FOUND, AUTH_FORBIDDEN |

**일정 목록 조회 (P-01) 쿼리 파라미터 상세:**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| month | YYYY-MM | 해당 월의 display_date 범위 필터 (생략 시 전체) |
| search | string | 제목+메모 LIKE `%keyword%` |
| category | integer (복수 가능) | 카테고리 ID 필터 |
| priority | high/normal/low | 중요도 필터 |
| completed | 0 또는 1 | 완료 여부 필터 |

**일정 객체 스키마:**
```
{
  id: integer,
  userId: integer,
  title: string,
  dueDate: string (YYYY-MM-DD),
  dueTime: string | null (HH:mm),
  displayDate: string (YYYY-MM-DD),
  categoryId: integer | null,
  category: { id, name, color } | null,
  priority: "high" | "normal" | "low",
  memo: string | null,
  isCompleted: boolean,
  isRemind: boolean,
  createdAt: string,
  updatedAt: string
}
```

### 20-3. 카테고리 API

`[사용자 결정 K-02]`

| # | METHOD | 경로 | 인증 | 요청 스키마 | 응답 스키마 | 에러 코드 |
|---|---|---|---|---|---|---|
| C-01 | GET | `/categories` | O | — | `{ categories: [...] }` | AUTH_UNAUTHORIZED |
| C-02 | POST | `/categories` | O | `{ name, color, sort_order? }` | `{ category: {...} }` | VALIDATION_FAILED |
| C-03 | PUT | `/categories/:id` | O | `{ name?, color?, sort_order? }` | `{ category: {...} }` | CATEGORY_NOT_FOUND, AUTH_FORBIDDEN |
| C-04 | DELETE | `/categories/:id` | O | — | `{ message: "삭제 완료", affectedPlans: integer }` | CATEGORY_NOT_FOUND, AUTH_FORBIDDEN |

**카테고리 삭제 (C-04) 동작 `[사용자 결정 K-09]`:**
- 카테고리 레코드 삭제
- 해당 카테고리를 참조하는 plans의 `category_id = NULL` UPDATE
- 응답: 영향받은 일정 수 (`affectedPlans`) 반환

### 20-4. 프로필 API

`[사용자 결정 K-06]`

| # | METHOD | 경로 | 인증 | 요청 스키마 | 응답 스키마 | 에러 코드 |
|---|---|---|---|---|---|---|
| PR-01 | GET | `/profile` | O | — | `{ user: { id, email, nickname, avatarUrl, createdAt } }` | AUTH_UNAUTHORIZED |
| PR-02 | PATCH | `/profile` | O | `{ nickname? }` | `{ user: {...} }` | VALIDATION_FAILED |
| PR-03 | PATCH | `/profile/password` | O | `{ currentPassword, newPassword, newPasswordConfirm }` | `{ message: "비밀번호 변경 완료" }` | AUTH_INVALID_CREDENTIALS, VALIDATION_FAILED |
| PR-04 | POST | `/profile/avatar` | O | multipart/form-data `{ avatar: File }` | `{ avatarUrl: string }` | FILE_TOO_LARGE, INVALID_FILE_TYPE |

---

## 21. 날짜 처리 규칙

`[AI 보완]` KST 고정, `[명세서]` D-Day 규칙

### 21-1. 날짜 포맷 표준

| 대상 | 포맷 |
|---|---|
| API 입출력 (날짜) | `YYYY-MM-DD` (ISO 8601) |
| API 입출력 (시간) | `HH:mm` |
| DB 저장 (날짜·시간) | KST 텍스트 `YYYY-MM-DD HH:mm` |
| 화면 표시 | 한국어 형식 (`2026년 5월 20일`, `오전 10:30`) |

### 21-2. 타임존 정책 `[AI 보완]`

- 타임존: KST(UTC+9) 단일 고정
- 서버와 클라이언트 모두 KST 기준으로 처리
- DB에 KST 텍스트로 저장 (UTC 변환 없음, 단순화)

### 21-3. "오늘" 판단 기준

- 클라이언트: `new Date()` 기준 KST 날짜
- D-Day 계산: 클라이언트 사이드에서 `date-fns`의 `differenceInCalendarDays(due_date, today)` 사용

### 21-4. display_date 의미 `[사용자 결정 K-10]`

- **정의:** 사용자가 "이 일정을 처리할 날짜"로 직접 지정하는 필드
- `due_date`(마감일)와 다를 수 있음 (예: 마감은 5/25이지만 5/22에 미리 처리)
- 등록 폼 기본값: `due_date` 값
- 오늘 할 일 목록에 표시되는 기준: `display_date == 오늘`

### 21-5. 캘린더 날짜 범위

- 월간 캘린더: 해당 월 1일~말일 + 앞뒤 빈 날짜 (6주 고정 격자)
- 이전/다음 달 날짜는 비활성 스타일로 표시

---

## 22. 오늘 할 일 표시 규칙

`[명세서]` + `[사용자 결정 K-04, K-10]`

### 22-1. 표시 조건

- `display_date == 오늘(KST)` 이고 `deleted_at IS NULL`인 일정만 표시 `[사용자 결정 K-10]`
- 완료 여부 무관하게 모두 표시 (완료 항목은 최하위)

### 22-2. 정렬 규칙 `[사용자 결정 K-04]`

```
1순위: 완료 여부 (미완료 우선)
2순위: 중요도 (high → normal → low)
3순위: 마감 시간 (due_time 빠른 순, null은 최하위)
4순위: 등록 순 (created_at 오래된 순)
```

※ 명세서 5.3 기준 채택 (중요도 우선). 명세서 8.1 (마감시간 우선)은 K-04=A 사용자 결정에 의해 폐기.

### 22-3. 완료 항목 표시

- 중간줄 (`text-decoration: line-through`), 텍스트 회색 (`#7a776e`)
- 오늘 할 일 목록 내 최하위 위치

### 22-4. 빈 상태

- 오늘 할 일이 없는 경우: "오늘 처리할 일정이 없습니다." 텍스트 표시

---

## 23. 월간 캘린더 표시 규칙

`[명세서]`

### 23-1. 격자 구성

- 6주×7일 고정 격자 (요일 헤더: 일~토)
- 해당 월 1일이 시작하는 요일 기준 앞 날짜와 말일 이후 날짜는 비활성

### 23-2. 날짜 셀 표시 항목

| 항목 | 규칙 |
|---|---|
| 일자 숫자 | 해당 날짜 숫자 |
| 일정 표시 | 해당 날짜에 `display_date`가 있는 일정의 카테고리 색상 점 |
| 색상 점 최대 | 최대 3개, 초과 시 "+N" 텍스트 |
| 오늘 날짜 | charcoal 원형 배경 강조 |
| 이전/다음 달 날짜 | outline 색상 (비활성) |

### 23-3. 월 이동

- 이전 달(`<`) / 다음 달(`>`) 버튼 클릭
- 이동 시 해당 월 일정 데이터 재요청: `GET /api/v1/plans?month=YYYY-MM`

---

## 24. 주간 일정 바 표시 규칙

`[명세서]` + `[사용자 결정 K-05]`

### 24-1. 주간 범위

- 이번 주 월요일~일요일 (ISO 주 기준)
- 날짜 기준: `display_date` 기반으로 집계 `[AI 보완]`

### 24-2. 바 차트 표시

- 각 요일의 일정 개수를 막대 높이로 표현
- 오늘 요일 강조 (charcoal 색상 바)
- 빈 날 (0개): 빈 바 표시

### 24-3. 요일 클릭 동작

- 클릭 시 해당 요일의 일정 카드 목록이 아래로 확장 표시
- 이미 선택된 요일 재클릭 시 접힘 (COLLAPSED)
- 다른 요일 클릭 시 이전 확장 닫히고 새 요일 확장
- 확장 시 표시 정보: 일정 카드 (제목+카테고리 칩+시간+중요도 칩+연필 아이콘)

---

## 25. 완료 상태 처리 규칙

`[명세서]`

### 25-1. 완료 처리

| 단계 | 동작 |
|---|---|
| 체크박스 클릭 (미완료 → 완료) | PATCH /api/v1/plans/:id/complete 호출 |
| 서버 처리 | `is_completed = 1`, `updated_at` 갱신 |
| UI 반영 | 제목 중간줄, 텍스트 회색, 오늘 할 일 목록 최하위로 이동 |
| 캘린더 반영 | 완료 항목도 캘린더·상세보기에서 계속 표시 |

### 25-2. 완료 취소

- 체크박스 재클릭 시 완료 취소 가능 (`is_completed = 0`)
- 취소 시 PATCH /api/v1/plans/:id/complete 동일 엔드포인트 재호출 (토글)
- UI: 중간줄·회색 제거, 정렬 기준 재적용

> **확정 필요:** 완료 취소 가능 여부는 섹션 40에 "확정 필요" 항목으로 기록됨.

---

## 26. 일정 등록 규칙

`[명세서]`

### 26-1. 폼 필드 검증 규칙

| 필드 | 검증 규칙 | 오류 메시지 |
|---|---|---|
| 제목 | 필수, 1~100자 | "제목을 입력해주세요." / "제목은 100자 이하로 입력해주세요." |
| 마감일 | 필수, YYYY-MM-DD | "마감일을 선택해주세요." |
| 마감 시간 | 선택, HH:mm | "올바른 시간 형식을 입력해주세요." |
| display_date | 필수, YYYY-MM-DD | "처리 날짜를 선택해주세요." |
| 카테고리 | 필수, 유효 ID | "카테고리를 선택해주세요." |
| 중요도 | 필수, high/normal/low | "중요도를 선택해주세요." |
| 메모 | 선택, 0~500자 | "메모는 500자 이하로 입력해주세요." |

### 26-2. 저장 흐름

1. "저장하기" 클릭 → 클라이언트 Zod 검증
2. 오류 시 → 인라인 오류 메시지 표시, 저장 중단
3. 검증 통과 → 저장 확인 모달 ("이 일정을 등록하시겠습니까?") `[명세서]`
4. 확인 → POST /api/v1/plans
5. 성공 → `/` 리디렉션, 캐시 무효화
6. 실패 → 서버 오류 토스트 표시

### 26-3. 취소 흐름

1. "취소" 클릭 → 취소 확인 모달 ("작성 중인 내용이 사라집니다. 취소하시겠습니까?") `[명세서]`
2. 확인 → `/` 리디렉션, 입력 내용 파기
3. 취소 → 모달 닫기, 폼 유지

### 26-4. display_date 기본값 `[사용자 결정 K-10]`

- 마감일 선택 시 display_date 필드가 자동으로 동일 날짜로 설정
- 사용자가 수동으로 변경 가능

---

## 27. 일정 상세 확인 규칙

`[명세서]` + `[사용자 결정 K-08]`

### 27-1. 진입 방식

- 오늘 할 일 카드 클릭
- 주간 바 확장 목록 카드 클릭
- 캘린더 날짜 셀 클릭 → 해당 날짜 일정 목록 팝업 → 일정 클릭
- URL: `/?planId=123` (쿼리 파라미터 반영, 공유 가능)

### 27-2. 모달 표시 정보

| 항목 | 표시 조건 |
|---|---|
| 제목 | 항상 |
| 마감일 (due_date) | 항상 |
| 마감 시간 (due_time) | 값이 있는 경우 |
| 처리 날짜 (display_date) | 항상 |
| 카테고리 (칩+색상) | 값이 있는 경우 (없으면 "미분류") |
| 중요도 (칩) | 항상 |
| 메모 | 값이 있는 경우 |
| 완료 여부 (체크박스) | 항상 |
| D-Day 배지 | 항상 (클라이언트 계산) |
| is_remind 표시 | UI 표시 (알림 발송 안 됨) |

### 27-3. 제공 액션

- 수정 버튼: 인라인 편집 모드 전환
- 삭제 버튼: 삭제 확인 모달 트리거
- 완료 체크박스: 완료 토글 즉시 적용
- 닫기(X): 모달 닫기, URL에서 `?planId` 제거

---

## 28. 일정 수정 규칙

`[명세서]` + `[AI 보완]`

### 28-1. 수정 진입

- 일정 상세 모달에서 수정 버튼 클릭 → 인라인 편집 모드 전환 `[AI 보완]`
- 모달이 폼 형태로 전환 (동일 모달 내부)

### 28-2. 수정 가능 항목

`[명세서]`: title, due_date, due_time, display_date, category_id, priority, memo, is_remind

### 28-3. 저장 흐름

1. 수정 후 "저장" 클릭 → 저장 확인 모달 `[명세서]`
2. 확인 → PATCH /api/v1/plans/:id (변경된 필드만 전송)
3. 성공 → 캐시 무효화, 뷰 모드로 복귀
4. 실패 → 오류 토스트

### 28-4. 취소 흐름

1. "취소" 클릭 → 취소 확인 모달 `[명세서]`
2. 확인 → 편집 내용 파기, 뷰 모드로 복귀

---

## 29. 일정 삭제 규칙

`[명세서]` + `[AI 보완]`

### 29-1. 삭제 흐름

1. 일정 상세 모달에서 삭제 버튼 클릭
2. 삭제 확인 모달 표시: "이 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다." `[명세서]`
3. 확인 클릭 → DELETE /api/v1/plans/:id
4. 서버: `deleted_at = NOW()` (soft delete) `[AI 보완]`
5. 성공: 모달 닫기 + URL 쿼리 파라미터 제거
6. 클라이언트: 캐시 무효화 → 캘린더·오늘 할 일·주간 바에서 즉시 사라짐

### 29-2. 삭제 실패 처리

- 네트워크 오류: 오류 토스트 표시, 삭제 확인 모달 유지
- 권한 없음(403): "삭제 권한이 없습니다." 토스트

---

## 30. 검색/필터 동작 규칙

`[명세서]`

### 30-1. 검색 동작

| 항목 | 규칙 |
|---|---|
| 검색 UI 위치 | 메인 페이지 상단 헤더 검색바 |
| 검색 대상 | title, memo 필드 |
| 검색 방식 | LIKE `%keyword%`, 대소문자 무시 (SQLite: LIKE는 기본 대소문자 무시) |
| 검색 요청 | GET /api/v1/plans?search=keyword |
| 검색 결과 표시 | 별도 결과 영역 또는 오늘 할 일 영역 필터링 |
| 검색 결과 범위 | 확정 필요 (섹션 40 D-11 참조) |

### 30-2. 필터 동작

| 필터 항목 | 동작 | 복수 선택 |
|---|---|---|
| 카테고리 | 선택한 카테고리의 일정만 표시 | O (OR) |
| 중요도 | 선택한 중요도의 일정만 표시 | O (OR) |
| 완료 여부 | 완료/미완료/전체 중 단일 선택 | X |

### 30-3. 복합 조건

- 검색 + 필터 동시 적용 가능
- 카테고리 필터 복수 선택: 선택된 카테고리 중 하나라도 해당하면 표시 (OR)
- 검색 + 카테고리 필터: AND 조건 적용
- 예시: 검색어 "과제" + 카테고리 "시험" → 제목이나 메모에 "과제"가 포함되고 카테고리가 "시험"인 일정만 표시

### 30-4. 필터 초기화

- "전체 보기" 또는 "필터 초기화" 버튼으로 모든 필터 해제

---

## 31. 카테고리/중요도 표시 규칙

`[사용자 결정 K-03]` + `[명세서]` + `[AI 보완]`

### 31-1. 카테고리 표시 `[사용자 결정 K-03]`

| 적용 위치 | 표시 방식 |
|---|---|
| 오늘 할 일 카드 | 카테고리명 칩 + 왼쪽 색상 점 |
| 주간 바 확장 목록 카드 | 카테고리명 칩 + 색상 점 |
| 일정 상세 모달 | 카테고리명 칩 + 색상 배경 |
| 월간 캘린더 날짜 셀 | 카테고리 색상 점 (최대 3개) |
| 필터 메뉴 | 카테고리명 + 색상 점 |
| 카테고리 없음 (NULL) | "미분류" 회색 칩 |

### 31-2. 중요도 표시 `[명세서]` + `[AI 보완]`

| 중요도 | 칩 배경 색상 | 텍스트 색상 |
|---|---|---|
| 높음 (high) | 빨강 계열 `#FEE2E2` | 빨강 `#DC2626` |
| 보통 (normal) | 노랑 계열 `#FEF9C3` | 노랑 `#B45309` |
| 낮음 (low) | 초록 계열 `#DCFCE7` | 초록 `#16A34A` |

---

## 32. 마감 임박 표시 규칙

`[명세서]`

### 32-1. D-Day 계산 기준

- 기준 필드: `due_date` (마감일)
- 계산 위치: 클라이언트 사이드 (`date-fns` `differenceInCalendarDays`)
- "오늘" 기준: KST 기준 당일 날짜

### 32-2. 표시 규칙

| 조건 | 표시 텍스트 | 배지 색상 |
|---|---|---|
| diff == 0 (오늘 마감) | D-Day | 빨강 |
| diff == 1 (1일 전) | D-1 | 주황 |
| diff == 3 (3일 전) | D-3 | 노랑 |
| diff < 0 (마감 지남) | 마감 지남 | 회색 |
| diff == 2 또는 diff >= 4 | `YYYY.MM.DD` 날짜만 표시 | 없음 |

### 32-3. 표시 위치

- 오늘 할 일 카드
- 주간 바 확장 목록 카드
- 일정 상세 모달

---

## 33. 데이터 저장 규칙

`[AI 보완]` + `[명세서]`

### 33-1. ORM 및 DB

- Prisma + SQLite
- DB 파일 위치: `prisma/planmate.db` (환경변수로 경로 설정 가능)

### 33-2. 타임존 저장 정책 `[AI 보완]`

- 모든 날짜·시간은 KST 텍스트로 저장 (`YYYY-MM-DD`, `HH:mm`)
- UTC 변환 없이 입력값 그대로 저장 (단순화)
- 주의: 향후 글로벌 확장 시 UTC 저장으로 마이그레이션 필요

### 33-3. Soft Delete `[AI 보완]`

- 일정 삭제 시 `deleted_at = NOW()` 처리
- 모든 조회 쿼리에 `WHERE deleted_at IS NULL` 조건 포함 (Prisma 미들웨어 또는 확장으로 자동화)
- 물리적 삭제(hard delete)는 별도 관리자 도구에서만 수행

### 33-4. 기본 키 전략 `[AI 보완]`

- INTEGER PRIMARY KEY AUTOINCREMENT (SQLite 기본 전략)

### 33-5. 인덱스 목록

| 인덱스명 | 컬럼 | 목적 |
|---|---|---|
| `idx_plans_user_display` | `plans(user_id, display_date)` | 오늘 할 일·월간 조회 |
| `idx_plans_user_due` | `plans(user_id, due_date)` | 마감일 기준 캘린더 |
| `idx_categories_user` | `categories(user_id)` | 사용자 카테고리 목록 |
| `idx_plans_deleted` | `plans(deleted_at)` | soft delete 필터 |
| `idx_users_email` | `users(email)` | 로그인 조회 |

---

## 34. 입력 검증 규칙

`[AI 보완]` Zod 공유 스키마, `[명세서]` 필수·선택 구분

### 34-1. 검증 전략

- 클라이언트: React Hook Form + Zod resolver (blur 시 즉시 검증)
- 서버: express 미들웨어에서 Zod 스키마 재검증 (클라이언트 우회 차단)
- 공유 스키마: `shared/schemas/` 에 정의, 프론트·백엔드 동일 사용

### 34-2. 일정 필드 검증 제약

| 필드 | 제약 | 오류 코드 |
|---|---|---|
| title | 필수, 1~100자 | VALIDATION_FAILED |
| due_date | 필수, YYYY-MM-DD 형식 | VALIDATION_FAILED |
| due_time | 선택, HH:mm 또는 null | VALIDATION_FAILED |
| display_date | 필수, YYYY-MM-DD 형식 | VALIDATION_FAILED |
| category_id | 필수, 정수, 사용자 소유 | CATEGORY_NOT_FOUND |
| priority | 필수, high/normal/low | VALIDATION_FAILED |
| memo | 선택, 0~500자 | VALIDATION_FAILED |
| is_remind | 선택, boolean (기본 false) | — |

### 34-3. 사용자 필드 검증 제약

| 필드 | 제약 |
|---|---|
| email | 필수, RFC 5322 단순화 패턴 (`^[^\s@]+@[^\s@]+\.[^\s@]+$`) |
| password | 필수, 영문+숫자 포함 8~72자 |
| nickname | 필수, 2~20자, 공백 불가 |
| 비밀번호 확인 | 비밀번호와 동일 |

### 34-4. 공통 규칙

- 과거 날짜 due_date: 허용 (완료 처리된 일정 수정 시 필요)
- XSS 방지: 서버에서 입력 문자열 이스케이프 처리
- SQL Injection: Prisma 사용으로 파라미터화 쿼리 자동 적용

---

## 35. 오류 처리 규칙

`[AI 보완]`

### 35-1. 에러 코드 목록

| 에러 코드 | HTTP 상태 | 의미 |
|---|---|---|
| `AUTH_UNAUTHORIZED` | 401 | 인증 토큰 없음 또는 만료 |
| `AUTH_FORBIDDEN` | 403 | 타인 리소스 접근 시도 |
| `AUTH_INVALID_CREDENTIALS` | 401 | 이메일/비밀번호 불일치 |
| `AUTH_REFRESH_EXPIRED` | 401 | Refresh Token 만료 |
| `EMAIL_ALREADY_EXISTS` | 409 | 중복 이메일 회원가입 |
| `PLAN_NOT_FOUND` | 404 | 존재하지 않는 일정 |
| `CATEGORY_NOT_FOUND` | 404 | 존재하지 않는 카테고리 |
| `VALIDATION_FAILED` | 422 | 입력 유효성 검증 실패 |
| `FILE_TOO_LARGE` | 400 | 업로드 파일 크기 초과 |
| `INVALID_FILE_TYPE` | 400 | 허용되지 않는 파일 형식 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

### 35-2. 에러 응답 포맷

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "입력값이 올바르지 않습니다.",
    "details": [
      { "field": "title", "message": "제목을 입력해주세요." }
    ]
  }
}
```

### 35-3. 클라이언트 오류 처리

| 오류 유형 | 처리 방식 |
|---|---|
| 폼 검증 실패 | 해당 필드 하단 인라인 오류 메시지 |
| 401 (토큰 만료) | Refresh Token 자동 갱신 시도 → 실패 시 `/login` 리디렉션 |
| 403 (권한 없음) | 오류 토스트 표시 |
| 404 (리소스 없음) | 오류 토스트 + 이전 화면으로 복귀 |
| 409 (중복) | 해당 필드 인라인 오류 메시지 |
| 422 (유효성) | 필드별 인라인 오류 메시지 |
| 500 (서버 오류) | "일시적인 오류가 발생했습니다." 토스트 |
| 네트워크 오류 | "네트워크 연결을 확인해주세요." 토스트 |

### 35-4. 토스트 알림 동작

- 위치: 화면 상단 중앙 또는 우측
- 자동 사라짐: 3초 후
- 수동 닫기: X 버튼

---

## 36. 빈 상태 처리 규칙

`[AI 보완]`

| 상황 | 메시지 | 보조 텍스트 |
|---|---|---|
| 오늘 할 일 없음 | "오늘 처리할 일정이 없습니다." | "오른쪽 하단 + 버튼으로 일정을 추가해보세요." |
| 주간 일정 바 — 해당 요일 일정 없음 | "이 날 등록된 일정이 없습니다." | — |
| 검색 결과 없음 | "검색 결과가 없습니다." | "다른 키워드로 검색해보세요." |
| 카테고리 없음 | "등록된 카테고리가 없습니다." | "+ 카테고리 추가 버튼으로 추가해보세요." |
| 월간 캘린더 — 해당 월 일정 없음 | (캘린더 격자만 표시, 별도 메시지 없음) | — |

---

## 37. 제외 범위

`[명세서]` + `[사용자 결정 K-07]`

| 제외 항목 | 이유 |
|---|---|
| 알림 발송 기능 | 구현 범위 초과, 초기 버전 제외 `[명세서]` |
| is_remind UI 체크박스 | 유지 (UI 표시 O, 실제 알림 미발송) `[사용자 결정 K-07]` |
| AI 추천 기능 | 초기 버전 제외 `[명세서]` |
| 과제 진행률 | 완료 방식과 중복, 초기 버전 제외 `[명세서]` |
| 반복 일정 | 향후 확장 기능 |
| 팀플 공유 기능 | 향후 확장 기능 |
| 학기별 일정 관리 | 향후 확장 기능 |
| 소셜 로그인 | 초기 버전 미지원 |
| 이메일 인증 | 확정 필요 (섹션 40 참조) |
| 비밀번호 찾기/재설정 | 확정 필요 (섹션 40 참조) |
| 다크 모드 | MVP 이후 추가 가능 |
| 반응형 모바일 | 확정 필요 (섹션 40 참조) |
| 관리자 페이지 | 초기 버전 미정의 |

---

## 38. 완료 기준

`[AI 보완]`

### 38-1. 인증 기능 (F-01~F-03)

- [ ] 회원가입 폼 검증 (이메일 형식, 비밀번호 정책, 닉네임 길이)
- [ ] 이메일 중복 시 오류 메시지 표시
- [ ] 회원가입 성공 시 5개 기본 카테고리 자동 생성 확인
- [ ] 로그인 성공 시 Access Token + Refresh Token 정상 발급
- [ ] 로그인 실패 시 적절한 오류 메시지 표시
- [ ] 로그아웃 시 토큰 제거, 메인 접근 불가

### 38-2. 일정 CRUD (F-04~F-08)

- [ ] 일정 등록 폼 7개 필드 모두 정상 동작
- [ ] 저장/취소 확인 모달 정상 동작
- [ ] 등록 후 캘린더·오늘 할 일·주간 바 즉시 반영
- [ ] 일정 상세 모달 (URL ?planId=) 정상 표시
- [ ] 수정 후 변경 내용 즉시 반영
- [ ] 삭제 후 목록에서 즉시 사라짐
- [ ] 완료 처리 시 중간줄+회색+목록 최하위 이동

### 38-3. 메인 페이지 (F-09~F-11)

- [ ] 월간 캘린더 6주 격자 정상 표시
- [ ] 카테고리 색상 점 정상 표시
- [ ] 이전/다음 달 이동 정상 동작
- [ ] 오늘 할 일 정렬 (중요도→마감시간) 정상 동작
- [ ] 주간 바 요일별 개수 정상 표시
- [ ] 요일 클릭 시 확장/접힘 정상 동작

### 38-4. 검색/필터 (F-12~F-13)

- [ ] 키워드 검색 결과 정상 표시 (제목+메모 부분 일치)
- [ ] 카테고리·중요도·완료 여부 필터 정상 동작
- [ ] 복합 필터 AND 조건 정상 적용

### 38-5. 카테고리 관리 (F-14~F-17)

- [ ] 카테고리 추가·수정·삭제 정상 동작
- [ ] 카테고리 삭제 시 연결 일정 "미분류" 처리 확인

### 38-6. 프로필 (F-18~F-20)

- [ ] 닉네임 수정 정상 동작
- [ ] 비밀번호 변경 (현재 비밀번호 검증 포함) 정상 동작
- [ ] 아바타 이미지 업로드 및 표시 정상 동작

---

## 39. 개발 단계 제안

`[AI 보완]`

| 단계 | 주요 작업 | 예상 기간 |
|---|---|---|
| Phase 0 — 인프라 설정 | 프로젝트 구조 설정, Prisma 스키마 확정, DB 마이그레이션, Tailwind config, 공유 Zod 스키마 | 1주 |
| Phase 1 — 인증 | users 테이블, 회원가입/로그인/로그아웃 API, JWT 미들웨어, 카테고리 시드 자동 생성, 로그인·회원가입 페이지 | 1~2주 |
| Phase 2 — 일정 CRUD | plans 테이블, 일정 API 전체 (생성·조회·수정·삭제·완료 토글), 일정 등록 폼 페이지, 일정 상세 모달 | 2주 |
| Phase 3 — 메인 UI | 월간 캘린더 컴포넌트, 오늘 할 일 섹션, 주간 일정 바 (캘린더→주간바→오늘 할일 순서), FAB, D-Day 계산 | 2~3주 |
| Phase 4 — 프로필·카테고리 | 프로필 페이지, 닉네임·비밀번호·아바타 수정, 카테고리 CRUD 팝업 | 1~2주 |
| Phase 5 — 검색·필터 | 검색바 연동, 카테고리·중요도·완료 여부 필터, 복합 조건 API 쿼리 | 1주 |
| Phase 6 — QA | 전체 기능 테스트, 접근성 검증, 빈 상태 UI, 오류 처리 검증, 반응형 점검 (범위 결정 후) | 1주 |

---

## 40. 아직 확정되지 않은 사항

`[사용자 결정 필요]` — 개발 착수 전 추가 결정이 필요한 항목

| 번호 | 항목 | 현재 가정/기본값 | 결정 필요 이유 |
|---|---|---|---|
| U-01 | **완료 처리 취소 가능 여부** | 취소 가능 (체크박스 토글)으로 가정하여 구현 | 명세서 미명시. 취소 불가 정책 시 별도 UI 필요 |
| U-02 | **검색 결과 범위** | 전체 기간으로 가정 | 현재 월만 검색 vs 전체 기간 — UX·성능 차이 |
| U-03 | **반응형 지원 범위** | PC(데스크탑) 우선으로 개발 | 모바일·태블릿 지원 여부에 따라 CSS 작업량 달라짐 |
| U-04 | **회원가입 이메일 인증** | 즉시 가입 (이메일 인증 없음)으로 가정 | 이메일 발송 서비스 연동 필요 여부 |
| U-05 | **비밀번호 찾기/재설정 흐름** | 미구현 (로그인 페이지 링크만 표시) | 이메일 발송 없이는 구현 불가 |
| U-06 | **아바타 이미지 제약** | 파일 크기 5MB 이하, JPEG·PNG·GIF 허용으로 가정 | 정확한 제약 미결정 |
| U-07 | **비밀번호 정책 세부 사항** | 영문+숫자 8자 이상 (특수문자 미필수)으로 가정 | 특수문자 필수 여부 |
| U-08 | **데이터 백업/복구 정책** | 미구현 (SQLite 파일 수동 백업) | 운영 환경에서 자동 백업 필요 여부 |
| U-09 | **다국어 지원** | 한국어 단일 지원 | i18n 도입 여부 |
| U-10 | **이미 선택된 주간 바 요일 재클릭 동작** | 재클릭 시 접힘(COLLAPSED)으로 가정 | 명세서 미명시 |
| U-11 | **캘린더 날짜 클릭 동작** | 해당 날짜의 일정 목록 소형 팝업 표시 후 개별 클릭으로 상세 모달 진입으로 가정 | 클릭 시 바로 day view 이동 vs 팝업 미결정 |
| U-12 | **중요도 라벨 — "보통" vs "중간"** | "보통" (명세서 기준)으로 확정 가정 | 디자인 04에서 "중간" 표기 — 추가 확인 필요 |

---

## 41. AI 제안으로 보완된 사항

아래 항목은 기능명세서·사용자 답변에 없지만 PRD에 반영된 AI 제안 내용입니다. 모든 `[AI 보완]` 라벨 항목을 일괄 정리합니다.

| # | 섹션 | 항목 | AI 제안 내용 | 반영 근거 |
|---|---|---|---|---|
| AI-01 | 6 | 빌드 도구 Vite | Vite로 React 프로젝트 빌드, CRA deprecated | 표준 대안, 사용자 반대 없음 |
| AI-02 | 6 | TanStack Query v5 + Zustand | 서버 상태와 클라이언트 상태 분리 관리 | 현대 React 표준 패턴 |
| AI-03 | 6 | React Router v6 | SPA 클라이언트 라우팅 | 표준 라우팅 라이브러리 |
| AI-04 | 6 | React Hook Form + Zod | 폼 관리 및 공유 스키마 검증 | 타입 안전 폼 처리 표준 |
| AI-05 | 6 | date-fns v3 | 날짜 계산 유틸리티 | 트리쉐이킹 친화적 |
| AI-06 | 6 | Vitest + RTL + Playwright | 테스트 도구 | Vite 환경 최적 테스트 스택 |
| AI-07 | 7 | Express.js 프레임워크 | Node.js 웹 프레임워크 | 가장 넓은 생태계, 낮은 학습 비용 |
| AI-08 | 7 | Prisma ORM | SQLite 타입 안전 쿼리 + 마이그레이션 | TypeScript 프로젝트 생산성 |
| AI-09 | 7 | 4계층 아키텍처 | routes → controllers → services → repositories | 테스트·유지보수 분리 |
| AI-10 | 7 | `/api/v1` base path | 버전 prefix | 하위 호환성 유지 |
| AI-11 | 7 | Rate limit (5req/min/IP) | 인증 엔드포인트 보호 | 브루트포스 방지 |
| AI-12 | 8 | Soft delete (`deleted_at`) | plans 테이블 삭제 방식 | 실수 복구 가능성 |
| AI-13 | 8 | 복합 인덱스 설계 | `plans(user_id, display_date)` 등 | 쿼리 성능 최적화 |
| AI-14 | 14 | 중요도 칩 색상 | 높음=빨강, 보통=노랑, 낮음=초록 배경 | 직관적 시각 구분 |
| AI-15 | 19 | JWT Access(1h) + Refresh(7d httpOnly) | 토큰 전략 | 보안+UX 균형 |
| AI-16 | 19 | bcrypt cost 12 | 비밀번호 해싱 강도 | 보안·성능 균형점 |
| AI-17 | 19 | Rate limit 인증 엔드포인트 | 5req/min/IP | 계정 탈취 방지 |
| AI-18 | 21 | KST 텍스트 저장 | DB에 KST 텍스트로 저장 (UTC 변환 없음) | SQLite 단순화 |
| AI-19 | 24 | 주간 바 기준: display_date | 어느 날짜 기준으로 주간 집계할지 | display_date가 "처리할 날짜" 개념에 부합 |
| AI-20 | 28 | 모달 인라인 편집 방식 | 수정 시 별도 페이지 없이 모달 내 인라인 전환 | 명세서 별도 수정 페이지 미명시 |
| AI-21 | 33 | 페이지네이션 기본 limit=50 | GET /plans 기본 limit | 개인 일정 수준에서 충분 |
| AI-22 | 34 | Zod 공유 스키마 | 프론트·백엔드 동일 Zod 스키마 재사용 | 검증 불일치 방지 |
| AI-23 | 35 | 전역 에러 응답 포맷 | `{ success, error: { code, message, details? } }` | 클라이언트 분기 처리 일관성 |
| AI-24 | 36 | 빈 상태 메시지 | 각 빈 상태별 적절한 안내 문구 | 일반 UX 패턴 |
| AI-25 | 39 | Phase 0~6 개발 단계 | 6단계 단계별 개발 로드맵 | 의존성 기반 순서 |

---

PRD가 확정되면 docs/04-design 단계(API 상세·ERD·화면 와이어프레임)로 진행할 수 있습니다.
