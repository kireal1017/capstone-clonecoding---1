# PlanMate 프론트엔드 설계서

> 작성일: 2026-05-20
> 버전: 1.0
> 기반 문서: PRD v1.0 (§6, §9, §13, §14, §19~§35)

---

## 0. 기술 스택

[PRD 확정] PRD §6

| 항목 | 라이브러리/버전 | 역할 |
|---|---|---|
| 프레임워크 | React 18 + TypeScript | UI 렌더링 |
| 빌드 도구 | Vite | 개발 서버, 번들링 |
| 스타일링 | TailwindCSS v3 | 유틸리티 CSS |
| 라우팅 | React Router v6 | 클라이언트 사이드 라우팅, Protected Route |
| 서버 상태 관리 | TanStack Query v5 | API 데이터 캐싱·갱신·로딩·에러 |
| 클라이언트 상태 관리 | Zustand | UI 상태 (선택 날짜, 모달, 검색어 등) |
| 폼 | React Hook Form + Zod | 폼 상태·검증 |
| 날짜 유틸리티 | date-fns v3 | 날짜 포맷·D-Day 계산 (KST 고정) |
| HTTP 클라이언트 | axios | API 요청, 인터셉터 |
| 테스트 (단위/통합) | Vitest + React Testing Library + MSW | 컴포넌트·훅·API 모킹 |
| 테스트 (E2E) | Playwright | 전체 사용자 시나리오 |

---

## 1. 폴더 구조

[AI 제안안] Feature-Sliced 패턴 채택. PRD §6의 컴포넌트 구조를 기반으로 기능 단위 모듈화.

