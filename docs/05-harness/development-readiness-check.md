# PlanMate 개발 착수 가능성 최종 점검

> 점검일: 2026-05-20
> 점검자: AI 독립 평가자 (검토 단계 분리)
> 점검 범위: docs/03-prd/, docs/04-design/, docs/05-harness/
> 점검 방식: 12개 항목별 평가 → 종합 판정

---

## 최종 판정

**판정: 개발 착수 가능**

**근거 요약:**
- design-review.md §6 보완 반영 결과에 따르면 22개 "개발 전 필수 수정" 항목 전부(FE 9개, BE 7개, DB 8개) 패치 완료 상태로 기록되어 있다.
- PRD §5 P-01~P-05 중 P-03~P-05는 설계 문서에 확정값으로 반영 완료되었고, P-01(회원가입 후 /login 리다이렉트)과 P-02(PUT 전체 교체 정책)는 PRD §10-1 및 api-spec.md에 명시적으로 확정되어 있다.
- 19개 엔드포인트 명세, 3개 테이블 Prisma 스키마, Step 0~12 구현 순서, 10개 검증 기준이 구현 가능한 수준으로 완결되어 있다.
- 잔존 미확정 사항(PRD §40 U-01~U-12)은 모두 "개발 중 결정 가능" 또는 "향후 확장" 성격이며, 즉시 차단 항목은 0개이다.

**다음 단계 권고:**
- Step 0 (프로젝트 부트스트랩) 즉시 시작 가능 — harness.md §3 Step 0 파일 범위 엄수
- progress.md에 Step 0 in_progress 기록 후 착수
- P-01(자동 로그인 vs /login 리다이렉트) UX 최종 확인은 Step 8 완료 후 팀 브리핑으로 처리 가능
- PRD §40 U-06(아바타 파일 제약) 정책 1줄 추가는 Step 6 시작 전에 처리 권고

---

## 점검 결과 대시보드

| 항목 | 평가 | 비고 |
|---|---|---|
| 1. PRD 확정 | ✅ 충분 | 41개 섹션 완결, K-01~K-10 전체 반영 |
| 2. API 명세 구현 가능성 | ✅ 충분 | 19개 엔드포인트 메서드·경로·요청·응답·에러 완결 |
| 3. DB 모델 구현 가능성 | ✅ 충분 | 3개 테이블 Prisma 스키마 완결, FK·인덱스·unique 명시 |
| 4. 프론트엔드 페이지 구조 | ✅ 충분 | 컴포넌트 트리·라우팅·상태 관리 구현 가능 수준 |
| 5. 백엔드 구조 | ✅ 충분 | 4계층·미들웨어·트랜잭션·폴더 구조 완결 |
| 6. 인증/인가 | ✅ 충분 | Token Rotation·refresh_token_hash·쿠키 Path 확정 |
| 7. 일정 CRUD | ✅ 충분 | 6개 엔드포인트 흐름 완결, 정렬·soft delete 명확 |
| 8. 검색/필터 기준 | ✅ 충분 | 검색 범위·필터 AND/OR·미분류 정책 확정 |
| 9. 날짜 처리 기준 | ✅ 충분 | KST·nowKST()·D-Day·display_date 정책 완결 |
| 10. 하네스 구현 순서 | ✅ 충분 | Step 0~12 의존성·파일 범위·금지 규칙 명확 |
| 11. 검증 기준 | ✅ 충분 | 10개 영역, curl 예시, Playwright P-01~P-08 완결 |
| 12. 잔존 블로커 | ✅ 충분 | 즉시 차단 0건, 개발 중 결정 가능 항목만 존재 |

범례: ✅ 충분 / ⚠️ 부분(개발 중 결정 가능) / ❌ 미흡(착수 전 결정 필수)

---

## 1. PRD 확정 여부

### 평가
✅ 충분

PRD v1.0은 41개 섹션으로 구성되며, 사용자 결정 K-01~K-10 전부가 PRD §15~§35 본문에 직접 반영되어 있다. 라벨 체계(`[명세서]`, `[사용자 결정 K-XX]`, `[AI 보완]`)가 일관되게 적용되어 근거 추적이 가능하다.

### 강점
- K-01(다중 사용자 JWT), K-02(카테고리 커스터마이징), K-03(5색 고정), K-04(중요도 우선 정렬), K-05(섹션 순서), K-06(프로필 페이지), K-07(is_remind UI만), K-08(모달+?planId SSoT), K-09(카테고리 삭제 SET NULL), K-10(display_date 사용자 지정) — 10개 결정이 PRD §15~§35에 모두 명시되어 있다.
- 기능 목록(F-01~F-20), 페이지 목록, API base path, 에러 코드 규칙, 데이터 모델이 단일 문서에 통합되어 있어 설계 문서 간 참조 비용이 낮다.
- PRD §40에서 미확정 12개 항목(U-01~U-12)이 명시적으로 분리되어 있고, 각 항목에 "현재 가정/기본값"이 제시되어 있다.

