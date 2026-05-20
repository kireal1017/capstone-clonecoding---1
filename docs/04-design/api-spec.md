# PlanMate API 명세서

> 작성일: 2026-05-20
> 버전: 1.0
> 기반 문서: PRD v1.0 (§20, §19, §35)

---

## 0. 개요

| 항목 | 내용 |
|---|---|
| Base URL (개발) | `http://localhost:4000/api/v1` |
| Base URL (운영) | `https://api.planmate.local/api/v1` |
| 콘텐츠 타입 | `application/json` (아바타 업로드만 `multipart/form-data`) |
| 인증 방식 | JWT Bearer Token (`Authorization: Bearer <accessToken>` 헤더) |
| Refresh Token 전달 | httpOnly Secure 쿠키 (`refresh_token`) |
| 타임존 | KST(UTC+9) 고정. 요청·응답 모두 KST 기준 ISO 8601 |
| 날짜 포맷 | `YYYY-MM-DD` |
| 시간 포맷 | `HH:mm` |

[PRD 확정] Base path `/api/v1`, JWT 인증 방식, KST 고정 — PRD §20, §19, §21

---

## 1. 공통 응답 포맷

### 1-1. 성공 응답

```
HTTP 200 / 201
Content-Type: application/json

{
  "success": true,
  "data": { ... }
}
```

### 1-2. 에러 응답

```
HTTP 4xx / 5xx
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 설명",
    "details": [
      { "field": "fieldName", "message": "필드별 오류 메시지" }
    ]
  }
}
```

`details` 배열은 `VALIDATION_FAILED`(422) 응답에서만 포함됨. 그 외 에러는 생략 가능. [PRD 확정]

---

## 2. 공통 에러 코드 표

[PRD 확정] PRD §35-1

| 에러 코드 | HTTP 상태 | 발생 상황 |
|---|---|---|
| `AUTH_UNAUTHORIZED` | 401 | 인증 토큰 없음 또는 만료 |
| `AUTH_FORBIDDEN` | 403 | 타인 리소스 접근 시도 |
| `AUTH_INVALID_CREDENTIALS` | 401 | 이메일/비밀번호 불일치 |
| `AUTH_REFRESH_EXPIRED` | 401 | Refresh Token 만료 또는 무효 |
| `AUTH_INVALID_TOKEN` | 401 | 토큰 형식 오류 또는 서명 불일치 |
| `EMAIL_ALREADY_EXISTS` | 409 | 중복 이메일 회원가입 시도 |
| `CATEGORY_NAME_ALREADY_EXISTS` | 409 | 동일 사용자 내 중복 카테고리명 생성/수정 시도 (DB-03) |
| `PLAN_NOT_FOUND` | 404 | 존재하지 않거나 삭제된 일정 |
| `CATEGORY_NOT_FOUND` | 404 | 존재하지 않거나 타인 소유 카테고리 |
| `VALIDATION_FAILED` | 422 | 입력 유효성 검증 실패 (`details` 포함) |
| `FILE_TOO_LARGE` | 400 | 업로드 파일 크기 초과 (5MB) |
| `INVALID_FILE_TYPE` | 400 | 허용되지 않는 파일 형식 (jpg/png/webp만 허용) |
| `TOO_MANY_REQUESTS` | 429 | Rate Limit 초과 (인증 엔드포인트 5req/min/IP) |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

[AI 제안안] `AUTH_INVALID_TOKEN` 코드 추가 — 토큰 형식 오류와 만료를 구분하기 위해 도입.
[AI 제안안] `FILE_TOO_LARGE` 기준 5MB — PRD에 크기 미명시, 구현 시 확인 필요.

---

## 3. 인증 API

### 3-1. POST /api/v1/auth/register — 회원가입

[PRD 확정] PRD §12-1, §20-1 A-01

- **인증 필요:** 없음
- **Rate Limit:** 5req/min/IP

**요청 본문 (JSON)**

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `email` | string | ✓ | RFC 5322 단순화 패턴 (`^[^\s@]+@[^\s@]+\.[^\s@]+$`), max 254자 |
| `password` | string | ✓ | 영문+숫자 포함 8~72자 |
| `nickname` | string | ✓ | 2~20자, 공백 불가 |