```
frontend/
└── src/
    ├── pages/                        # 라우트 단위 페이지 컴포넌트
    │   ├── LoginPage.tsx
    │   ├── AuthPage.tsx
    │   ├── MainPage.tsx
    │   ├── PlanCreatePage.tsx
    │   └── ProfilePage.tsx
    │
    ├── features/                     # 기능(도메인) 단위 모듈
    │   ├── auth/
    │   │   ├── api/
    │   │   │   ├── login.ts          # POST /auth/login
    │   │   │   ├── register.ts       # POST /auth/register
    │   │   │   ├── logout.ts         # POST /auth/logout
    │   │   │   └── refresh.ts        # POST /auth/refresh
    │   │   ├── components/
    │   │   │   ├── LoginForm.tsx
    │   │   │   └── RegisterForm.tsx
    │   │   ├── hooks/
    │   │   │   ├── useLogin.ts       # useMutation → login API
    │   │   │   ├── useRegister.ts    # useMutation → register API
    │   │   │   └── useLogout.ts      # useMutation → logout API
    │   │   ├── stores/
    │   │   │   └── authStore.ts      # Zustand: user, accessToken, isAuthenticated
    │   │   └── schemas/
    │   │       ├── login.schema.ts   # Zod: LoginSchema
    │   │       └── register.schema.ts# Zod: RegisterSchema
    │   │
    │   ├── plans/
    │   │   ├── api/
    │   │   │   ├── getPlans.ts       # GET /plans
    │   │   │   ├── getPlan.ts        # GET /plans/:id
    │   │   │   ├── createPlan.ts     # POST /plans
    │   │   │   ├── updatePlan.ts     # PATCH /plans/:id
    │   │   │   ├── deletePlan.ts     # DELETE /plans/:id
    │   │   │   └── completePlan.ts   # PATCH /plans/:id/complete
    │   │   ├── components/
    │   │   │   ├── PlanCard.tsx      # 오늘 할 일 카드
    │   │   │   ├── PlanDetailModal.tsx  # 상세 모달 (K-08)
    │   │   │   ├── PlanForm.tsx      # 등록/수정 공통 폼
    │   │   │   ├── TodayPlanList.tsx # 오늘 할 일 목록 (K-04 정렬)
    │   │   │   └── WeeklyPlanBar.tsx # 주간 일정 바 (K-05)
    │   │   ├── hooks/
    │   │   │   ├── usePlans.ts       # useQuery → 목록
    │   │   │   ├── usePlan.ts        # useQuery → 단건
    │   │   │   ├── useCreatePlan.ts  # useMutation
    │   │   │   ├── useUpdatePlan.ts  # useMutation
    │   │   │   ├── useDeletePlan.ts  # useMutation (soft delete)
    │   │   │   └── useCompletePlan.ts# useMutation (낙관적 업데이트)
    │   │   ├── stores/
    │   │   │   └── planStore.ts      # Zustand: planDetailId, filters
    │   │   └── schemas/
    │   │       └── plan.schema.ts    # Zod: PlanCreateSchema, PlanUpdateSchema
    │   │
    │   ├── calendar/
    │   │   ├── components/
    │   │   │   ├── MonthlyCalendar.tsx  # 6×7 격자 캘린더
    │   │   │   ├── CalendarCell.tsx     # 날짜 셀 (점 표시, 오늘 강조)
    │   │   │   └── CalendarHeader.tsx   # 월 이동 헤더
    │   │   ├── hooks/
    │   │   │   └── useCalendar.ts       # 선택 월 상태, 이동 로직
    │   │   └── stores/
    │   │       └── calendarStore.ts     # Zustand: selectedMonth, selectedDate
    │   │
    │   ├── categories/
    │   │   ├── api/
    │   │   │   ├── getCategories.ts
    │   │   │   ├── createCategory.ts
    │   │   │   ├── updateCategory.ts
    │   │   │   └── deleteCategory.ts
    │   │   ├── components/
    │   │   │   ├── CategoryChip.tsx     # 색상 점 + 이름 칩
    │   │   │   ├── CategoryList.tsx     # 프로필 페이지 카테고리 목록
    │   │   │   └── CategoryFormModal.tsx# 추가/수정 팝업
    │   │   ├── hooks/
    │   │   │   ├── useCategories.ts
    │   │   │   ├── useCreateCategory.ts
    │   │   │   ├── useUpdateCategory.ts
    │   │   │   └── useDeleteCategory.ts
    │   │   └── schemas/
    │   │       └── category.schema.ts   # Zod: CategorySchema
    │   │
    │   └── profile/
    │       ├── api/
    │       │   ├── getProfile.ts
    │       │   ├── updateProfile.ts
    │       │   ├── changePassword.ts
    │       │   └── uploadAvatar.ts
    │       ├── components/
    │       │   ├── ProfileForm.tsx      # 닉네임 수정
    │       │   ├── PasswordForm.tsx     # 비밀번호 변경
    │       │   └── AvatarUpload.tsx     # 이미지 업로드
    │       ├── hooks/
    │       │   ├── useProfile.ts
    │       │   ├── useUpdateProfile.ts
    │       │   ├── useChangePassword.ts
    │       │   └── useUploadAvatar.ts
    │       └── schemas/
    │           ├── profile.schema.ts
    │           └── password.schema.ts
    │
    ├── components/
    │   └── ui/                       # 공통 재사용 컴포넌트
    │       ├── Button.tsx            # Primary / Secondary(Ghost) 버튼
    │       ├── Input.tsx             # 인풋 필드 (에러 상태 포함)
    │       ├── Textarea.tsx          # 메모용 텍스트 영역
    │       ├── Chip.tsx              # 카테고리·중요도 칩
    │       ├── Checkbox.tsx          # 완료 체크박스
    │       ├── Modal.tsx             # 모달 기본 컨테이너 (ESC 닫기)
    │       ├── ConfirmModal.tsx      # 저장/삭제/취소 확인 모달
    │       ├── Badge.tsx             # D-Day 배지
    │       ├── Avatar.tsx            # 아바타 이미지 (기본 이미지 폴백)
    │       ├── FAB.tsx               # 우측 하단 Floating Action Button
    │       ├── Toast.tsx             # 토스트 알림 (3초 자동 닫기)
    │       └── SearchBar.tsx         # 검색 입력 (debounce 내장)
    │
    ├── lib/
    │   ├── api/
    │   │   └── httpClient.ts         # axios 인스턴스, 인터셉터, 401 자동 갱신
    │   ├── date/
    │   │   ├── formatters.ts         # 날짜 포맷 유틸 (date-fns v3, KST)
    │   │   └── ddayCalc.ts           # D-Day 계산 (differenceInCalendarDays)
    │   └── auth/
    │       └── tokenStorage.ts       # Access Token 저장·조회·삭제
    │
    ├── routes/
    │   ├── router.tsx                # createBrowserRouter 라우트 정의
    │   └── PrivateRoute.tsx          # 인증 가드 컴포넌트
    │
    ├── styles/
    │   ├── tailwind.css              # @tailwind directives
    │   └── tokens.ts                 # Tailwind 토큰 상수 (색상, 카테고리 색상 등)
    │
    └── types/
        ├── api.ts                    # API 응답 타입 (ApiResponse<T>, ApiError)
        └── domain.ts                 # Plan, Category, User 도메인 타입
```