### 약점/리스크
- PRD §16 users 테이블에 `refresh_token_hash` 컬럼이 누락되어 있다(data-model.md §2-1에는 추가됨). PRD와 설계 문서 간 소폭 불일치가 존재하나, 설계 문서가 더 최신 상태이므로 구현 시 data-model.md 기준을 따르면 된다.
- PRD §15~§17의 데이터 모델 컬럼 정의에 `CURRENT_TIMESTAMP` 기본값이 그대로 남아 있다. design-review.md §6 DB-02 패치가 data-model.md에는 반영되었으나 PRD §15~§17에는 미반영 상태이다. 구현 시 `nowKST()` 명시 전달 정책을 따라야 한다.
- design-review.md §5 P-01~P-05는 PRD 자체 수정이 권고된 항목이나 PRD 본문 수정은 완료되지 않았다. 설계 문서에 임시 처리 방침이 명확히 기술되어 있으므로 구현 차단은 아니다.

### 개발 착수 영향도
즉시 차단 없음. PRD 본문 일부 불일치는 설계 문서(data-model.md, api-spec.md)가 우선 기준임을 팀 내 공유하면 충분하다.

---

## 2. API 명세 구현 가능성

### 평가
✅ 충분

19개 엔드포인트(auth 5, plans 6, categories 4, profile 4) 전부에 HTTP 메서드·경로·요청 본문·성공 응답 예시·에러 코드 표가 완결되어 있다. design-review.md §6에서 BE-01~BE-12 중 개발 필수 항목 7개(BE-01, 02, 03, 04, 05, 06, 12)가 패치 완료 처리되어 있다.

### 강점
- Token Rotation 흐름이 api-spec.md §3-3에 4단계 절차로 명확히 기술되어 있다(검증→새 토큰 발급→hash 교체→Set-Cookie 갱신).
- 공통 에러 코드 표(api-spec.md §2)에 14개 코드가 정의되어 있고, 각 엔드포인트 에러 표에 연결되어 있다.
- `GET /plans`의 서버 고정 정렬 4단계(`is_completed ASC → priority CASE → due_time ASC NULLS LAST → created_at ASC`)가 api-spec.md §4-1에 명시되어 있다.
- 다중 필터 파라미터(`?category=1&category=2`) 처리를 위한 Zod `z.preprocess` 패턴이 backend-spec.md §8-2에 의사 정의로 추가되어 있다.
- Refresh Token 쿠키 Path가 `/api/v1/auth`로 통일되어 logout과 refresh 양쪽에서 쿠키 수신 가능하다(BE-12 패치).

### 약점/리스크
- `DELETE /api/v1/plans/:id` 응답이 api-spec.md에 200 OK + `{ message: "삭제 완료" }`로 기술되어 있으나, validation.md §3-2에는 `204 No Content`로 기술되어 있다. 두 문서 간 HTTP 상태 코드 불일치가 존재한다. 구현 시 하나로 통일이 필요하다(낮은 우선순위, 개발 중 결정 가능).
- `DELETE /api/v1/categories/:id`도 동일한 불일치 가능성이 있다(api-spec.md와 validation.md §3-3 비교).
- BE-08(완료 토글 멱등성)은 필수 수정 대상에서 제외되어 "토글 동작 유지 + retry: 0 비활성" 정책으로 가되, 클라이언트 구현 시 TanStack Query mutation retry를 0으로 설정해야 한다는 점을 Step 9 구현자가 인지해야 한다.

### 개발 착수 영향도
즉시 차단 없음. DELETE 응답 코드 불일치는 Step 4 구현 시 팀 내 1분 합의로 해결 가능하다.

---

## 3. DB 모델 구현 가능성

### 평가
✅ 충분

3개 테이블(users, categories, plans)의 Prisma 스키마 의사 정의가 data-model.md §2-4, §3-4, §4-4에 완결되어 있다. design-review.md §6에서 DB-01~DB-14 중 필수 항목 8개(DB-01, 02, 03, 06, 07, 09, 12, 14) 모두 패치 완료 처리되어 있다.

### 강점
- `PRAGMA foreign_keys = ON` 활성화 방법이 data-model.md §0에 명시되어 있고, config/prisma.ts에서 `$executeRawUnsafe('PRAGMA foreign_keys = ON')` 호출 패턴이 Step 1 구현 지침에 포함되어 있다(DB-01 패치).
- `@default(now())`와 `@updatedAt`이 Prisma 스키마에서 제거되고, 모든 타임스탬프는 애플리케이션에서 `nowKST()` 명시 전달 방식으로 확정되었다(DB-02, DB-14 패치). `nowKST()` 함수는 backend-spec.md §utils/dateUtil.ts에 정의 위치가 명시되어 있다.
- categories 테이블의 `@@unique([userId, name])` 제약이 추가되었고, 위반 시 에러 코드 `CATEGORY_NAME_ALREADY_EXISTS`(409)가 api-spec.md §2에 정의되어 있다(DB-03 패치).
- 카테고리 삭제 트랜잭션 순서(plans SET NULL 먼저 → categories DELETE 다음)가 data-model.md §9-6에 명시되어 있다(DB-09 패치).
- `display_date <= due_date` Zod refine 검증이 data-model.md §4-2에 코드 레벨로 명시되어 있다(DB-12 패치).