**응답 (201 Created)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "홍길동",
      "createdAt": "2026-05-20T10:00:00"
    }
  }
}
```

- **[BE-06] 회원가입 성공 시 토큰 미발급 확정 (PRD §10-1 기준):** Access Token 및 Refresh Token 미발급. 사용자는 `/login` 리디렉션 후 별도 로그인 단계 수행.
- Refresh Token 쿠키는 로그인(`/auth/login`) 성공 시에만 발급됨.
- `[확인 필요]` 주석 제거 완료.

**백엔드 처리 흐름**
1. Zod 스키마 검증
2. 이메일 중복 확인 → 중복 시 409
3. bcrypt(cost 12) 비밀번호 해싱
4. `users` 테이블 INSERT
5. 동일 트랜잭션에서 기본 카테고리 5개 INSERT (미팅/과제/시험/개인일정/약속)

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `EMAIL_ALREADY_EXISTS` | 409 | 이미 사용 중인 이메일 |
| `VALIDATION_FAILED` | 422 | 형식 검증 실패 (`details` 배열 포함) |
| `TOO_MANY_REQUESTS` | 429 | Rate Limit 초과 |

---

### 3-2. POST /api/v1/auth/login — 로그인

[PRD 확정] PRD §12-2, §20-1 A-02

- **인증 필요:** 없음
- **Rate Limit:** 5req/min/IP

**요청 본문 (JSON)**

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `email` | string | ✓ | 이메일 형식 |
| `password` | string | ✓ | 비어있지 않음 |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "홍길동",
      "avatarUrl": "/uploads/avatars/1_1716192000.png"
    }
  }
}
```

- Refresh Token: `Set-Cookie` 헤더로 별도 전달
- Access Token 유효기간: 1시간 (`exp` 클레임 포함)

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | 이메일 미존재 또는 비밀번호 불일치 |
| `VALIDATION_FAILED` | 422 | 필드 누락 |
| `TOO_MANY_REQUESTS` | 429 | Rate Limit 초과 |

---

### 3-3. POST /api/v1/auth/refresh — Access Token 갱신

[PRD 확정] PRD §19-2, §20-1 A-03

- **인증 필요:** 없음 (Refresh Token 쿠키 자동 전송)
- **쿠키:** `refresh_token` (httpOnly, 자동 포함)

**요청 본문:** 없음

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**[BE-02] Token Rotation 채택 확정:**
- `/auth/refresh` 호출 시:
  1. 기존 Refresh Token 검증 (서명 + DB `refresh_token_hash` 비교)
  2. 새 Access Token + 새 Refresh Token 발급
  3. DB의 `refresh_token_hash`를 새 토큰 hash로 교체
  4. 새 Refresh Token을 `Set-Cookie`로 갱신
- 재사용 감지(이전 Refresh Token으로 재요청) 시: `refresh_token_hash = NULL` → 전체 세션 폐기 → 401

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `AUTH_REFRESH_EXPIRED` | 401 | Refresh Token 만료 또는 쿠키 없음 |
| `AUTH_INVALID_TOKEN` | 401 | Refresh Token 서명 불일치 또는 재사용 감지(세션 폐기) |

---

### 3-4. POST /api/v1/auth/logout — 로그아웃

[PRD 확정] PRD §10-7, §20-1 A-04

- **인증 필요:** Access Token (Bearer)

**요청 본문:** 없음

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "message": "로그아웃 완료"
  }
}
```

- 서버 측: `Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=0` 로 쿠키 삭제 **(BE-12: Path=/api/v1/auth 로 통일, 로그인 시 발급 Path와 동일해야 쿠키 삭제 가능)**
- 서버 측: `users.refresh_token_hash = NULL` 설정 (BE-01: 서버 측 무효화)
- 클라이언트 측: Access Token 메모리/localStorage에서 제거

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `AUTH_UNAUTHORIZED` | 401 | Access Token 없음 또는 만료 |

---

### 3-5. GET /api/v1/auth/me — 현재 사용자 정보 조회

[PRD 확정] PRD §20-1 A-05

- **인증 필요:** Access Token (Bearer)

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "홍길동",
      "avatarUrl": "/uploads/avatars/1_1716192000.png",
      "createdAt": "2026-05-20T10:00:00"
    }
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `AUTH_UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |

---

## 4. 일정 API

### 4-1. GET /api/v1/plans — 일정 목록 조회

[PRD 확정] PRD §20-2 P-01, §30

- **인증 필요:** Access Token (Bearer)

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `month` | `YYYY-MM` | 선택 | 해당 월 display_date 범위 필터 (생략 시 전체) |
| `search` | string | 선택 | title + memo LIKE `%keyword%` (전체 미삭제 레코드 대상, 월 한정 없음) |
| `category` | integer (반복 가능) | 선택 | 카테고리 ID 필터 (OR 조건, 예: `?category=1&category=2`) |
| `priority` | `high`\|`normal`\|`low` (반복 가능) | 선택 | 중요도 필터 (OR 조건, 예: `?priority=high&priority=normal`) |
| `completed` | `0`\|`1` | 선택 | 완료 여부 필터 (단일 선택) |
| `uncategorized` | `1` | 선택 | 미분류 일정 필터 (`category_id IS NULL`). `category` 파라미터와 함께 사용 시 OR 조건 (DB-07) |

**[BE-03] 서버 고정 정렬 규칙 (클라이언트 sort 파라미터 없음):**
- 응답 데이터는 항상 아래 ORDER BY 적용 후 반환:
  1. `is_completed ASC` (미완료 우선)
  2. priority CASE `high=0, normal=1, low=2` ASC
  3. `due_time ASC NULLS LAST`
  4. `created_at ASC` (4순위: 등록 순서, PRD §22-2)

**[DB-07] 필터 조합 규칙:**
- 카테고리 복수 선택: OR 조건
- 중요도 복수 선택: OR 조건
- 완료 여부: 단일 선택
- 세 그룹 간(카테고리 OR 그룹, 중요도 OR 그룹, 완료 여부): AND 조건
- 미분류(`uncategorized=1`)와 카테고리 ID 동시 지정 시: `category_id IS NULL OR category_id IN [ids]` OR 조건