---

## 2. 라우팅 구조

[PRD 확정] PRD §9, K-06=A, K-08=B

| 경로 | 컴포넌트 | Protected | 설명 |
|---|---|---|---|
| `/login` | `LoginPage` | X | 로그인. 이미 인증 시 `/`로 리다이렉트 |
| `/auth` | `AuthPage` | X | 회원가입. 이미 인증 시 `/`로 리다이렉트 |
| `/` | `MainPage` | O | 메인. 미인증 시 `/login`으로 리다이렉트 |
| `/?planId=:id` | `MainPage` + `PlanDetailModal` | O | 쿼리 파라미터 감지 → 모달 오픈 (K-08) |
| `/plans/new` | `PlanCreatePage` | O | 일정 등록 폼 |
| `/profile` | `ProfilePage` | O | 프로필·카테고리 관리 |

**PrivateRoute 동작:**
1. `authStore.accessToken` 유무 확인
2. 없으면 `<Navigate to="/login" state={{ from: location }} replace />`
3. 로그인 성공 후 `location.state.from`으로 복귀 [AI 제안안]

**공개 경로 리다이렉트:**
- `/login`, `/auth` 접근 시 이미 인증된 사용자 → `<Navigate to="/" replace />`

---

## 3. 컴포넌트 트리 (페이지별)

### 3-1. LoginPage (`/login`)

```
<LoginPage>
  └── <LoginForm>
        ├── <Input name="email" />
        ├── <Input name="password" type="password" />
        ├── <Button type="submit">로그인</Button>
        └── <Link to="/auth">회원가입</Link>
```

### 3-2. AuthPage (`/auth`)

```
<AuthPage>
  └── <RegisterForm>
        ├── <Input name="nickname" />
        ├── <Input name="email" />
        ├── <Input name="password" type="password" />
        ├── <Input name="passwordConfirm" type="password" />
        ├── <Button type="submit">가입하기</Button>
        └── <Link to="/login">로그인</Link>
```

### 3-3. MainPage (`/`)

[PRD 확정] K-05=B 섹션 순서: 캘린더 → 주간 바 → 오늘 할 일

```
<MainPage>
  ├── <header> (고정)
  │     ├── <SearchBar />              # debounce 300ms, ?search= 쿼리 갱신
  │     └── <Avatar /> + <Link to="/profile" />
  │
  ├── [검색 모드가 아닐 때]
  │     ├── <MonthlyCalendar />              # 6×7 격자, 월 이동, 날짜 셀 클릭
  │     │     └── <CalendarCell /> × 42
  │     │           └── <CalendarDayPopup />  # 날짜 셀 클릭 시 미니 팝업 (FE-07)
  │     │
  │     ├── <WeeklyPlanBar />                # 월~일 막대, 요일 클릭 시 확장
  │     │     └── [확장 시] <PlanCard /> × N
  │     │
  │     └── <PlanFilterBar />               # 검색바 아래, 캘린더 위 (FE-02)
  │           # 카테고리 다중 선택 칩 | 중요도 다중 선택 칩 | 완료여부 단일 선택 칩 | 초기화 버튼
  │
  ├── [검색 모드일 때 — searchKeyword 비어있지 않음] (FE-03)
  │     └── <SearchResultList />            # 캘린더·주간바 숨김, 전체 일정 목록 별도 표시
  │           └── <PlanCard /> × N
  │
  ├── <TodayPlanList />                # display_date == 오늘
  │     └── <PlanCard /> × N           # 체크박스, 카테고리 칩, D-Day 배지
  │
  ├── <FAB onClick={() => navigate('/plans/new')} />
  │
  └── [?planId 존재 시] <PlanDetailModal />
        ├── [뷰 모드] 일정 정보 표시
        └── [편집 모드] <PlanForm /> (인라인 전환)
```