### 약점/리스크
- `completed_at` 컬럼 부재로 완료 항목 간 정렬 기준이 명확하지 않다(DB-08, 낮은 우선순위). data-model.md에 "완료 항목 간 정렬은 updated_at 기준"이라는 명기가 없다. 실제 구현 시 `is_completed=1`인 항목들이 `updated_at` 또는 `created_at` 기준으로 정렬되는 방식을 Step 4 구현자가 임의 결정해야 할 수 있다.
- `idx_plans_deleted` 단독 인덱스의 실효성 문제(DB-05)가 해결되지 않았다. MVP 수준에서는 허용 가능하나 일정 데이터가 수천 건 누적되면 성능 저하 가능성이 있다.
- PRD §15 plans 테이블 정의에 `CURRENT_TIMESTAMP` 기본값이 남아 있어 PRD와 data-model.md 간 불일치가 존재한다. 구현은 data-model.md를 따른다.

### 개발 착수 영향도
즉시 차단 없음. completed_at 미정의는 Step 4 구현 시 "미완료→완료 순서, 완료 항목 간은 created_at ASC"로 암묵적으로 처리하거나 1줄 추가 명기를 권고한다.

---

## 4. 프론트엔드 페이지 구조 명확성

### 평가
✅ 충분

frontend-spec.md에 폴더 구조(Feature-Sliced 패턴), 라우팅 구조, 컴포넌트 트리(페이지별), 상태 관리 분리 원칙, API 호출 계층 분리가 구현 가능한 수준으로 기술되어 있다. design-review.md §6에서 FE-01~FE-12 중 필수 항목 9개 전부 패치 완료 처리되어 있다.

### 강점
- `PlanFilterBar`, `CalendarDayPopup`, `SearchResultList` 컴포넌트가 frontend-spec.md §3-3 컴포넌트 트리에 추가되어 있다(FE-02, FE-03, FE-07 패치).
- `planDetailId`를 Zustand planStore에서 제거하고 URL `?planId=`를 SSoT로 확정하여 이중 상태 문제가 해결되었다(FE-12 패치, K-08=B 결정과 일치).
- 수정 모드에서 `due_date` 변경 시 `display_date` 자동 연동 없음(기존 값 유지) 정책이 screen-flow.md §5에 명시되어 있다(FE-10 패치).
- `useBlocker` 훅 사용 및 `beforeunload` 처리가 frontend-spec.md §3-4에 기술되어 있다(FE-06 패치).
- 연필 아이콘 클릭 = 편집 모드 직접 진입, 카드 본문 클릭 = 뷰 모드 진입 인터랙션 분리가 screen-flow.md §15에 명시되어 있다(FE-11 패치).

### 약점/리스크
- 반응형 지원 범위(U-03)가 여전히 미확정으로, "PC 데스크탑 우선"이라는 가정만 있고 최소 지원 뷰포트 너비(예: 1024px)가 명시되지 않았다. FE-08은 필수 수정 대상에서 제외되어 있다. CSS 미디어 쿼리 기준점 부재로 Step 9~12 구현 시 개발자가 임의로 판단해야 할 수 있다.
- 비밀번호 찾기 링크 처리 정책(FE-09)도 필수 수정 대상에서 제외되어 와이어프레임에 `[확인 필요]` 표기가 남아 있다. Step 8 구현 시 "초기 버전 미표시"로 결정 후 구현하면 된다.
- Toast 성공 색상 토큰(FE-13)이 frontend-spec.md §7-1에 미정의 상태이다. 낮은 우선순위이나 Step 8 이후 구현 시 임의 색상 선택 가능성이 있다.

### 개발 착수 영향도
즉시 차단 없음. 반응형 기준점은 Step 0 tailwind.config.ts 작성 시 "min-width: 1024px"를 기본 타깃으로 명시하는 1줄로 처리 가능하다.

---

## 5. 백엔드 구조 명확성

### 평가
✅ 충분

4계층 아키텍처(routes → controllers → services → repositories), 폴더 구조, 미들웨어 체인, 환경 변수 구성, AppError 계층이 backend-spec.md에 완결되어 있다. Prisma 스키마 의사 정의가 backend-spec.md §9-4에 추가되어 있다(BE-05 패치).