- 항상 `deleted_at IS NULL` 조건 포함
- 항상 요청자의 `user_id` 조건 포함 (타인 일정 조회 불가)

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": 1,
        "userId": 1,
        "title": "영상처리 과제 제출",
        "dueDate": "2026-05-25",
        "dueTime": "23:59",
        "displayDate": "2026-05-20",
        "categoryId": 2,
        "category": { "id": 2, "name": "과제", "color": "#2563EB" },
        "priority": "high",
        "memo": "5장 분량",
        "isCompleted": false,
        "isRemind": true,
        "createdAt": "2026-05-18T09:00:00",
        "updatedAt": "2026-05-18T09:00:00"
      }
    ],
    "total": 1
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `AUTH_UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |

---

### 4-2. POST /api/v1/plans — 일정 등록

[PRD 확정] PRD §12-3, §20-2 P-02

- **인증 필요:** Access Token (Bearer)

**요청 본문 (JSON)**

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `title` | string | ✓ | 1~100자 |
| `due_date` | string | ✓ | `YYYY-MM-DD` 형식 |
| `due_time` | string\|null | 선택 | `HH:mm` 형식 또는 null |
| `display_date` | string | ✓ | `YYYY-MM-DD` 형식 |
| `category_id` | integer\|null | 선택 | 요청자 소유 카테고리 ID 또는 null (미분류 허용, K-09=B) |
| `priority` | string | ✓ | `high` / `normal` / `low` |
| `memo` | string\|null | 선택 | 0~500자 |
| `is_remind` | boolean | 선택 | 기본값 `false` |

**응답 (201 Created)**

```json
{
  "success": true,
  "data": {
    "plan": {
      "id": 5,
      "userId": 1,
      "title": "영상처리 과제 제출",
      "dueDate": "2026-05-25",
      "dueTime": "23:59",
      "displayDate": "2026-05-20",
      "categoryId": 2,
      "category": { "id": 2, "name": "과제", "color": "#2563EB" },
      "priority": "high",
      "memo": "5장 분량",
      "isCompleted": false,
      "isRemind": true,
      "createdAt": "2026-05-20T10:00:00",
      "updatedAt": "2026-05-20T10:00:00"
    }
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `VALIDATION_FAILED` | 422 | 형식 검증 실패 |
| `CATEGORY_NOT_FOUND` | 404 | 타인 카테고리 또는 존재하지 않는 카테고리 |
| `AUTH_UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |

---

### 4-3. GET /api/v1/plans/:id — 일정 단건 조회

[PRD 확정] PRD §20-2 P-03

- **인증 필요:** Access Token (Bearer)
- **경로 파라미터:** `id` (integer, 일정 ID)

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "plan": {
      "id": 5,
      "userId": 1,
      "title": "영상처리 과제 제출",
      "dueDate": "2026-05-25",
      "dueTime": "23:59",
      "displayDate": "2026-05-20",
      "categoryId": 2,
      "category": { "id": 2, "name": "과제", "color": "#2563EB" },
      "priority": "high",
      "memo": "5장 분량",
      "isCompleted": false,
      "isRemind": true,
      "createdAt": "2026-05-20T10:00:00",
      "updatedAt": "2026-05-20T10:00:00"
    }
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `PLAN_NOT_FOUND` | 404 | 존재하지 않거나 삭제된 일정 (타인 소유 포함 — 정보 비노출 정책) |
| `AUTH_UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |

---

### 4-4. PATCH /api/v1/plans/:id — 일정 수정

[PRD 확정] PRD §20-2 P-04, §28

- **인증 필요:** Access Token (Bearer)
- **경로 파라미터:** `id` (integer)

**요청 본문 (JSON) — 변경할 필드만 포함 (Partial Update)**

| 필드 | 타입 | 제약 |
|---|---|---|
| `title` | string | 1~100자 |
| `due_date` | string | `YYYY-MM-DD` |
| `due_time` | string\|null | `HH:mm` 또는 null |
| `display_date` | string | `YYYY-MM-DD` |
| `category_id` | integer\|null | 요청자 소유 카테고리 ID 또는 null |
| `priority` | string | `high`\|`normal`\|`low` |
| `memo` | string\|null | 0~500자 |
| `is_remind` | boolean | — |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "plan": { /* 수정된 일정 전체 필드 */ }
  }
}
```

- 수정 여부와 무관하게 `updated_at` 갱신됨 [PRD 확정]

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `PLAN_NOT_FOUND` | 404 | 존재하지 않거나 삭제된 일정 (타인 소유 포함 — 정보 비노출 정책) |
| `VALIDATION_FAILED` | 422 | 형식 검증 실패 |
| `CATEGORY_NOT_FOUND` | 404 | 유효하지 않은 category_id |

---

### 4-5. DELETE /api/v1/plans/:id — 일정 삭제 (Soft Delete)

[PRD 확정] PRD §20-2 P-05, §29

- **인증 필요:** Access Token (Bearer)
- **경로 파라미터:** `id` (integer)

**요청 본문:** 없음

**응답 (204 No Content)**

본문 없음.

- 서버 처리: `deleted_at = NOW(KST)` UPDATE (물리 삭제 아님) [PRD 확정]
- validation.md §8-3 기준: 204 No Content 확정 (api-spec 이전 표기 200+message에서 정정)

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `PLAN_NOT_FOUND` | 404 | 존재하지 않거나 이미 삭제된 일정 (타인 소유 포함 — 정보 비노출 정책) |
| `AUTH_UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |

---

### 4-6. PATCH /api/v1/plans/:id/complete — 완료 상태 토글

[PRD 확정] PRD §20-2 P-06, §25

- **인증 필요:** Access Token (Bearer)
- **경로 파라미터:** `id` (integer)

**요청 본문:** 없음 (토글 — 현재 값의 반대로 전환)

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "plan": {
      "id": 5,
      "isCompleted": true,
      "updatedAt": "2026-05-20T11:30:00"
    }
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `PLAN_NOT_FOUND` | 404 | 존재하지 않거나 삭제된 일정 (타인 소유 포함 — 정보 비노출 정책) |
| `AUTH_UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |

---

## 5. 카테고리 API

### 5-1. GET /api/v1/categories — 카테고리 목록 조회

[PRD 확정] PRD §20-3 C-01, §12-8

- **인증 필요:** Access Token (Bearer)

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "userId": 1,
        "name": "미팅",
        "color": "#7C3AED",
        "sortOrder": 1,
        "createdAt": "2026-05-20T10:00:00",
        "updatedAt": "2026-05-20T10:00:00"
      }
    ]
  }
}
```