**[FE-02] `<PlanFilterBar />` 컴포넌트 위치 및 동작:**
- 위치: 헤더 검색바 바로 아래, `<MonthlyCalendar />` 위
- 카테고리 칩: 다중 선택(OR 조건), 각 카테고리 이름 + 색상 점 표시
- 중요도 칩: 다중 선택(OR 조건), "높음" / "보통" / "낮음"
- 완료여부 칩: 단일 선택, "미완료만" / "완료만" / 선택 없음(전체)
- 초기화 버튼: 모든 필터 칩 선택 해제 → `planStore.resetFilters()` 호출
- 필터 미선택 상태에서는 칩만 표시(선택 해제 스타일), 초기화 버튼 비표시 또는 비활성

**[FE-03] 검색 모드 동작 확정:**
- 검색 키워드가 입력된 경우(`searchKeyword !== ''`): 검색 모드 진입
- 검색 모드 진입 시: `<MonthlyCalendar />`, `<WeeklyPlanBar />` 숨김
- 검색 결과는 `<SearchResultList />` 별도 영역에 전체 일정 목록으로 표시(월 필터 없음, 전체 미삭제 레코드 대상)
- `<TodayPlanList />`는 검색 모드에서도 유지(검색 결과와 별도 섹션)
- 검색어 지우기 시: 검색 모드 해제, 캘린더·주간바 복귀

**[FE-07] `<CalendarDayPopup />` 컴포넌트 명세:**
- 트리거: `<CalendarCell />` 클릭
- 위치: 클릭된 셀 바로 아래, 셀 좌측 정렬 기준 카드 형태
- 내용: 해당 날짜(`display_date` 기준)의 일정 제목 목록
- 각 항목 클릭 시: `navigate('/?planId=<id>')` → 상세 모달 이동
- 닫기: 외부 클릭 또는 ESC 키
- 일정 없는 날짜 셀 클릭 시: 팝업 미표시 또는 "일정 없음" 메시지 표시

### 3-4. PlanCreatePage (`/plans/new`)

**[FE-06] 뒤로가기(←) 동작 확정:**
- 헤더 `←` 아이콘 클릭 = "취소" 버튼과 동일 → 취소 확인 모달 트리거
- React Router v6 `useBlocker` 훅 사용: 폼에 입력 내용이 있을 때 네비게이션 차단
- 브라우저 백 버튼(popstate) 및 새로고침 시 `beforeunload` 이벤트 처리
- 폼 입력 내용 없음(초기 상태) 시 `←` 클릭 → 모달 없이 바로 `/`로 이동

```
<PlanCreatePage>
  ├── <header>← 뒤로가기 + "할일 등록"</header>   # ← 클릭 = 취소 확인 모달 (FE-06)
  └── <PlanForm mode="create">
        ├── <Input name="title" />
        ├── <Input name="dueDate" type="date" />
        ├── <Input name="dueTime" type="time" />
        ├── <Input name="displayDate" type="date" />  # K-10: 기본값=dueDate (등록 모드 자동연동)
        ├── <Checkbox name="isRemind" />              # K-07: UI만
        ├── [카테고리 칩 선택 그룹]
        ├── [중요도 칩 선택 그룹 (high/normal/low)]
        ├── <Textarea name="memo" />
        ├── <Button type="submit">저장하기</Button>   # → ConfirmModal
        └── <Button variant="ghost">취소</Button>    # → ConfirmModal
```

### 3-5. ProfilePage (`/profile`)

[PRD 확정] K-06=A

**[FE-01] 카테고리 수정 API 메서드 확정:**
- `useUpdateCategory` 훅 및 `updateCategory.ts` API 함수는 `PUT /api/v1/categories/:id` 사용 (PRD §20-3 C-03 확정)
- PUT은 전체 교체 의미이므로 요청 바디에 `name`, `color`, `sort_order` **모두 필수** 포함
- PATCH가 아님을 명시: 카테고리 수정은 PUT, 일정 수정은 PATCH로 메서드가 다름에 주의