### 강점
- 미들웨어 5종(authMiddleware, errorHandler, validate, requestLogger, rateLimiter)의 동작 순서와 처리 로직이 backend-spec.md §4에 상세히 기술되어 있다.
- Prisma P2002(unique 위반), P2025(레코드 없음), multer LIMIT_FILE_SIZE 에러를 AppError로 변환하는 errorHandler 처리 규칙이 backend-spec.md §4-3에 명시되어 있다.
- 회원가입 트랜잭션(`users INSERT + categories 5개 INSERT`)과 카테고리 삭제 트랜잭션(`plans SET NULL → categories DELETE`) 위치가 서비스 레이어에 명확히 지정되어 있다.
- `utils/dateUtil.ts`에 `nowKST()` 함수 위치가 명시되어 있고, Step 1 허용 파일 목록에 포함되어 있다.
- multer 설정(diskStorage, 허용 MIME, 5MB 제한, 파일 경로 패턴)이 backend-spec.md §4-5에 완결되어 있다.

### 약점/리스크
- BE-13(month 필터 날짜 범위 오류 가능성)이 필수 수정 대상에서 제외되어 backend-spec.md §8-2의 `'{YYYY}-{MM}-31'` 하드코딩이 그대로 남아 있다. Step 4 구현 시 `endOfMonth()` 사용으로 교체하는 것을 권고한다(낮은 우선순위).
- BE-10(authMiddleware 만료 vs 서명 오류 응답 코드 분기)이 필수 수정 대상에서 제외되어 있다. 클라이언트 인터셉터에서 `AUTH_UNAUTHORIZED`와 `AUTH_INVALID_TOKEN` 두 코드를 모두 처리해야 한다는 점을 Step 7 구현자가 인지해야 한다.
- BE-11(multer 파일 없음 처리 위치)이 필수 수정 대상에서 제외되어 있다. Step 6 구현 시 컨트롤러에서 `req.file` 존재 여부 확인 후 `VALIDATION_FAILED` throw 처리를 명시적으로 추가해야 한다.

### 개발 착수 영향도
즉시 차단 없음. 위 세 항목은 해당 Step 구현 시 간단한 추가 처리로 해결 가능하다.

---

## 6. 인증/인가 기준 명확성

### 평가
✅ 충분

JWT Access Token(1h) + Refresh Token(7d httpOnly 쿠키) 전략과 Token Rotation 흐름이 api-spec.md §3-3과 backend-spec.md §5에 완결되어 있다. BE-01, BE-02, BE-12 패치로 핵심 보안 정책이 확정되었다.

### 강점
- `refresh_token_hash`가 users 테이블에 추가되어 로그아웃 시 NULL 설정, refresh 시 bcrypt 비교 후 새 hash로 교체하는 서버 측 무효화 방법이 확정되어 있다(BE-01 패치).
- Token Rotation 채택이 확정되었고, 재사용 감지 시 `refresh_token_hash = NULL`로 전체 세션 폐기하는 정책이 backend-spec.md §5-3에 명시되어 있다(BE-02 패치).
- Refresh Token 쿠키 Path가 `/api/v1/auth`로 변경되어 refresh와 logout 양쪽에서 쿠키가 정상 수신된다(BE-12 패치).
- bcrypt cost 12, 비밀번호 8자 이상 영문+숫자 포함, rate limit 5req/min/IP가 PRD §19에 명시되어 있다.
- 타인 리소스 접근 시 403 대신 404 반환(존재 자체 숨김) 정책이 validation.md §3-0에 명시되어 있다.

### 약점/리스크
- 회원가입 후 자동 로그인 vs /login 리다이렉트(P-01) 정책이 PRD §10-1 및 api-spec.md §3-1에 "/login 리다이렉트, 토큰 미발급"으로 확정되어 있으나, UX 관점에서 UX 개선 권고가 design-review.md §5에 기록되어 있다. 팀이 Step 8 완료 후 다시 검토할 수 있다.
- 이메일 인증 절차(U-04)와 비밀번호 재설정 흐름(U-05)은 MVP 제외로 명시되어 있다.
- 비밀번호 정책 세부 사항(U-07, 특수문자 필수 여부)이 "영문+숫자 8자 이상, 특수문자 미필수"로 가정 처리되어 있다.

### 개발 착수 영향도
즉시 차단 없음. P-01 UX 결정은 Step 8 이후로 미룰 수 있으며, 현재 확정된 정책(/login 리다이렉트)으로도 개발 착수에 문제가 없다.

---

## 7. 일정 CRUD 흐름 완결성

### 평가
✅ 충분

일정 등록(POST), 목록 조회(GET), 단건 조회(GET), 수정(PATCH), 삭제(DELETE soft delete), 완료 토글(PATCH /complete) 6개 엔드포인트의 요청·응답·에러·서버 처리 흐름이 api-spec.md §4에 완결되어 있다.