- `sort_order` 오름차순 정렬
- 요청자 소유 카테고리만 반환

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `AUTH_UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |

---

### 5-2. POST /api/v1/categories — 카테고리 추가

[PRD 확정] PRD §20-3 C-02, §12-8

- **인증 필요:** Access Token (Bearer)

**요청 본문 (JSON)**

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `name` | string | ✓ | 1~30자 |
| `color` | string | ✓ | HEX 형식 (`#RRGGBB`) |
| `sort_order` | integer | 선택 | 정렬 순서 (생략 시 현재 최대값+1) |

**응답 (201 Created)**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": 6,
      "userId": 1,
      "name": "독서",
      "color": "#8B5CF6",
      "sortOrder": 6,
      "createdAt": "2026-05-20T12:00:00",
      "updatedAt": "2026-05-20T12:00:00"
    }
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `VALIDATION_FAILED` | 422 | 형식 검증 실패 |
| `CATEGORY_NAME_ALREADY_EXISTS` | 409 | 동일 사용자 내 중복 카테고리명 (DB-03: `@@unique([userId, name])` 위반) |

---

### 5-3. PUT /api/v1/categories/:id — 카테고리 수정

[PRD 확정] PRD §20-3 C-03

- **인증 필요:** Access Token (Bearer)
- **경로 파라미터:** `id` (integer)

**[FE-01] PUT = 전체 교체. 요청 바디에 `name`, `color`, `sort_order` 모두 필수 포함.**
- 부분 업데이트(PATCH) 아님. 필드 생략 시 해당 필드 초기화될 수 있음.
- 일정 수정(`PATCH /plans/:id`)과 메서드가 다름에 주의.

**요청 본문 (JSON) — name·color·sort_order 모두 필수**

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `name` | string | ✓ | 1~30자 |
| `color` | string | ✓ | HEX 형식 (`#RRGGBB`) |
| `sort_order` | integer | ✓ | 양의 정수 |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "category": { /* 수정된 카테고리 전체 필드 */ }
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `CATEGORY_NOT_FOUND` | 404 | 존재하지 않는 카테고리 또는 타인 소유 카테고리 (존재 자체를 숨김 — 정보 비노출 정책) |
| `VALIDATION_FAILED` | 422 | 형식 검증 실패 |
| `CATEGORY_NAME_ALREADY_EXISTS` | 409 | 동일 사용자 내 중복 카테고리명 (DB-03) |

---

### 5-4. DELETE /api/v1/categories/:id — 카테고리 삭제

[PRD 확정] PRD §20-3 C-04, §12-8 (K-09=B)

- **인증 필요:** Access Token (Bearer)
- **경로 파라미터:** `id` (integer)

**요청 본문:** 없음

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "message": "삭제 완료",
    "affectedPlans": 3
  }
}
```

- 서버 처리 (트랜잭션):
  1. `categories` 레코드 삭제
  2. 해당 카테고리를 참조하는 모든 `plans.category_id = NULL` UPDATE
- `affectedPlans`: NULL 처리된 일정 수 [PRD 확정]

> **일정 vs 카테고리 DELETE 응답 비교:**
> - `DELETE /api/v1/plans/:id` → `204 No Content` (본문 없음, soft delete만 수행)
> - `DELETE /api/v1/categories/:id` → `200 OK` + JSON 본문 (연결 일정의 `categoryId`를 NULL로 일괄 처리한 건수 `affectedPlans` 반환이 필요하므로 본문 있음)

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `CATEGORY_NOT_FOUND` | 404 | 존재하지 않는 카테고리 또는 타인 소유 카테고리 (존재 자체를 숨김 — 정보 비노출 정책) |

---

## 6. 프로필 API

### 6-1. GET /api/v1/profile — 프로필 조회

[PRD 확정] PRD §20-4 PR-01, §12-9

- **인증 필요:** Access Token (Bearer)

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "홍길동",
      "avatarUrl": "/uploads/avatars/1_1716192000.png",
      "createdAt": "2026-05-20T10:00:00"
    }
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `AUTH_UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |

---

### 6-2. PATCH /api/v1/profile — 프로필 수정 (닉네임)

[PRD 확정] PRD §20-4 PR-02

- **인증 필요:** Access Token (Bearer)

**요청 본문 (JSON)**

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `nickname` | string | 선택 | 2~20자, 공백 불가 |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "새닉네임",
      "avatarUrl": "/uploads/avatars/1_1716192000.png",
      "createdAt": "2026-05-20T10:00:00"
    }
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `VALIDATION_FAILED` | 422 | 닉네임 형식 검증 실패 |

---

### 6-3. PATCH /api/v1/profile/password — 비밀번호 변경

[PRD 확정] PRD §20-4 PR-03, §12-9

- **인증 필요:** Access Token (Bearer)

**요청 본문 (JSON)**

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `currentPassword` | string | ✓ | 현재 비밀번호 |
| `newPassword` | string | ✓ | 영문+숫자 포함 8~72자 |
| `newPasswordConfirm` | string | ✓ | `newPassword`와 동일 |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "message": "비밀번호 변경 완료"
  }
}
```

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | 현재 비밀번호 불일치 |
| `VALIDATION_FAILED` | 422 | 새 비밀번호 형식 불일치 또는 확인 불일치 |

---

### 6-4. POST /api/v1/profile/avatar — 아바타 이미지 업로드

[PRD 확정] PRD §20-4 PR-04, §12-9

- **인증 필요:** Access Token (Bearer)
- **콘텐츠 타입:** `multipart/form-data`

**요청 본문 (multipart)**

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `avatar` | File | ✓ | jpg/png/webp, 최대 5MB [AI 제안안] |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "avatarUrl": "/uploads/avatars/1_1716192000.png"
  }
}
```

- 서버 처리: `multer`로 `/uploads/avatars/{userId}_{timestamp}.{ext}` 저장 후 `users.avatar_url` UPDATE [PRD 확정]

**에러 응답**

| 코드 | HTTP | 조건 |
|---|---|---|
| `FILE_TOO_LARGE` | 400 | 파일 크기 5MB 초과 |
| `INVALID_FILE_TYPE` | 400 | jpg/png/webp 이외 파일 |
| `VALIDATION_FAILED` | 422 | 파일 누락 |

---

## 7. 엔드포인트 요약

| # | 메서드 | 경로 | 인증 | 기능 |
|---|---|---|---|---|
| A-01 | POST | `/api/v1/auth/register` | X | 회원가입 |
| A-02 | POST | `/api/v1/auth/login` | X | 로그인 |
| A-03 | POST | `/api/v1/auth/refresh` | X(쿠키) | 토큰 갱신 |
| A-04 | POST | `/api/v1/auth/logout` | O | 로그아웃 |
| A-05 | GET | `/api/v1/auth/me` | O | 내 정보 조회 |
| P-01 | GET | `/api/v1/plans` | O | 일정 목록 조회 |
| P-02 | POST | `/api/v1/plans` | O | 일정 등록 |
| P-03 | GET | `/api/v1/plans/:id` | O | 일정 단건 조회 |
| P-04 | PATCH | `/api/v1/plans/:id` | O | 일정 수정 |
| P-05 | DELETE | `/api/v1/plans/:id` | O | 일정 삭제(soft) |
| P-06 | PATCH | `/api/v1/plans/:id/complete` | O | 완료 토글 |
| C-01 | GET | `/api/v1/categories` | O | 카테고리 목록 |
| C-02 | POST | `/api/v1/categories` | O | 카테고리 추가 |
| C-03 | PUT | `/api/v1/categories/:id` | O | 카테고리 수정 |
| C-04 | DELETE | `/api/v1/categories/:id` | O | 카테고리 삭제 |
| PR-01 | GET | `/api/v1/profile` | O | 프로필 조회 |
| PR-02 | PATCH | `/api/v1/profile` | O | 닉네임 수정 |
| PR-03 | PATCH | `/api/v1/profile/password` | O | 비밀번호 변경 |
| PR-04 | POST | `/api/v1/profile/avatar` | O | 아바타 업로드 |

총 19개 엔드포인트