```
<ProfilePage>
  ├── [프로필 섹션]
  │     ├── <Avatar /> + 편집 아이콘
  │     └── <AvatarUpload />          # multipart 업로드
  │
  ├── [개인정보 섹션]
  │     ├── <ProfileForm />           # 닉네임 수정
  │     └── <Input name="email" disabled />
  │
  ├── [비밀번호 변경 섹션]
  │     └── <PasswordForm />
  │
  └── [카테고리 섹션]  K-02=B
        ├── <CategoryList />
        │     └── <CategoryChip /> × N  # 연필 / 휴지통 아이콘
        ├── <Button>+ 카테고리 추가</Button>
        └── [모달] <CategoryFormModal />  # 추가/수정 팝업 (K-09=B 삭제 확인 포함)
                                          # 수정 시 PUT 요청, name·color·sort_order 모두 전송 (FE-01)
```

---

## 4. 상태 관리 전략

[PRD 확정] PRD §6 상태 관리 분리 원칙

### 4-1. 서버 상태 — TanStack Query v5

**[FE-04] 정렬 정책 확정 (PRD §22-2 일치):**
- 정렬은 **서버 ORDER BY로 수행**. 클라이언트 추가 정렬 없음.
- 서버 고정 정렬 순서:
  1. `is_completed ASC` (미완료 우선)
  2. `priority` CASE: `high=0, normal=1, low=2` ASC (높음 우선)
  3. `due_time ASC NULLS LAST` (마감시간 빠른 순, 시간 없는 항목 후순위)
  4. `created_at ASC` (등록 순서 — 4순위, PRD §22-2 명시)
- 클라이언트에서 별도 sort 함수 미사용. API 응답 순서 그대로 렌더링.

| queryKey | 데이터 | staleTime | gcTime |
|---|---|---|---|
| `['plans', 'list', filters]` | 일정 목록 (월간·검색·필터) | 1분 | 5분 |
| `['plans', 'detail', id]` | 일정 단건 | 30초 | 3분 |
| `['categories']` | 카테고리 목록 | 5분 | 10분 |
| `['profile']` | 내 프로필 정보 | 5분 | 10분 |

**Mutation 후 캐시 무효화 위치:**

| Mutation | invalidateQueries |
|---|---|
| 일정 생성 | `['plans', 'list']` |
| 일정 수정 | `['plans', 'list']`, `['plans', 'detail', id]` |
| 일정 삭제 | `['plans', 'list']` |
| 완료 토글 | `['plans', 'list']` (낙관적 업데이트 후 서버 확인) |
| 카테고리 수정/삭제 | `['categories']`, `['plans', 'list']` (category 변경 반영) |
| 아바타 업로드 | `['profile']` |

**낙관적 업데이트 적용:**
- `useCompletePlan`: 체크박스 클릭 즉시 `isCompleted` 반전 → 서버 실패 시 `onError`에서 롤백
- `useDeletePlan`: 삭제 즉시 목록에서 제거 → 서버 실패 시 롤백 [AI 제안안]

### 4-2. 클라이언트 상태 — Zustand

**`authStore.ts`**

```
{
  user: User | null,
  accessToken: string | null,
  isAuthenticated: boolean,
  setAuth(user, accessToken): void,
  clearAuth(): void
}
```

**`calendarStore.ts`**

```
{
  selectedMonth: string,        // 'YYYY-MM' 형식
  selectedDate: string | null,  // 'YYYY-MM-DD' 또는 null
  expandedWeekDay: string | null, // 주간 바 확장 요일
  setSelectedMonth(month): void,
  setSelectedDate(date): void,
  setExpandedWeekDay(day): void
}
```

**`planStore.ts`**

**[FE-12] planDetailId URL SSoT 정책 확정:**
- `planDetailId`는 URL `?planId`에서 `useSearchParams`로 파생하는 단일 진실 공급원(SSoT).
- Zustand `planStore`에 `planDetailId` 필드를 저장하지 않음.
- `openDetailModal(id)`은 `navigate({ search: '?planId=id' })` 호출만 수행.
- 모달 닫기는 `setSearchParams({})` 로 `?planId` 제거.
- `isDetailModalOpen`은 `useSearchParams`에서 planId 존재 여부로 파생 (별도 Zustand 상태 불필요).