### 강점
- 서버 고정 정렬 4단계(is_completed ASC → priority CASE → due_time ASC NULLS LAST → created_at ASC)가 api-spec.md §4-1 [BE-03]에 명시되어 있고, "클라이언트 sort 파라미터 없음"이 확정되어 있다.
- `display_date <= due_date` Zod refine 검증이 Zod 코드 레벨로 명시되어 있으며, 위반 시 422 에러 메시지 "처리 예정일은 마감일 이후로 설정할 수 없습니다."가 지정되어 있다.
- 등록 모드에서 `due_date` 선택 시 `displayDate` 자동 설정, 수정 모드에서는 자동 연동 없음 정책이 screen-flow.md §3과 §5에 각각 명시되어 있다.
- soft delete 처리 흐름(`deleted_at = nowKST()`)과 조회 시 `WHERE deleted_at IS NULL` 조건 필수 적용이 data-model.md §9-1에 명시되어 있다.

### 약점/리스크
- 완료 처리 취소 가능 여부(U-01)가 "취소 가능(체크박스 토글)으로 가정하여 구현"으로 처리되어 있다. validation.md §10-3에도 완료 토글 2회 호출이 각각 true/false로 전환됨을 확인하는 내용이 있으므로 토글 방식 구현으로 진행하면 된다.
- `completed_at` 컬럼 부재로 완료 항목 간 정렬 순서가 명확하지 않다(DB-08). 실제 구현 시 `created_at ASC`로 처리하는 것을 권고한다.

### 개발 착수 영향도
즉시 차단 없음. U-01은 이미 "토글 가능"으로 가정 확정되어 있고, 완료 항목 간 정렬은 Step 4 구현 시 1줄로 처리 가능하다.

---

## 8. 검색/필터 기준 명확성

### 평가
✅ 충분

검색 범위, 검색 방식, 필터 조합 규칙, 미분류 필터 파라미터가 api-spec.md §4-1과 data-model.md §9-4~§9-5에 완결되어 있다. DB-06, DB-07, FE-02, FE-03 패치로 주요 미확정 사항이 해소되었다.

### 강점
- 검색 범위: 전체 미삭제 레코드(`deleted_at IS NULL`), 현재 월 한정 없음 — api-spec.md §4-1 [BE-03], data-model.md §9-4에 명시(DB-06 패치).
- 필터 조합 규칙: 카테고리 OR 그룹, 중요도 OR 그룹, 완료 여부 단일 선택, 세 그룹 간 AND 조합이 data-model.md §9-5에 표 형식으로 명시되어 있다(DB-07 패치).
- 미분류 필터: `?uncategorized=1` 파라미터로 `category_id IS NULL` 조회, `?uncategorized=1&category=1`은 OR 조건 처리가 api-spec.md §4-1에 명시되어 있다.
- 검색 모드 UI: 검색어 입력 시 캘린더·주간 바 숨김, `SearchResultList` 별도 영역 표시, 검색어 삭제 시 메인 레이아웃 복귀가 frontend-spec.md §3-3 [FE-03]에 명시되어 있다.
- `PlanFilterBar` 컴포넌트 위치(헤더 검색바 아래, 캘린더 위)와 동작이 frontend-spec.md §3-3 [FE-02]에 명시되어 있다.

### 약점/리스크
- SQLite LIKE의 한국어 정확 매칭만 지원(부분 자모 분리 불가)이 MVP 명시적 제한 사항으로 기록되어 있으나, 사용자 안내 문구(예: "정확한 키워드를 입력하세요")가 UI 명세에 포함되지 않았다. Step 12 구현 시 플레이스홀더 또는 도움말 텍스트로 처리하는 것을 권고한다.

### 개발 착수 영향도
즉시 차단 없음. 한국어 검색 제한 안내는 Step 12 구현 시 간단한 placeholder 문구로 처리 가능하다.

---

## 9. 날짜 처리 기준 명확성

### 평가
✅ 충분

타임존 고정(KST, UTC+9), 저장 방식(`nowKST()` 명시 전달), ISO 8601 형식, D-Day 계산 기준, `display_date` 의미와 폼 기본값 정책이 data-model.md §0, api-spec.md §0, wireframe-spec.md §10에 완결되어 있다.

### 강점
- `nowKST()` 함수가 `date-fns-tz`로 KST ISO 8601 문자열을 생성하는 방식으로 data-model.md §0에 명시되어 있다(DB-02 패치).
- 모든 타임스탬프에 DB 기본값(`CURRENT_TIMESTAMP`) 미사용, 애플리케이션 명시 전달 방식이 모든 Prisma 스키마 의사 정의에 주석으로 포함되어 있다(DB-14 패치).
- D-Day 계산 규칙이 wireframe-spec.md §10에 표로 명시되어 있다: diff=0 → "D-Day", diff=1 → "D-1", diff=3 → "D-3", diff<0 → "마감 지남"(빨강), diff=2 또는 diff≥4 → "YYYY.MM.DD"(배지 없음). D-2가 의도적으로 제외된 이유가 명시되어 있다(FE-05 간접 반영).
- `display_date` 의미: K-10=B 사용자 지정, 폼 기본값=due_date, 등록 모드에서 due_date 변경 시 자동 연동, 수정 모드에서 자동 연동 없음 정책이 screen-flow.md §3과 §5에 명시되어 있다.