```
{
  // planDetailId 필드 없음 — URL ?planId가 SSoT (FE-12)
  searchKeyword: string,
  filters: {
    categories: number[],       // OR 조건
    priority: string[],         // OR 조건 (다중 선택 가능)
    completed: '0' | '1' | null // 단일 선택
    uncategorized: boolean,     // 미분류 필터 (DB-07)
  },
  openDetailModal(id): void,    // navigate({ search: '?planId=id' }) 호출
  closeDetailModal(): void,     // setSearchParams({}) 호출
  setSearchKeyword(keyword): void,
  setFilters(filters): void,
  resetFilters(): void
}
```

**[FE-10] 수정 모드 display_date 자동 연동 정책 확정:**
- **등록 모드(PlanCreatePage)**: `due_date` 변경 시 `display_date` 자동으로 동일 날짜로 연동 (K-10=B).
- **수정 모드(PlanDetailModal 편집 모드)**: `due_date` 변경 시 `display_date` 자동 연동 없음. 기존 값 유지.
- 수정 모드에서 사용자가 명시적으로 `display_date` 필드를 변경했을 때만 적용.
- 사유: 사용자가 수정 전 의도적으로 설정한 display_date가 덮어써지는 UX 문제 방지.

### 4-3. 폼 상태 — React Hook Form

- `useForm<T>()` + `zodResolver(Schema)` 조합으로 각 폼 컴포넌트에서 독립 사용
- `mode: 'onBlur'`: 필드에서 포커스 이탈 시 즉시 검증
- 서버 422 응답 수신 시 `setError('fieldName', { message })` 로 인라인 에러 주입

---

## 5. API 호출 위치 규칙

[AI 제안안] 계층 분리 원칙 — 컴포넌트는 훅만 호출, 훅은 API 함수만 호출

```
Component
  └── usePlansMutation()  (features/plans/hooks/)
        └── createPlan()  (features/plans/api/createPlan.ts)
              └── httpClient.post('/plans', data)  (lib/api/httpClient.ts)
```

- API 함수 파일: `features/<domain>/api/<action>.ts` — axios 호출 + 응답 타입 반환
- 훅 파일: `features/<domain>/hooks/use<Action>.ts` — `useMutation` / `useQuery` 래핑
- 컴포넌트: 훅 반환값만 사용, axios 직접 호출 금지

### 5-1. httpClient.ts 역할

`src/lib/api/httpClient.ts` 에서 처리:

1. `baseURL`: 환경변수 `VITE_API_BASE_URL` (기본: `http://localhost:4000/api/v1`)
2. **요청 인터셉터:** `authStore.accessToken` → `Authorization: Bearer <token>` 헤더 자동 삽입
3. **응답 인터셉터 (401 처리):**
   - 401 수신 → `POST /auth/refresh` 호출
   - Refresh 성공 → 새 Access Token으로 원 요청 재시도
   - Refresh 실패 → `authStore.clearAuth()` + `/login` 리다이렉트
4. **요청 큐잉:** Refresh 중복 호출 방지 — 진행 중인 Refresh Promise를 큐에서 공유 [AI 제안안]

---

## 6. 폼 검증 방식

[PRD 확정] PRD §34, §26

### 6-1. 검증 레이어

| 레이어 | 타이밍 | 도구 |
|---|---|---|
| 클라이언트 즉시 | 필드 blur / 제출 시 | React Hook Form + Zod |
| 서버 재검증 | API 요청 처리 시 | Express + Zod |
| 서버 오류 반영 | 422 응답 수신 후 | `setError()` 로 인라인 표시 |

### 6-2. 폼별 Zod 스키마 위치

| 스키마 파일 | 대상 폼 | 주요 규칙 |
|---|---|---|
| `auth/schemas/login.schema.ts` | LoginForm | email 형식, password 비어있지 않음 |
| `auth/schemas/register.schema.ts` | RegisterForm | email RFC, password 영문+숫자 8~72자, nickname 2~20자, passwordConfirm 일치 |
| `plans/schemas/plan.schema.ts` | PlanForm (생성/수정) | title 1~100자, due_date YYYY-MM-DD, display_date 필수, priority enum, memo 0~500자 |
| `categories/schemas/category.schema.ts` | CategoryFormModal | name 1~30자, color #RRGGBB 정규식 |
| `profile/schemas/profile.schema.ts` | ProfileForm | nickname 2~20자 |
| `profile/schemas/password.schema.ts` | PasswordForm | newPassword 영문+숫자 8~72자, newPasswordConfirm 일치 |