### 약점/리스크
- api-spec.md §0에서 타임존이 "KST 고정, 요청·응답 모두 KST 기준 ISO 8601"로 명시되어 있으나, 클라이언트 측 date-fns v3 사용 시 브라우저 로컬 타임존과의 충돌을 방지하는 처리 방식이 frontend-spec.md에 구체적으로 기술되지 않았다. Step 9 구현 시 `formatInTimeZone(date, 'Asia/Seoul', 'yyyy-MM-dd')` 패턴 사용을 명시적으로 확인해야 한다.

### 개발 착수 영향도
즉시 차단 없음. 클라이언트 KST 처리는 `lib/date/formatters.ts` 구현 시 date-fns-tz 패턴으로 통일하면 된다.

---

## 10. 하네스의 구현 순서 안전성

### 평가
✅ 충분

Step 0~12의 의존성 그래프, 허용 파일 범위, 금지 사항, 각 Step의 입력·출력·완료 조건이 harness.md에 완결되어 있다.

### 강점
- 단일 Step 원칙("한 번에 하나의 Step만, 이전 Step 완료 기록 없으면 다음 Step 불가")이 명문화되어 있어 범위 확장과 충돌 위험을 구조적으로 차단한다.
- Step별 허용 파일 범위가 구체적인 파일 경로 수준으로 명시되어 있어 "어느 파일을 열어도 되는지"에 대한 판단 비용이 없다.
- 전역 금지 사항 10개가 구현 과정에서 자주 발생하는 실수(any 타입, planDetailId 상태, display_date > due_date 허용 등)를 명시적으로 차단하고 있다.
- 백엔드 우선(Step 1~6) → 프론트 후(Step 7~12)의 의존성 순서가 자연스럽고, Step 7은 Step 0 완료 후 병렬 시작 가능하다는 예외가 명시되어 있다.
- 각 Step에서 참조해야 할 1차·2차 문서가 harness.md §4에 표로 정리되어 있다.

### 약점/리스크
- E2E 테스트(Playwright P-01~P-08)가 Step 12에 집중되어 있어 Step 1~11에서 발생한 회귀를 Step 12까지 늦게 감지할 수 있다. 단, 각 백엔드 Step(3~6)에 supertest 통합 테스트가 포함되어 있고, 프론트 Step(9, 10, 11)에 RTL 단위 테스트와 부분 Playwright 파일(main.spec.ts, plan-create.spec.ts, profile.spec.ts)이 분산 배치되어 있어 완전한 지연은 아니다.
- 프론트엔드·백엔드 통합 검증 시점이 Step 8(로그인 화면 통합) 이후부터 가능하여, Step 7까지는 Mock(MSW) 기반으로 개발해야 한다. 이 점이 harness.md §2 Step 7에 "Step 3 완료 후 통합"으로 명시되어 있어 구현자가 인지하고 있어야 한다.

### 개발 착수 영향도
즉시 차단 없음. Step 의존성 구조가 명확하여 Step 0을 바로 시작할 수 있다.

---

## 11. 검증 기준 충분성

### 평가
✅ 충분

TypeScript strict 모드, ESLint/Prettier, Vitest 단위·통합 테스트, Playwright E2E 8개 시나리오(P-01~P-08), curl 예시 기반 수동 검증, DB 직접 확인 쿼리가 validation.md에 완결되어 있다.

### 강점
- 19개 엔드포인트별 curl 요청 예시와 기대 응답 포맷이 validation.md §3에 구체적으로 기술되어 있어 구현 직후 즉시 검증 가능하다.
- Token Rotation 완전 검증 절차 5단계(쿠키A 저장→갱신→쿠키A 재시도→401→DB 확인)가 validation.md §7-5에 명시되어 있다.
- 서버 고정 정렬 완전 검증을 위한 테스트 데이터(계획 A~E, 기대 순서 B→C→E→A→D)가 validation.md §8-2에 제공되어 있다.
- Playwright 낙관적 업데이트 검증 시 네트워크 지연 시뮬레이션 코드 예시가 validation.md §6 P-04에 포함되어 있다.
- `tsconfig.json` 필수 옵션(strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes 등)이 validation.md §1-3에 명시되어 있다.

### 약점/리스크
- 성능 검증 기준(응답 시간 임계값, 동시 사용자 부하)이 없다. 개인 일정 관리 MVP 범위에서는 허용 가능한 수준이다.
- 접근성 자동 검증(axe 등) 기준이 없다. MVP 범위 외로 처리하면 된다.
- 브라우저 호환성 매트릭스가 명시되지 않았다. 개발 환경이 Chrome 기준으로 암묵적으로 처리될 가능성이 있다.

### 개발 착수 영향도
즉시 차단 없음. MVP 범위에서 성능·접근성·호환성 검증 미포함은 허용 가능한 범위이다.

---

## 12. 잔존 블로커 (개발 전 막히는 요소)

### 12.1 PRD 수정 필요 항목 처리 상태 (P-01~P-05)

| ID | 항목 | 처리 상태 | 구현 착수 영향 |
|---|---|---|---|
| P-01 | 회원가입 후 자동 로그인 vs /login 리다이렉트 | 설계 문서에 PRD §10-1 기준으로 "/login 리다이렉트, 토큰 미발급" 확정. `[확인 필요]` 주석 제거 완료 (api-spec.md §3-1 BE-06 패치) | 차단 없음. UX 재논의는 Step 8 후 가능 |
| P-02 | PUT vs PATCH 메서드 일관성 (카테고리) | api-spec.md §5-3에 "PUT = 전체 교체, name·color·sort_order 모두 필수" 확정. PRD §20-3 C-03의 PUT 존중 | 차단 없음. PUT 사용으로 확정됨 |
| P-03 | 검색 결과 표시 영역 | screen-flow.md §8, wireframe-spec.md §3, frontend-spec.md §3-3에 SearchResultList 별도 영역 확정 (FE-03 패치) | 차단 없음. 완전 해소 |
| P-04 | 정렬 4순위 created_at 누락 | screen-flow.md §2, api-spec.md §4-1 [BE-03]에 4순위 created_at ASC 추가 완료 | 차단 없음. 완전 해소 |
| P-05 | 주간 바 연필 아이콘 인터랙션 | screen-flow.md §15, wireframe-spec.md §3에 "연필=편집 모드, 카드 본문=뷰 모드" 분리 명시 (FE-11 패치) | 차단 없음. 완전 해소 |

### 12.2 개발 중 결정 가능 항목 (PRD §40)

| ID | 항목 | 현재 가정/기본값 | 처리 시점 |
|---|---|---|---|
| U-01 | 완료 처리 취소 가능 여부 | 취소 가능 (체크박스 토글). validation.md §10-3에서 2회 토글 검증 포함 | Step 4 구현 중 확정 |
| U-02 | 검색 결과 범위 | 전체 기간 (api-spec.md §4-1에 "월 한정 없음"으로 확정됨) | 완료 |
| U-03 | 반응형 지원 범위 | PC 데스크탑 우선 | Step 0 tailwind.config.ts 작성 시 1줄 처리 |
| U-04 | 회원가입 이메일 인증 | MVP 제외 (즉시 가입) | PRD §37에 명시됨 |
| U-05 | 비밀번호 찾기/재설정 | MVP 제외 | PRD §37에 명시됨 |
| U-06 | 아바타 이미지 제약 | 5MB 이하, JPEG·PNG·WebP — api-spec.md §2 에러 코드 표에 FILE_TOO_LARGE(5MB), INVALID_FILE_TYPE 정의됨 | Step 6 시작 전 1줄 확인 권고 |
| U-07 | 비밀번호 정책 세부 | 영문+숫자 8자 이상, 특수문자 미필수 — PRD §12-1에 명시됨 | 완료 |
| U-08 | 데이터 백업/복구 | 미구현 (SQLite 파일 수동 백업) | 운영 전 보완 |
| U-09 | 다국어 지원 | 한국어 단일 지원 | PRD §37에 명시됨 |
| U-10 | 주간 바 요일 재클릭 동작 | 재클릭 시 접힘 | Step 9 구현 중 확정 |
| U-11 | 캘린더 날짜 클릭 동작 | 소형 팝업 표시 후 개별 클릭 — wireframe-spec.md §3에 CalendarDayPopup으로 확정됨 (FE-07 패치) | 완료 |
| U-12 | 중요도 라벨 "보통" vs "중간" | "보통" (PRD §4 명세서 기준) | Step 8 구현 시 확인 |

### 12.3 환경 의존성 (사전 준비)

| 항목 | 상태 |
|---|---|
| Node.js 20 LTS | harness.md §0-3, backend-spec.md §0에 명시 — 설치 필요 |
| npm/pnpm workspace | harness.md Step 0에 포함 |
| SQLite 3.35+ (DROP COLUMN 지원) | harness.md §7에 간접 명시 |
| .env 템플릿 | backend/.env.example — Step 0 허용 파일에 포함 |
| Tailwind config → 디자인 토큰 매핑 | Step 0 작업 범위에 포함 |

### 12.4 종합 블로커 평가