### 6-3. 오류 표시 방식

- 인라인 오류: 각 `<Input>` 컴포넌트 하단에 `<p className="text-error text-sm">{error.message}</p>`
- 서버 에러 (401/403/404/500): `<Toast>` 알림 (3초 자동 닫기, 상단 우측)
- 이메일 중복 (409): `setError('email', ...)` 로 이메일 필드 인라인 오류

---

## 7. 디자인 시스템 적용

[PRD 확정] PRD §14, K-03=A; design-reference.md Serene Productivity 테마

### 7-1. Tailwind 색상 토큰 매핑 (`tailwind.config.ts`)

| 토큰명 | HEX | 용도 |
|---|---|---|
| `charcoal` | `#21201a` | 주 색상, FAB, Primary 버튼, 주 텍스트 |
| `surface` | `#f9f9f7` | 페이지 배경 |
| `container` | `#eeeeec` | 카드·컨테이너 배경 |
| `on-surface` | `#1a1c1b` | 주 텍스트 |
| `outline` | `#7a776e` | 보조 텍스트, 비활성 아이콘, 완료 텍스트 |
| `error` | `#ba1a1a` | 오류 텍스트·테두리 |
| `soft-border` | `#e5e7eb` | 카드·인풋 테두리 |
| `surface-container-low` | `#f4f4f2` | 호버 배경 |

### 7-2. 카테고리 색상 토큰 (K-03=A)

[PRD 확정] PRD §14-2

| 토큰명 | HEX | 카테고리 |
|---|---|---|
| `category-meeting` | `#7C3AED` | 미팅 (보라) |
| `category-assignment` | `#2563EB` | 과제 (파랑) |
| `category-exam` | `#DC2626` | 시험 (빨강) |
| `category-personal` | `#16A34A` | 개인 일정 (초록) |
| `category-appointment` | `#EA580C` | 약속 (주황) |

사용자 추가 카테고리는 `category.color` HEX 값을 인라인 스타일(`style={{ backgroundColor: color }}`)로 적용.

### 7-3. 중요도 칩 색상 토큰

[AI 제안안] PRD §14-5, §31-2

| 중요도 | 칩 배경 | 텍스트 색상 |
|---|---|---|
| 높음 (high) | `#FEE2E2` | `#DC2626` |
| 보통 (normal) | `#FEF9C3` | `#B45309` |
| 낮음 (low) | `#DCFCE7` | `#16A34A` |

### 7-4. 타이포그래피 클래스 정의

[PRD 확정] PRD §14-3

| 역할 | Tailwind 클래스 예시 |
|---|---|
| h1 | `text-[32px] font-bold tracking-tight` |
| h2 | `text-[24px] font-semibold tracking-tight` |
| h3 | `text-[18px] font-semibold` |
| body-lg | `text-base font-normal leading-relaxed` |
| body-md | `text-sm font-normal leading-normal` |
| label-md | `text-sm font-medium tracking-wide` |
| label-sm | `text-xs font-medium tracking-wider` |

### 7-5. 컴포넌트 스타일 규칙

[PRD 확정] PRD §14-5

| 컴포넌트 | 스타일 규칙 |
|---|---|
| Primary 버튼 | `bg-charcoal text-white py-2 px-3 rounded` |
| Ghost 버튼 | `border border-charcoal text-charcoal bg-transparent py-2 px-3 rounded` |
| 인풋 필드 | `border border-soft-border rounded focus:border-charcoal outline-none` |
| 체크박스 | `w-4 h-4 rounded-[4px] checked:bg-charcoal` |
| 카드 | `border border-soft-border rounded-lg bg-white` |
| 칩 | `bg-[#f7f7f5] text-outline text-sm font-medium px-2 py-0.5 rounded-full` |
| FAB | `bg-charcoal text-white w-14 h-14 rounded-full shadow-md` |
| 모달 | `rounded-lg bg-white shadow-sm max-w-[480px] w-full` |