| 구분 | 개수 |
|---|---|
| 즉시 차단 항목 | **0건** |
| 개발 중 결정 가능 항목 | 7건 (U-01, U-03, U-06, U-10, U-12, DELETE 응답 코드 불일치, completed_at 정렬 기준) |
| 무시 가능 항목 (MVP 범위 외) | 5건 (U-04, U-05, U-08, U-09, 성능·접근성 검증) |

---

## 권장 조치 — 개발 착수 가능 판정에 따른 조치

### A) Step 0 즉시 시작

1. progress.md에 "Step 0 in_progress" 기록 후 착수
2. harness.md §3 Step 0 허용 파일 범위 엄수 (소스 파일 생성 금지)
3. tailwind.config.ts 작성 시 "min-width: 1024px 기본 타깃" 1줄 추가 (U-03 처리)
4. backend/.env.example에 `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `FRONT_ORIGIN` 키 포함

### B) Step 1 착수 전 1분 팀 확인 사항

- `completed_at` 컬럼 추가 여부 — 추가하지 않을 경우 "완료 항목 간 정렬은 created_at ASC"를 data-model.md §4-2에 1줄 추가
- `DELETE /api/v1/plans/:id` 응답 코드 — 200 또는 204 중 팀 합의 후 api-spec.md와 validation.md를 동일하게 수정

### C) 선택적 권고 (착수 차단 아님)

- PRD §15~§17의 `CURRENT_TIMESTAMP` 기본값 표기를 "DB 기본값 없음, nowKST() 전달"로 수정하여 PRD와 data-model.md 일관성 확보 (낮은 우선순위)
- Step 6 시작 전 U-06(아바타 파일 제약) 확인 — 현재 api-spec.md에 5MB, jpg/png/webp로 정의되어 있으므로 별도 확인 없이 그대로 구현 가능

---

## 부록 A. 점검 시 참조한 문서 버전

| 문서 | 경로 | 버전/작성일 |
|---|---|---|
| PRD v1.0 | docs/03-prd/prd.md | 2026-05-20, 41개 섹션 |
| api-spec.md | docs/04-design/api-spec.md | 2026-05-20 (BE-01~BE-06, BE-12 패치 반영) |
| data-model.md | docs/04-design/data-model.md | 2026-05-20 (DB-01~DB-03, DB-06, DB-07, DB-09, DB-12, DB-14 패치 반영) |
| frontend-spec.md | docs/04-design/frontend-spec.md | 2026-05-20 (FE-01~FE-07, FE-10~FE-12 패치 반영) |
| backend-spec.md | docs/04-design/backend-spec.md | 2026-05-20 (BE-01~BE-05, BE-12 패치 반영) |
| screen-flow.md | docs/04-design/screen-flow.md | 2026-05-20 (FE-04, FE-06, FE-10, FE-11 패치 반영) |
| wireframe-spec.md | docs/04-design/wireframe-spec.md | 2026-05-20 (FE-02, FE-03, FE-07, FE-10, FE-11 패치 반영) |
| design-review.md | docs/04-design/design-review.md | 2026-05-20, §6 보완 반영 결과 포함 |
| harness.md | docs/05-harness/harness.md | 2026-05-20, Step 0~12 |
| validation.md | docs/05-harness/validation.md | 2026-05-20, 10개 검증 영역 |

---

## 부록 B. 발견된 추가 개선 권고 (참고용, 차단 아님)

| 우선순위 | 항목 | 권고 내용 | 처리 시점 |
|---|---|---|---|
| 보통 | DELETE 응답 코드 불일치 | api-spec.md(200)와 validation.md(204) 통일 | Step 4 전 합의 |
| 보통 | completed_at 정렬 명기 | data-model.md §4-2에 "완료 항목 간 created_at ASC" 1줄 추가 | Step 1 전 |
| 낮음 | BE-13 month 필터 하드코딩 | `'{YYYY}-{MM}-31'` → `endOfMonth()` 사용 | Step 4 구현 중 |
| 낮음 | PRD §15~§17 타임스탬프 불일치 | CURRENT_TIMESTAMP → "DB 기본값 없음" 표기 수정 | PRD v1.1 작성 시 |
| 낮음 | 반응형 최소 뷰포트 명시 | tailwind.config.ts에 1024px 기준 명시 | Step 0 |
| 낮음 | 한국어 검색 제한 안내 | SearchBar placeholder 또는 도움말 텍스트 추가 | Step 12 |
| 낮음 | Toast 성공 색상 토큰 | frontend-spec.md §7-1에 success 토큰 추가 | Step 8 |
| 낮음 | 비밀번호 찾기 링크 처리 | wireframe-spec.md §1 [확인 필요] → "초기 버전 미표시" 확정 | Step 8 |
| 낮음 | idx_plans_deleted 인덱스 실효성 | 복합 인덱스로 교체 검토 | 성능 이슈 발생 시 |
| 낮음 | DB-13 동시성 정책 명기 | data-model.md에 "초기 버전 SQLite 직렬 쓰기 의존" 1줄 추가 | Step 1 전 |