다크 모드: 미지원 (현 버전). [PRD 확정]

---

## 8. 도메인 타입 정의

`src/types/domain.ts`

```typescript
// 이하는 타입 구조 의사 정의 — 실제 .ts 구현 코드 아님

type Priority = 'high' | 'normal' | 'low'

type Category = {
  id: number
  userId: number
  name: string
  color: string        // HEX '#RRGGBB'
  sortOrder: number
  createdAt: string
  updatedAt: string
}

type Plan = {
  id: number
  userId: number
  title: string
  dueDate: string      // 'YYYY-MM-DD'
  dueTime: string | null  // 'HH:mm' 또는 null
  displayDate: string  // 'YYYY-MM-DD'
  categoryId: number | null
  category: Pick<Category, 'id' | 'name' | 'color'> | null
  priority: Priority
  memo: string | null
  isCompleted: boolean
  isRemind: boolean
  createdAt: string
  updatedAt: string
}

type User = {
  id: number
  email: string
  nickname: string
  avatarUrl: string | null
  createdAt: string
}
```

`src/types/api.ts`

```typescript
// 의사 정의

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  error: {
    code: string
    message: string
    details?: Array<{ field: string; message: string }>
  }
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
```

---

## 9. 테스트 전략

[PRD 확정] PRD §6

### 9-1. 단위 테스트 (Vitest + RTL)

| 대상 | 테스트 파일 위치 | 주요 시나리오 |
|---|---|---|
| `LoginForm` | `features/auth/components/__tests__/LoginForm.test.tsx` | 빈 폼 제출, 잘못된 이메일 형식, 성공 제출 |
| `usePlans` | `features/plans/hooks/__tests__/usePlans.test.ts` | 로딩·성공·에러 상태 |
| `useCompletePlan` | `features/plans/hooks/__tests__/useCompletePlan.test.ts` | 낙관적 업데이트, 실패 롤백 |
| `ddayCalc.ts` | `lib/date/__tests__/ddayCalc.test.ts` | D-Day / D-1 / D-3 / 마감지남 계산 |
| `formatters.ts` | `lib/date/__tests__/formatters.test.ts` | KST 날짜 포맷 변환 |

### 9-2. 통합 테스트 (Vitest + RTL + MSW)

| 대상 | 시나리오 |
|---|---|
| `LoginPage` | 로그인 성공 → `/` 리다이렉트, 실패 → 오류 메시지 |
| `MainPage` | 오늘 할 일 목록 렌더링, 체크박스 토글 |
| `PlanCreatePage` | 폼 검증 오류 표시, 저장 확인 모달 |
| `ProfilePage` | 카테고리 추가 → 목록 갱신 |

MSW 핸들러 위치: `src/mocks/handlers/`

### 9-3. E2E 테스트 (Playwright)

주요 시나리오:
1. 회원가입 → 로그인 → 메인 진입
2. 일정 등록 → 오늘 할 일 목록에서 확인
3. 일정 완료 처리 → 중간줄+회색 표시 확인
4. 일정 삭제 → 목록에서 사라짐 확인
5. 로그아웃 → 메인 접근 → 로그인 리다이렉트

Playwright 설정 위치: `playwright.config.ts` (루트)

---

## 10. 접근성 및 반응형

### 10-1. 접근성

[AI 제안안]

- 키보드 네비게이션: 모든 인터랙티브 요소 `Tab` 포커스 가능
- ARIA 레이블: `<input aria-label="이메일">`, 모달 `role="dialog" aria-modal="true"`
- 색상 대비: 주 텍스트(`#21201a`) vs 배경(`#f9f9f7`) → 대비비 4.5:1 이상 유지
- 체크박스: 스크린 리더용 `<label>` 연결 필수
- 토스트: `role="alert"` 으로 스크린 리더 즉시 읽기

### 10-2. 반응형

[확인 필요] PRD §40에 반응형 지원 범위 미확정. 현재 PC 브라우저 기준으로 개발.
- 컨테이너 최대 너비: `800px` (중앙 정렬)
- 모바일 대응 여부: 별도 확인 후 결정

---

## 11. 환경 변수

`frontend/.env.development`

| 변수명 | 예시 값 | 설명 |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` | 백엔드 API 기본 URL |
