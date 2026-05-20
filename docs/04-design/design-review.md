# PlanMate 상세 설계 검토 보고서

> 작성일: 2026-05-20
> 검토 대상: `docs/03-prd/prd.md` + `docs/04-design/` 6개 문서
> 검토 방식: 3명의 독립 검토자가 서로 다른 관점에서 검토 후 통합
> 검토 기준: PRD(v1.0) 및 사용자 결정 K-01~K-10

---

## 📊 메타 요약

### 검토자 구성

| 검토자 | 관점 | 검토 문서 |
|---|---|---|
| Agent 1 | 프론트엔드 | frontend-spec.md, screen-flow.md, wireframe-spec.md |
| Agent 2 | 백엔드/API | api-spec.md, backend-spec.md |
| Agent 3 | DB/시스템 규칙 | data-model.md (+ api-spec.md, backend-spec.md 참조) |

### 발견 사항 분포

| 검토자 | 발견 수 | 높음 | 보통 | 낮음 | 개발 전 필수 수정 |
|---|---|---|---|---|---|
| FE (Agent 1) | 13 | 4 | 6 | 3 | 9 |
| BE (Agent 2) | 13 | 4 | 6 | 3 | 6 |
| DB (Agent 3) | 14 | 4 | 7 | 3 | 7 |
| **합계** | **40** | **12** | **19** | **9** | **22** |

### 개발 착수 전 반드시 해소해야 할 핵심 이슈 (Top 10)

| 우선순위 | ID | 카테고리 | 핵심 이슈 |
|---|---|---|---|
| 🔴 즉시 | DB-01 | 인프라 | SQLite `PRAGMA foreign_keys = ON` 미명시 → K-09 SET NULL 무력화 |
| 🔴 즉시 | DB-02 | 데이터 정합성 | `CURRENT_TIMESTAMP`는 UTC → KST 저장 정책과 충돌 |
| 🔴 즉시 | DB-14 | Prisma | `String @default(now())` + `@updatedAt` 자동 갱신 미보장 |
| 🔴 즉시 | BE-01 | 보안 | 로그아웃 시 Refresh Token 서버 측 무효화 수단 없음 |
| 🔴 즉시 | BE-02 | 보안 | Token Rotation DB 저장 정책 미결 |
| 🔴 즉시 | BE-12 | 인증 | Refresh Token 쿠키 `Path` 설정으로 인한 로그아웃 동작 불일치 |
| 🟡 높음 | BE-05 | 스키마 | Prisma `onDelete` 명시 부재 — 카테고리 삭제 동작 분기 |
| 🟡 높음 | FE-02 | UI | 필터 칩 컴포넌트가 와이어프레임에 부재 |
| 🟡 높음 | FE-03 | UX | 검색 결과 표시 영역 미확정 (PRD §30-1 D-11) |
| 🟡 높음 | FE-07 | UI | 캘린더 날짜 셀 클릭 시 미니 팝업 와이어프레임 부재 |

### 관점 간 공통 이슈 (3개 검토자 모두 지적)

- **K-09 카테고리 삭제 정책의 구현 일관성**: FE(미분류 표시), BE(Prisma onDelete vs 트랜잭션), DB(FK pragma + 트랜잭션 순서)가 한 줄로 연결되어야 함 → DB-01, BE-05, DB-09, FE 의견 종합 필요
- **HTTP 메서드 PUT vs PATCH 혼란**: 카테고리 수정은 PUT, 일정 수정은 PATCH → FE-01, BE-09 동시 지적
- **검색·필터 규칙의 미완결성**: 검색 결과 범위·미분류 필터·LIKE 한국어 처리 → FE-03, BE-03, DB-06, DB-07

### 권장 조치 흐름

1. **48시간 내**: 위 "Top 10" 이슈에 대한 결정 및 PRD/설계 문서 패치
2. **개발 착수 전**: "개발 전 필수 수정" 22개 모두 해소
3. **개발 중 가능**: 우선순위 "낮음" 9개는 구현 단계에서 fallback 결정 허용

---

## 1. 프론트엔드 관점 검토 (Agent 1)

> 검토 파일: frontend-spec.md, screen-flow.md, wireframe-spec.md
> 검토자: Agent 1 (프론트엔드)

### 1.1 종합 평가

세 문서는 전반적으로 PRD와의 정합성이 높으며, K-결정 사항(K-04 정렬, K-05 섹션 순서, K-07 알림 UI만, K-08 모달+쿼리 파라미터, K-10 display_date)을 일관되게 반영하고 있다. 컴포넌트 트리, 라우팅, 상태 관리, API 호출 계층 분리 등 핵심 아키텍처 결정이 코딩 가능한 수준으로 명세되어 있고, 로딩·에러·빈 상태의 UI 표현도 와이어프레임에 대부분 포함되어 있다. 다만 검색 결과 표시 영역 미확정, 카테고리 수정 API 메서드 불일치(PUT vs PATCH), 필터 UI 컴포넌트 누락, D-Day 배지 조건 범위 부재 등 개발 전 반드시 해소해야 할 미확정·불일치 사항이 산재해 있어 그대로 착수하면 구현 중 판단을 강요받는 지점이 생긴다.

**주요 강점:**
- screen-flow.md가 로그아웃·토큰 만료·네트워크 오류까지 포함하여 예외 시나리오를 체계적으로 정리했다.
- wireframe-spec.md §9에 모달별 오버레이 클릭 닫기 정책 표를 별도 제공해 모달 동작 일관성을 확보했다.
- frontend-spec.md §5의 API 호출 계층 분리(컴포넌트 → 훅 → API 함수 → httpClient)가 명확하여 개발 패턴을 바로 따를 수 있다.

**주요 우려:**
- 필터 UI 컴포넌트(카테고리·중요도·완료 여부 칩)가 세 문서 어디에도 와이어프레임으로 구체화되지 않았다.
- 카테고리 수정 API가 frontend-spec.md에서는 `PATCH`로, PRD·screen-flow에서는 `PUT`으로 혼재되어 있다.
- 검색 결과 표시 영역이 PRD §30-1 D-11에서 미확정으로 남아 있고, screen-flow·wireframe도 동일하게 미확정 표기에 머물러 개발 착수 전 결정이 필요하다.

### 1.2 발견 사항

#### FE-01. 카테고리 수정 API 메서드 불일치 (PUT vs PATCH)
- 검토 관점: 프론트엔드 (frontend-spec.md line 103 `updateCategory.ts` 주석, screen-flow.md §10-5 line 322)
- 문제: frontend-spec.md 폴더 구조의 `updateCategory.ts` 파일명 주석에는 메서드가 명시되지 않았으나, screen-flow.md §10-5 "저장 → `PUT /api/v1/categories/:id`"로 명시되어 있다. 반면 PRD §20-3 카테고리 API 표(C-03)도 `PUT`을 사용하므로 PRD와 screen-flow는 일치하지만, frontend-spec.md §3-5 컴포넌트 트리와 API 훅 네이밍은 `useUpdateCategory`로 통일되어 있어 내부적으로는 PATCH 의미로 혼용될 가능성이 있다.
- 이유: REST 관례상 PUT은 전체 교체, PATCH는 부분 수정이다. PRD P-04(일정 수정)는 PATCH인데 카테고리 수정만 PUT이면 클라이언트 개발자가 혼동하거나 요청 바디 구성 방식이 달라진다.
- 수정 제안: frontend-spec.md §3-5의 `useUpdateCategory`와 `updateCategory.ts` 파일의 API 명세 주석에 `PUT /api/v1/categories/:id`임을 명시하고, 요청 바디가 name·color·sort_order 전체를 포함해야 하는지 부분 포함 가능한지를 PRD §20-3 C-03과 함께 한 곳에서 확정할 것.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### FE-02. 필터 UI 컴포넌트가 세 문서 어디에도 와이어프레임으로 구체화되지 않음
- 검토 관점: 프론트엔드 (wireframe-spec.md 전체, screen-flow.md §9, frontend-spec.md §3-3)
- 문제: screen-flow.md §9(필터 흐름)는 "카테고리·중요도·완료 여부 필터 칩 선택"이라고 서술하지만, wireframe-spec.md §3(메인 페이지)에는 필터 칩의 위치·형태·초기화 버튼·선택 상태 표시가 전혀 포함되지 않았다. frontend-spec.md §3-3 컴포넌트 트리에도 필터 관련 컴포넌트가 없다.
- 이유: 필터가 헤더에 있는지, 캘린더 아래인지, 오늘 할 일 섹션 위인지 결정되지 않으면 레이아웃 구성과 Zustand planStore의 filters 상태 연동 컴포넌트를 특정할 수 없다.
- 수정 제안: wireframe-spec.md §3에 필터 칩 그룹(카테고리 다중 선택, 중요도 다중 선택, 완료 여부 단일 선택, 초기화 버튼) 위치와 선택/미선택 상태를 ASCII 와이어프레임으로 추가하고, frontend-spec.md §3-3 컴포넌트 트리에 `<PlanFilterBar />` 컴포넌트를 삽입할 것.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### FE-03. 검색 결과 표시 영역 미확정으로 구현 불가
- 검토 관점: 프론트엔드 (screen-flow.md §8 line 249, wireframe-spec.md §3 "검색 결과 없음 상태")
- 문제: screen-flow.md §8 step 5에 "결과 표시: title/memo에 keyword 포함된 일정만 표시"라고만 서술되어 있고, 하단에 "[확인 필요] 검색 결과 표시 영역 — 오늘 할 일 영역만 필터링할지 전체 일정 표시 별도 영역을 사용할지 PRD §30-1 D-11에서 미확정"이라고 표기되어 있다. wireframe-spec.md §3도 "검색 결과 없음" 메시지만 있고 결과가 어느 영역에 출력되는지 지정하지 않았다.
- 이유: 검색 결과가 "오늘 할 일 영역 내 필터링"이면 기존 TodayPlanList 컴포넌트에 조건만 추가하면 되지만, "별도 검색 결과 영역"이면 새 컴포넌트와 다른 queryKey 구조가 필요하다. 구현 방향이 정반대다.
- 수정 제안: PRD D-11 미확정 항목을 팀 결정으로 확정한 뒤 screen-flow.md §8과 wireframe-spec.md §3에 결과 영역 위치를 명시할 것. 권장안은 별도 전체 일정 목록 영역(캘린더 숨김, 주간 바 숨김, 검색 결과만 표시)이다.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### FE-04. K-04 정렬 4순위(created_at) 클라이언트 구현 방식 미명세
- 검토 관점: 프론트엔드 (frontend-spec.md §4-1, screen-flow.md §2 line 118)
- 문제: screen-flow.md §2 step 8은 "완료 미완료 우선 → 중요도(high→normal→low) → due_time 빠른 순 (K-04=A)"까지만 기술한다. PRD §22-2는 4순위로 `created_at 오래된 순`을 명시하지만, screen-flow.md와 frontend-spec.md 어디에도 4순위 기준이 언급되지 않는다. 또한 정렬이 서버에서 이루어지는지(API 응답 순서) 클라이언트에서 이루어지는지 명세되지 않았다.
- 이유: 서버 정렬과 클라이언트 정렬이 혼재하면 캐시 무효화 없이 낙관적 업데이트(완료 토글) 후 재정렬 로직을 클라이언트에서 독자적으로 구현해야 하는 복잡도가 생긴다.
- 수정 제안: frontend-spec.md §4-1 또는 §5에 "정렬은 API 응답 데이터를 클라이언트에서 수행(usePlans 훅 내 sort 함수)" 또는 "서버 ORDER BY로 처리"를 명시하고, 4순위 created_at을 screen-flow.md §2에 추가할 것.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예

#### FE-05. D-Day 배지 조건 표에 diff == 2 케이스가 "날짜 표시"인데 diff >= 4도 동일 처리인지 불명확
- 검토 관점: 프론트엔드 (wireframe-spec.md §10 D-Day 배지 표, frontend-spec.md §8 Plan 타입)
- 문제: wireframe-spec.md §10 표에는 "diff == 2 또는 diff >= 4 → YYYY.MM.DD, 배지 없음"으로 기술되어 있다. 그러나 diff == 1은 "D-1", diff == 3은 "D-3"인데 diff == 2는 D-2 표시 없이 날짜만 표시하는 이유가 설명되지 않았다. 또한 diff가 매우 큰 경우(diff > 30 등) 동일하게 날짜 문자열만 표시하는지 확인 불가하다.
- 이유: ddayCalc.ts 구현 시 조건 분기가 `[0, 1, 3, <0]` 네 가지만 처리하면 되고 2와 4 이상은 같은 분기이지만, 코드 리뷰 없이는 `diff == 2`를 별도 분기로 실수 처리할 수 있다.
- 수정 제안: wireframe-spec.md §10에 "D-2는 PRD 의도적 제외 — YYYY.MM.DD 표시"임을 주석으로 명시하고, ddayCalc.ts 단위 테스트 목록(frontend-spec.md §9-1)에 diff==2 케이스를 명시적으로 추가할 것.
- 우선순위: 낮음
- 개발 전 반드시 수정해야 하는지 여부: 아니오

#### FE-06. PlanCreatePage 뒤로가기(←) 동작이 취소 확인 모달을 트리거해야 하는지 미명세
- 검토 관점: 프론트엔드 (wireframe-spec.md §4 line 312, screen-flow.md §3 "취소 흐름")
- 문제: wireframe-spec.md §4에 "← 뒤로가기 버튼"이 헤더에 표시되고, screen-flow.md §3 취소 흐름은 "취소 버튼 클릭 → 취소 확인 모달"을 명세하지만, 뒤로가기(←) 아이콘 클릭 시 동일하게 취소 확인 모달을 트리거하는지, 아니면 곧바로 navigate(-1)하는지 정의되지 않았다. 또한 브라우저 백 버튼(popstate 이벤트) 처리도 미명세이다.
- 이유: 폼 입력 중 뒤로가기를 누르면 입력 내용이 소실될 수 있으므로, UX 일관성을 위해 `beforeunload` 또는 `useBlocker`(React Router v6) 처리 여부를 명세해야 한다.
- 수정 제안: screen-flow.md §3에 "헤더 ← 클릭 = 취소 버튼과 동일하게 취소 확인 모달 트리거"를 명시하고, frontend-spec.md §3-4에 `useBlocker` 사용 여부를 기술할 것.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예

#### FE-07. 캘린더 날짜 셀 클릭 시 "미니 팝업" 컴포넌트가 wireframe에 없음
- 검토 관점: 프론트엔드 (screen-flow.md §14 line 422, wireframe-spec.md §3, frontend-spec.md §3-3)
- 문제: screen-flow.md §14 step 5에 "날짜 셀 클릭 → 해당 날짜의 일정 목록 미니 팝업 표시 [AI 제안안]"이라고 명시되어 있으나, wireframe-spec.md §3 메인 페이지 와이어프레임에는 이 미니 팝업의 형태, 위치(셀 아래 또는 모달), 포함 정보, 닫기 방식이 전혀 묘사되지 않았다. frontend-spec.md §3-3 컴포넌트 트리에도 관련 컴포넌트가 없다.
- 이유: 미니 팝업이 없으면 캘린더 날짜 클릭 → 상세 모달 진입 경로(PRD §27-1)가 구현 불가능하다. 팝업 컴포넌트는 z-index, 위치 계산(포퍼), 외부 클릭 닫기 등 비자명한 구현이 필요하다.
- 수정 제안: wireframe-spec.md §3에 캘린더 날짜 셀 클릭 시 미니 팝업 와이어프레임을 추가(팝업 위치·크기·일정 목록 항목·닫기 방식)하고, frontend-spec.md §3-3에 `<CalendarDayPopup />` 컴포넌트를 CalendarCell 하위로 추가할 것.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### FE-08. 반응형 정책이 "확인 필요"로 미결이어서 FAB 위치·캘린더 레이아웃 등 구현 판단 근거 없음
- 검토 관점: 프론트엔드 (frontend-spec.md §10-2 line 632, wireframe-spec.md §11)
- 문제: frontend-spec.md §10-2와 wireframe-spec.md §11이 동일하게 "PRD §40 반응형 지원 범위 미확정, 팀 확인 후 결정"으로 기술되어 있다. FAB는 `fixed bottom-6 right-6`인데 모바일 뷰포트에서는 소프트 키보드 위에 가려질 수 있고, 800px 미만 뷰포트에서 6×7 캘린더 격자의 셀 크기가 32px 이하로 터치 불가 영역이 된다.
- 이유: "PC 브라우저 기준 개발"이라고 명시했어도 최소 지원 해상도(예: 1024px 이상인지 1280px 이상인지)를 정해야 CSS 미디어 쿼리 브레이크포인트, Tailwind config, 테스트 뷰포트 설정이 가능하다.
- 수정 제안: frontend-spec.md §10-2에 "최소 지원 뷰포트 너비 1024px, 그 이하는 미지원(레이아웃 보장 안 함)"처럼 최소값을 확정하여 명시할 것. 모바일 지원 결정 전까지는 `min-width: 1024px`인 `<meta>` viewport 스케일 제한을 wireframe §11에 기술할 것.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 아니오

#### FE-09. 비밀번호 찾기 링크 처리 정책이 와이어프레임과 PRD 간 불일치
- 검토 관점: 프론트엔드 (wireframe-spec.md §1 line 72, PRD §13-1)
- 문제: wireframe-spec.md §1 컴포넌트 명세에 "비밀번호 찾기: [확인 필요] — PRD §37에 초기 버전 미구현으로 표기. 링크 비활성 또는 미표시 결정 필요."라고 기술되어 있다. PRD §13-1은 "링크: 비밀번호 찾기 | 회원가입"으로 표시하도록 명세하지만 구현 여부는 미결이다. frontend-spec.md §3-1 컴포넌트 트리에는 `<Link to="/auth">회원가입</Link>`만 있고 비밀번호 찾기 링크는 없다.
- 이유: 미구현 링크를 클릭 가능하게 두면 사용자가 빈 페이지나 404에 도달한다. 링크 비활성(disabled) vs 미표시 중 결정하지 않으면 LoginForm 구현이 완결되지 않는다.
- 수정 제안: wireframe-spec.md §1과 frontend-spec.md §3-1에 "초기 버전에서는 비밀번호 찾기 링크 미표시(hidden)"로 명확히 확정할 것. 향후 구현 예정이면 TODO 주석으로 남기는 방식을 명세에 기술할 것.
- 우선순위: 낮음
- 개발 전 반드시 수정해야 하는지 여부: 아니오

#### FE-10. 일정 상세 모달 편집 모드에서 display_date 변경 시 due_date 자동 연동 여부 미명세
- 검토 관점: 프론트엔드 (wireframe-spec.md §5 편집 모드, frontend-spec.md §3-3, screen-flow.md §5)
- 문제: PRD §26-4와 screen-flow.md §3 step 3에는 "일정 등록(PlanCreatePage)에서 마감일 선택 시 display_date 자동 설정(K-10)"이 명시되어 있다. 그러나 일정 수정(PlanDetailModal 편집 모드)에서 due_date를 변경할 때 display_date도 자동 연동되는지, 아니면 기존 display_date를 유지하는지 screen-flow.md §5나 wireframe-spec.md §5 어디에도 기술되어 있지 않다.
- 이유: 수정 시 자동 연동이 되면 사용자가 의도적으로 다르게 설정한 display_date가 덮어써지는 UX 문제가 생기고, 반대로 연동이 안 되면 등록 폼과 동작이 달라져 사용자가 혼란스럽다.
- 수정 제안: screen-flow.md §5에 "수정 모드에서는 due_date 변경 시 display_date 자동 연동 없음(기존 값 유지)"을 명시하고, wireframe-spec.md §5 편집 모드 컴포넌트 명세에 이를 보조 텍스트로 추가할 것.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예

#### FE-11. 주간 바 확장 카드에 연필 아이콘(수정 직접 진입) 명세가 PRD와 불일치
- 검토 관점: 프론트엔드 (wireframe-spec.md §3 주간 바 확장 목록 카드, PRD §24-3)
- 문제: PRD §24-3 "확장 시 표시 정보: 일정 카드 (제목+카테고리 칩+시간+중요도 칩+연필 아이콘)"에서 연필 아이콘이 명시되어 있다. 그러나 wireframe-spec.md §3의 주간 바 확장 카드 예시 `{ 영상처리 과제 } [과제] 🕐23:59 [높음]`에는 연필 아이콘이 없다. screen-flow.md §4-1에는 "주간 바 확장 목록 카드 클릭 → navigate('/?planId=<id>')"로만 기술되어 카드 전체 클릭이 상세 모달 진입이고, 별도 연필 아이콘은 연결되지 않는다.
- 이유: 연필 아이콘이 카드 상세 진입과 별도로 수정 모드 직접 진입을 뜻하는지, 아니면 PRD 기술 오류인지 불명확하다. WeeklyPlanBar 컴포넌트 구현 시 인터랙션 설계가 달라진다.
- 수정 제안: wireframe-spec.md §3 주간 바 확장 카드 명세를 PRD §24-3에 맞춰 연필 아이콘을 추가하거나, PRD §24-3의 연필 아이콘 기술이 오류라면 PRD를 정정하고 screen-flow.md §15에 "카드 전체 클릭 = 상세 모달 진입"으로 명확히 통일할 것.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예

#### FE-12. Zustand planStore의 planDetailId와 URL ?planId의 동기화 시점·방향이 불명확
- 검토 관점: 프론트엔드 (frontend-spec.md §4-2 planStore 정의, screen-flow.md §4-2)
- 문제: frontend-spec.md §4-2에서 `planStore.planDetailId`는 "?planId=X URL 동기화"라고 주석이 있고, screen-flow.md §4-2에서는 `useSearchParams`로 planId를 감지하여 모달을 오픈한다고 기술되어 있다. 그런데 `planStore.openDetailModal(id)`을 호출하면 URL도 함께 바뀌는지, 아니면 URL 변경(`navigate`)이 먼저이고 planStore는 URL에서 파생하는지 명세가 없다.
- 이유: 단방향 동기화 방향이 확정되지 않으면 URL에서 planId를 읽어 Zustand에 동기화하는 useEffect와 Zustand를 직접 set하는 openDetailModal이 중복 상태가 되어 버그가 생긴다. 일반적으로 URL이 source-of-truth가 되어야 하고 Zustand planDetailId는 제거하거나 파생 상태로 처리해야 한다.
- 수정 제안: frontend-spec.md §4-2에 "planDetailId는 URL ?planId에서 useSearchParams로 파생하며, Zustand planStore에 별도 저장하지 않는다. openDetailModal(id)은 navigate('/?planId=id')를 호출한다"고 명확히 정의하고, planStore에서 planDetailId 필드를 제거하거나 "URL 파생, Zustand 미사용" 주석을 달 것.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### FE-13. 토스트 성공 색상 토큰이 design-reference 매핑 없이 "[AI 제안안]"으로만 처리됨
- 검토 관점: 프론트엔드 (wireframe-spec.md §9-3 line 699, frontend-spec.md §7-1 색상 토큰 표)
- 문제: wireframe-spec.md §9-3 토스트 알림 동작에서 "성공: 초록 계열 배경 [AI 제안안]"이라고 기술되어 있으나, frontend-spec.md §7-1 Tailwind 색상 토큰 표에는 성공(success) 색상 토큰이 없다. 오류는 `error #ba1a1a`가 정의되어 있지만 성공 색상에 해당하는 토큰명과 HEX 값이 없어 개발자가 임의로 초록 계열 색상을 선택하게 된다.
- 이유: 성공 토스트 색상이 카테고리 색상(개인 일정 `#16A34A`)과 동일해도 되는지, 별도 semantic 토큰이 필요한지 결정되지 않으면 디자인 일관성이 깨진다.
- 수정 제안: frontend-spec.md §7-1 색상 토큰 표에 `success` 토큰(예: `#16A34A` 또는 Tailwind `green-600`)을 추가하고, wireframe-spec.md §9-3의 "[AI 제안안]"을 확정 토큰명으로 교체할 것.
- 우선순위: 낮음
- 개발 전 반드시 수정해야 하는지 여부: 아니오

---

## 2. 백엔드/API 관점 검토 (Agent 2)

> 검토 파일: api-spec.md, backend-spec.md
> 검토자: Agent 2 (백엔드/API)

### 2.1 종합 평가

전체적으로 Node.js + Express + Prisma + SQLite 스택으로 구현 직접 착수할 수 있는 수준의 설계가 갖춰져 있다. 4계층 아키텍처, 에러 클래스 계층, 트랜잭션 위치, Soft Delete 전략, 5색 HEX 상수까지 명시된 점은 주요 강점이다. 다만 Token Rotation 시 DB 저장 전략 미결, 로그아웃의 Refresh Token 무효화 방법 불분명, `GET /plans` 정렬 키 미명시, `category` 필터의 다중 값 파싱 방법 불명확 등 구현 시 팀 내 재논의가 필요한 공백이 남아 있다. 보안·데이터 무결성 관련 이슈가 일부 포함되어 있으므로 개발 착수 전 확인이 필요하다.

**주요 강점**
1. 공통 에러 포맷(`success / error.code / error.message / details`), HTTP 상태 코드 규칙, AppError 계층이 일관되게 정의되어 있어 에러 처리 표준화가 용이하다.
2. 기본 카테고리 5개의 이름·HEX 색상·sort_order가 backend-spec.md §8-1에 명시되어 시드 구현 시 별도 확인 없이 그대로 코딩 가능하다.
3. Prisma 트랜잭션 사용 위치(회원가입, 카테고리 삭제) 및 Soft Delete 필터 전략(명시적 `deletedAt: null`)이 구체적으로 기술되어 있다.

**주요 우려**
1. 로그아웃 시 Refresh Token의 서버 측 무효화 수단(블랙리스트/DB 컬럼 등)이 정의되지 않아, 쿠키 삭제만으로는 탈취된 토큰을 무효화할 수 없는 보안 공백이 있다.
2. Token Rotation을 [AI 제안안]으로만 표기하고 DB 저장 여부, 회전 실패 처리 등 구현 필수 세부 사항이 없어 실제 구현 시 방향이 확정되지 않은 상태다.
3. `GET /plans` 응답에 페이지네이션이 없고, `total` 필드만 반환하는 구조여서 데이터가 많아질 경우 성능 문제가 우려된다.

### 2.2 발견 사항

#### BE-01. 로그아웃 시 Refresh Token 서버 측 무효화 수단 미정의
- 검토 관점: 보안 / api-spec.md §3-4, backend-spec.md §5-3·§5-4
- 문제: `POST /auth/logout`은 `Set-Cookie: refresh_token=; Max-Age=0`으로 쿠키만 삭제하고, 서버 측에서 해당 Refresh Token을 폐기하는 절차가 없다. backend-spec.md §5-3의 Refresh 흐름에도 DB 저장·블랙리스트 조회가 없다.
- 이유: httpOnly 쿠키 기반이므로 클라이언트가 쿠키를 삭제해도 이미 탈취된 Refresh Token은 만료 시까지(7일) 재사용 가능하다. Token Rotation을 적용해도 이전 토큰을 서버가 검증할 방법이 없으면 탈취 감지 불가.
- 수정 제안: `users` 테이블에 `refresh_token_hash TEXT` 컬럼(또는 별도 `refresh_tokens` 테이블)을 추가하고, 로그아웃 시 해당 컬럼을 NULL로, Refresh 시 새 해시로 교체하는 정책을 명시한다. 단순화가 필요하면 최소한 "로그아웃 = DB 컬럼 초기화, Refresh 엔드포인트에서 DB값과 비교" 정책을 확정한다.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### BE-02. Token Rotation 구현 세부 사항 미결
- 검토 관점: 보안·인증 / api-spec.md §3-3, backend-spec.md §5-3
- 문제: Token Rotation이 [AI 제안안]으로 표기되어 채택 여부가 확정되지 않았고, 채택 시 필수 구현 요소(새 Refresh Token의 DB 저장 위치, 이전 토큰 재사용 탐지 여부, Rotation 실패 시 세션 전체 폐기 여부)가 전혀 기술되지 않았다.
- 이유: Token Rotation을 코드에서 구현하려면 단순 쿠키 교체 이상의 DB 설계가 필요하다. 미결 상태로 구현에 들어가면 각 개발자가 서로 다른 방식을 선택할 위험이 있다.
- 수정 제안: 팀에서 Rotation 채택 여부를 확정하고, 채택 시 `refresh_token_hash` 컬럼 추가, 재사용 토큰 감지 시 전체 세션 폐기 정책을 backend-spec.md §5에 명시한다. 미채택 시 해당 항목을 [제외]로 표기한다.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### BE-03. `GET /plans` 정렬 키(sort key) 미명시
- 검토 관점: API 스펙 완결성 / api-spec.md §4-1, backend-spec.md §8-2
- 문제: `GET /plans` 쿼리 파라미터에 `sort` 또는 `order` 파라미터가 없다. backend-spec.md §8-2의 `plansService.list` 의사 코드에도 `ORDER BY` 절이 없다. PRD §13-3(오늘 할 일 정렬: 중요도→마감시간)은 클라이언트 측 정렬인지 서버 측 정렬인지 불명확하다.
- 이유: 정렬 기준이 없으면 구현자마다 다른 ORDER BY를 선택하거나, DB 삽입 순서에 의존하게 된다. 특히 "오늘 할 일" 뷰는 PRD §12-7에서 중요도→마감시간 정렬을 명시하고 있으므로 서버·클라이언트 중 어느 쪽이 책임지는지 확정이 필요하다.
- 수정 제안: `plansService.list` 기본 정렬을 `priority(high→normal→low), dueTime(ASC nulls last)` 순으로 명시하고, 클라이언트가 추가 정렬을 요청할 필요가 없다면 쿼리 파라미터 없이 서버 고정 정렬로 확정한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예

#### BE-04. `category` 필터의 다중 값 파싱 처리 미명시 (Zod 스키마 관점)
- 검토 관점: API 스펙·구현 가능성 / api-spec.md §4-1
- 문제: `?category=1&category=2` 형식의 반복 파라미터를 Express에서 파싱하면 `req.query.category`가 `string | string[]`으로 들어온다. validate 미들웨어가 `query` 타깃을 지원하는 것은 명시되어 있으나(backend-spec.md §4-2), 이 필드에 대한 Zod 스키마(`z.array(z.coerce.number())` 등)가 `schemas/plan.schema.ts`에 어떻게 정의되어야 하는지 기술이 없다.
- 이유: 단일 값(`?category=1`)과 다중 값(`?category=1&category=2`) 모두 정상 처리하려면 `z.union([z.coerce.number(), z.array(z.coerce.number())])` 또는 `z.preprocess` 패턴이 필요하다. 이를 누락하면 단일 값 전달 시 배열 파싱 실패가 발생한다.
- 수정 제안: `GetPlansQuerySchema` 예시(의사 정의 수준)를 backend-spec.md §4-2 또는 schemas 섹션에 추가하고, `category` 필드의 단일/다중 처리 방식을 명시한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예

#### BE-05. Prisma `schema.prisma` 의사 정의 부재 — `onDelete`, 인덱스, `unique` 미명시
- 검토 관점: DB 설계·구현 가능성 / backend-spec.md 전체
- 문제: backend-spec.md에 `schema.prisma` 의사 정의가 없다. PRD §8에 인덱스 목록은 있으나, Prisma 문법으로 어떻게 선언하는지(`@@index([userId, displayDate])` 등)가 없다. 특히 `plans.category_id`의 `@relation(onDelete: SetNull)`이 필요한지, 아니면 서비스 레이어의 트랜잭션으로만 처리하는지 명확하지 않다.
- 이유: Prisma에서 `onDelete: SetNull`을 스키마에 선언하면 DB FK 레벨에서 자동 처리되어 트랜잭션 코드가 단순해진다. 반면 서비스 레이어 트랜잭션으로만 처리하면 스키마에서 `onDelete: Restrict`(기본값)이 되어 카테고리 먼저 삭제하면 FK 위반이 발생한다. 이 선택이 코드와 스키마 모두에 영향을 미친다.
- 수정 제안: backend-spec.md에 `schema.prisma` 핵심 필드 의사 정의를 추가한다. 최소한 `plans.categoryId`의 `@relation(fields: [categoryId], references: [id], onDelete: SetNull)` 또는 트랜잭션 우선 처리 방침 중 하나를 확정하고 명시한다. `users.email @unique`, 인덱스 4개(`@@index`) 선언도 포함해야 한다.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### BE-06. 회원가입 응답에 Access Token 포함 여부 미확정 + PRD §10-1 불일치
- 검토 관점: API 스펙 일관성 / api-spec.md §3-1, PRD §10-1
- 문제: api-spec.md §3-1 주석에 "회원가입 성공 시 Access Token도 함께 발급하여 즉시 로그인 상태로 전환 [확인 필요]"가 남아 있다. PRD §10-1은 `/login` 리디렉션을 명시하므로 회원가입 후 별도 로그인 단계가 필요하다. 두 문서가 충돌 상태다.
- 이유: 클라이언트 구현에서 회원가입 성공 시 어떤 경로로 이동하고 어느 시점에 Access Token을 취득하는지가 달라진다. 또한 회원가입 응답에서 Refresh Token 쿠키를 설정하는지도 명시되어 있지 않다.
- 수정 제안: PRD §10-1을 기준으로 "회원가입 성공 → `/login` 리디렉션, 토큰 미발급"으로 확정하거나, UX 개선을 위해 "회원가입 성공 → Access+Refresh 토큰 발급 → `/` 리디렉션"으로 PRD를 수정한다. 어느 쪽이든 api-spec.md §3-1에서 `[확인 필요]` 주석을 제거하고 확정 동작으로 기술한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예

#### BE-07. `GET /plans` 페이지네이션 부재
- 검토 관점: 성능·API 설계 / api-spec.md §4-1
- 문제: `GET /plans` 응답에 `total` 필드는 있으나 `page`, `limit`, `offset` 쿼리 파라미터가 없다. 전체 일정을 한 번에 반환한다.
- 이유: 대학생 한 명의 일정이 수백 건에 이를 수 있고, `search` 파라미터와 조합하면 LIKE 풀스캔이 발생한다. SQLite는 단일 파일 DB이므로 대용량 응답이 서버 메모리에도 부담이 된다. 또한 `total` 필드가 페이지네이션 없이 존재하는 것은 의미가 모호하다.
- 수정 제안: MVP 범위에서 페이지네이션이 불필요하다면 `total` 필드를 삭제하거나 "전체 건수"로 용도를 명시한다. 향후 확장을 위해 `limit`/`offset` 파라미터 슬롯을 스펙에 기재해 두는 것을 권장한다.
- 우선순위: 낮음
- 개발 전 반드시 수정해야 하는지 여부: 아니오

#### BE-08. 완료 토글(`PATCH /plans/:id/complete`) 멱등성 문제
- 검토 관점: API 설계·구현 / api-spec.md §4-6, backend-spec.md §8-3
- 문제: 현재 스펙은 "현재 값의 반대로 전환(토글)" 동작이다. 즉 같은 요청을 두 번 보내면 완료→미완료→완료로 번갈아 바뀐다. PATCH는 HTTP 명세상 멱등성이 권장되나 이 엔드포인트는 명시적으로 멱등하지 않다.
- 이유: 네트워크 재시도(TanStack Query의 자동 재시도 포함) 시 의도치 않은 상태 반전이 발생할 수 있다. 클라이언트가 낙관적 업데이트(optimistic update)를 사용하는 경우 더욱 위험하다.
- 수정 제안: 두 가지 선택지 중 하나를 확정한다. (A) 요청 body에 `{ "isCompleted": true/false }` 명시적 값을 포함하여 멱등하게 만든다. (B) 토글 동작을 유지하되 클라이언트에서 재시도를 비활성화(`retry: 0`)하고 스펙에 "비멱등 엔드포인트"임을 명기한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 아니오

#### BE-09. `PUT /categories/:id`와 `PATCH /plans/:id`의 HTTP 메서드 불일치
- 검토 관점: API 설계 일관성 / api-spec.md §5-3, §4-4
- 문제: 카테고리 수정은 `PUT`, 일정 수정은 `PATCH`를 사용한다. api-spec.md §5-3 요청 본문 설명에는 "변경할 필드만 포함"이라고 되어 있어 실질적으로 부분 업데이트(Partial Update)인데 `PUT`을 사용했다.
- 이유: `PUT`은 리소스 전체 교체를 의미하므로, 클라이언트가 name만 변경하고 color를 생략하면 서버가 color를 초기화해야 하는지 모호하다. 실제 구현이 Partial Update라면 메서드를 `PATCH`로 맞추거나, `PUT`이라면 모든 필드를 필수로 변경해야 한다.
- 수정 제안: `PUT /categories/:id`를 `PATCH /categories/:id`로 변경하여 일정 수정과 일관성을 맞추거나, `PUT`을 유지하되 모든 필드를 필수로 변경하고 "전체 교체" 의미임을 명시한다.
- 우선순위: 낮음
- 개발 전 반드시 수정해야 하는지 여부: 아니오

#### BE-10. `authMiddleware` 만료 vs 서명 오류 응답 코드 혼용
- 검토 관점: API 스펙·보안 / api-spec.md §2, backend-spec.md §4-1
- 문제: backend-spec.md §4-1에서 토큰 만료 시 `AUTH_UNAUTHORIZED`를 반환하고, 서명 불일치 시 `AUTH_INVALID_TOKEN`을 반환한다. 그러나 공통 에러 코드 표(api-spec.md §2)에서 `AUTH_UNAUTHORIZED`는 "토큰 없음 또는 만료", `AUTH_INVALID_TOKEN`은 "형식 오류 또는 서명 불일치"로 정의되어 있어 클라이언트가 두 코드를 모두 401로 처리해야 한다.
- 이유: 클라이언트의 Access Token 자동 갱신 로직(`/auth/refresh` 호출)은 `AUTH_UNAUTHORIZED` 코드를 트리거로 사용해야 하는데, `AUTH_INVALID_TOKEN`이 반환될 경우 동일하게 갱신 시도를 해야 하는지 불명확하다. 실제로 서명 오류인 경우 갱신해도 소용없으므로 동작이 달라야 한다.
- 수정 제안: api-spec.md §3-3 에러 표에 `AUTH_INVALID_TOKEN` → "즉시 로그인 리디렉션(갱신 불필요)"임을 명시하고, 클라이언트 인터셉터 동작 분기를 스펙에 기술한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 아니오

#### BE-11. multer validate 미들웨어 순서 — 파일 없음(`VALIDATION_FAILED`) 처리 불명확
- 검토 관점: 구현 가능성·에러 처리 / api-spec.md §6-4, backend-spec.md §4-5
- 문제: `POST /profile/avatar` 라우터에서 미들웨어 순서가 `authMiddleware → multer.single('avatar') → controller`이다(backend-spec.md §3-4). 파일이 없을 경우 multer는 에러를 발생시키지 않고 `req.file`이 `undefined`인 채로 컨트롤러로 진행된다. api-spec.md §6-4 에러 표에는 `VALIDATION_FAILED` (파일 누락)이 있으나 이를 처리하는 위치(multer 이후 컨트롤러 내부 검증 vs validate 미들웨어)가 명시되지 않았다.
- 이유: Zod의 `validate` 미들웨어는 `req.body`를 검증하는데, multipart 요청에서 파일은 `req.file`에 위치한다. Zod 스키마로는 파일 존재 여부를 검증할 수 없으므로 컨트롤러 또는 별도 미들웨어에서 `req.file` 존재 확인이 필요하다.
- 수정 제안: backend-spec.md §4-5 또는 §3-4에 "multer 이후 컨트롤러 진입 시 `req.file` 없으면 `VALIDATION_FAILED` throw" 처리를 명시한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 아니오

#### BE-12. Refresh Token 쿠키 `Path=/api/v1/auth/refresh` — 로그아웃 엔드포인트에서 쿠키 수신 불가
- 검토 관점: 보안·구현 정확성 / api-spec.md §3-1, backend-spec.md §5-4
- 문제: Refresh Token 쿠키의 `Path=/api/v1/auth/refresh`로 설정되어 있다. 그런데 로그아웃 엔드포인트는 `POST /api/v1/auth/logout`이므로, 로그아웃 요청 시 브라우저가 이 쿠키를 자동으로 포함하지 않는다. 따라서 서버에서 로그아웃 시 `Max-Age=0`으로 쿠키를 삭제하는 Set-Cookie 헤더를 보내더라도 브라우저는 해당 쿠키를 지우지 않을 수 있다.
- 이유: `Set-Cookie: refresh_token=; Max-Age=0; Path=/api/v1/auth/refresh`는 클라이언트 브라우저가 동일한 Path에서 발급된 쿠키를 삭제하지만, 실제로 로그아웃 요청 경로와 쿠키 Path가 다르면 쿠키 삭제 헤더가 제대로 작동한다. 다만 로그아웃 응답에 삭제 Set-Cookie를 포함할 때 Path 값을 `/api/v1/auth/refresh`로 명시해야 한다는 구현 주의사항이 스펙에 없다. 또한 개발 환경에서 프록시 없이 직접 호출하는 경우 Path 불일치로 쿠키가 전송되지 않아 Refresh 자체가 실패할 수 있다.
- 수정 제안: backend-spec.md §5-4에 "로그아웃 응답의 Set-Cookie에도 `Path=/api/v1/auth/refresh`를 명시"하는 구현 주의사항을 추가한다. 또한 개발 환경에서 Vite 프록시 설정(`/api → http://localhost:4000`)을 통해 쿠키 Path 문제를 우회하는 방법을 환경 변수 섹션(§10)에 기재한다.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### BE-13. `plansService.list`의 `month` 필터 날짜 범위 오류 가능성
- 검토 관점: 구현 정확성 / backend-spec.md §8-2
- 문제: backend-spec.md §8-2에서 month 필터를 `displayDate BETWEEN '{YYYY}-{MM}-01' AND '{YYYY}-{MM}-31'`로 처리한다. 그런데 30일 또는 28/29일인 달에 31을 사용하면 SQLite에서 문자열 비교이므로 실제로는 동작하지만, 해당 달에 31일이 없어도 `2026-04-31`이 유효한 날짜 문자열로 처리될 수 있어 예상치 못한 결과가 발생할 수 있다.
- 이유: Prisma + SQLite에서 날짜가 TEXT로 저장될 경우 문자열 비교가 적용된다. `2026-04-30`이 마지막인 달에 `AND displayDate <= '2026-04-31'`은 결과적으로 올바르게 작동하지만, 코드 가독성 및 버그 위험이 있다. 또한 `date-fns`의 `endOfMonth()`를 사용하면 정확하게 처리할 수 있음에도 하드코딩된 31을 사용했다.
- 수정 제안: `'{YYYY}-{MM}-31'` 대신 `dateUtil.ts`의 `endOfMonth(parseISO(`${year}-${month}-01`))` 결과 값을 사용하도록 의사 코드를 수정한다.
- 우선순위: 낮음
- 개발 전 반드시 수정해야 하는지 여부: 아니오

---

## 3. DB/시스템 규칙 관점 검토 (Agent 3)

> 검토 파일: data-model.md (+ api-spec.md, backend-spec.md 참조)
> 검토자: Agent 3 (DB/시스템 규칙)

### 3.1 종합 평가

data-model.md는 ERD 관계(CASCADE/SET NULL), soft delete 필터 의무화, 트랜잭션 원자성(회원가입·카테고리 삭제), 인덱스 전략, Prisma 의사 스키마 제공 등 핵심 항목을 적절히 문서화하고 있다. K-09 카테고리 SET NULL, K-10 display_date 분리 의도도 명확히 기술되어 있어 비즈니스 규칙과 데이터 모델 간 정합성은 양호하다. 다만 SQLite 고유 한계(FK 활성화 pragma, CURRENT_TIMESTAMP 타임존 함정, LIKE 검색의 한국어 한계)와 운영 관점 누락 사항(백업 정책, 탈퇴 사용자 처리, 동시성 충돌, 카테고리명 unique 제약 미정의)이 개발 착수 전 보완이 필요한 수준으로 남아 있다. 특히 `PRAGMA foreign_keys = ON` 미명시는 K-09 SET NULL 자체를 무력화할 수 있어 즉시 수정이 필요하다.

**주요 강점**
- ERD 관계(onDelete CASCADE/SET NULL)와 비즈니스 결정(K-09=B, K-10=B)이 데이터 모델에 직접 반영되어 일관성이 높음
- 트랜잭션 적용 위치 2곳(회원가입, 카테고리 삭제)이 명확히 명시되어 있고, 원자성 파괴 시나리오를 사전에 차단
- soft delete 필터(`deleted_at IS NULL`) 의무화 및 Repository 패턴에서의 명시적 적용 방식이 구체적으로 기술됨

**주요 우려**
- SQLite에서 FK 제약은 기본 비활성 상태이므로 `PRAGMA foreign_keys = ON`을 명시하지 않으면 CASCADE/SET NULL이 실제로 동작하지 않음
- `CURRENT_TIMESTAMP`는 SQLite에서 UTC를 반환하므로 KST 텍스트 저장 정책과 정면으로 충돌하며, `created_at`/`updated_at` 기본값이 KST가 아닌 UTC로 저장될 가능성이 높음
- 한국어 제목·메모에 대한 LIKE 검색은 의미 있는 형태소 검색이 불가능하고, SQLite FTS5 도입 여부에 대한 결정이 누락됨

### 3.2 발견 사항

#### DB-01. SQLite FK 비활성 기본값 — PRAGMA foreign_keys = ON 미명시
- 검토 관점: DB/시스템 규칙 (data-model.md §2-4 Prisma 스키마, §5 관계 정리, §8-3 마이그레이션 주의사항)
- 문제: SQLite는 기본적으로 외래 키 제약 검사를 비활성화한다. `PRAGMA foreign_keys = ON`을 연결마다 설정하지 않으면 `ON DELETE CASCADE`, `ON DELETE SET NULL` 규칙이 실제로 동작하지 않는다. data-model.md 전체에서 이 pragma가 언급되지 않는다.
- 이유: K-09=B(카테고리 삭제 시 plans.category_id SET NULL)와 사용자 삭제 시 CASCADE는 이 설정 없이는 DB 레이어에서 무시된다. Prisma SQLite 어댑터도 기본으로 이 pragma를 활성화하지 않는 버전이 존재한다.
- 수정 제안: `backend/prisma/schema.prisma`의 `datasource db` 블록에 `pragma = ["foreign_keys = ON"]`을 추가하거나, `config/prisma.ts`의 PrismaClient 초기화 시 `$executeRaw(Prisma.sql\`PRAGMA foreign_keys = ON\`)` 을 연결 시마다 실행하는 코드를 명시적으로 기술하고, data-model.md §8-3에 주의사항으로 추가한다.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### DB-02. CURRENT_TIMESTAMP의 UTC 반환 — KST 저장 정책과 충돌
- 검토 관점: DB/시스템 규칙 (data-model.md §0 개요 "KST 텍스트 직접 저장", §2-1, §3-1, §4-1 각 테이블 created_at/updated_at 기본값)
- 문제: data-model.md §0에서 "KST 텍스트 직접 저장"을 명시했으나, 모든 테이블의 `created_at` 컬럼 기본값이 `CURRENT_TIMESTAMP`로 정의되어 있다. SQLite의 `CURRENT_TIMESTAMP`는 UTC 기준 값을 반환한다. 따라서 Prisma의 `@default(now())`도 내부적으로 `CURRENT_TIMESTAMP`를 사용할 경우 UTC 문자열이 저장된다.
- 이유: 한국 시간대에서 자정 전후(23:00~23:59)에 생성된 레코드의 `created_at`이 실제 KST 날짜와 다르게 저장되며, 로그·감사 추적 시 혼란을 야기한다. backend-spec.md §8-1 dateUtil의 `nowKST()` 함수가 별도 존재하는 것이 이 문제를 인식했음을 시사하지만, DB 기본값 레벨의 수정이 문서에 기술되어 있지 않다.
- 수정 제안: `created_at`/`updated_at`/`deleted_at` 컬럼의 기본값을 DB 레벨에서 설정하지 않고, 애플리케이션에서 `nowKST()` 호출 결과를 명시적으로 전달하는 방식으로 통일한다. data-model.md에 "created_at 기본값은 DB `CURRENT_TIMESTAMP`가 아닌 애플리케이션의 `nowKST()` 호출로 설정" 규칙을 명시한다.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### DB-03. categories 테이블 — 같은 사용자 내 카테고리명 중복 제약 미정의
- 검토 관점: DB/시스템 규칙 (data-model.md §3-1 컬럼 정의, §3-3 제약 및 규칙)
- 문제: `categories` 테이블에 `(user_id, name)` 복합 UNIQUE 제약이 없다. 결과적으로 같은 사용자가 "과제"라는 이름의 카테고리를 여러 개 생성할 수 있어 UI에서 중복 항목이 표시될 수 있다. §3-3 "제약 및 규칙"에 해당 제약이 언급되어 있지 않다.
- 이유: 사용자 관점에서 동일한 이름의 카테고리가 둘 이상 존재하면 필터 선택 시 혼란이 발생하며, 특히 시드 데이터(5개 기본 카테고리) 재생성 버그 발생 시 중복 카테고리가 누적될 수 있다.
- 수정 제안: Prisma 스키마에 `@@unique([userId, name])`을 추가하고, 중복 시 에러 코드를 정의한다(예: `CATEGORY_NAME_ALREADY_EXISTS`, 409). data-model.md §3-3에 이 제약을 명시한다. 단, 중복 허용이 의도된 설계라면 §3-3에 명시적으로 "중복 허용"이라 기재한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예

#### DB-04. categories 테이블 — is_default 컬럼 부재로 기본 카테고리 보호 불가
- 검토 관점: DB/시스템 규칙 (data-model.md §3-1 컬럼 정의, §7 초기 데이터)
- 문제: PRD §17, K-02=B에 따라 회원가입 시 5개 기본 카테고리가 자동 생성된다. 그러나 `categories` 테이블에 `is_default` 또는 이에 준하는 컬럼이 없어 기본 카테고리를 사용자가 삭제하거나 수정하는 것을 DB 레이어 또는 서비스 레이어에서 차단할 근거가 없다. data-model.md §3-1 컬럼 정의에 해당 컬럼이 존재하지 않는다.
- 이유: 기본 카테고리가 삭제되어도 비즈니스상 문제가 없다면 현행 설계가 유효하다. 하지만 UX 가이드나 PRD 어디에도 "기본 카테고리는 삭제 가능"이라는 명시적 결정이 없어 의도 불명이다.
- 수정 제안: (1) 기본 카테고리 삭제 허용 시 — data-model.md에 "기본 카테고리도 삭제 가능(K-09 동일 정책 적용)"임을 명시한다. (2) 삭제 불허 시 — `is_default INTEGER NOT NULL DEFAULT 0` 컬럼을 추가하고, 서비스 레이어에서 `is_default = 1`인 카테고리 삭제 시도 시 400 에러를 반환하는 로직을 기술한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 아니오 (의사결정 후 반영)

#### DB-05. soft delete 인덱스 전략 — deleted_at 단독 인덱스의 실효성 부재
- 검토 관점: DB/시스템 규칙 (data-model.md §4-3 인덱스, §6 인덱스 전략)
- 문제: `idx_plans_deleted`는 `deleted_at` 단일 컬럼 인덱스로 정의되어 있다. 실제 쿼리 패턴은 항상 `WHERE user_id = ? AND deleted_at IS NULL`이므로 이 단독 인덱스는 활용되지 않는다. 반면 `idx_plans_user_display`와 `idx_plans_user_due`는 `deleted_at IS NULL` 조건을 포함하지 않아 soft delete 필터가 인덱스 스캔 이후 필터 단계에서 처리된다.
- 이유: 소수 사용자·소규모 데이터에서는 영향이 없으나, 일정이 수천 건 누적된 사용자의 경우 `deleted_at IS NULL` 레코드가 대다수를 차지하여 인덱스 효율이 떨어진다. 진단 항목 18(성능)과 연관된다.
- 수정 제안: `idx_plans_deleted` 단독 인덱스 삭제 또는 용도 재정의. 대신 복합 인덱스 `(user_id, deleted_at, display_date)` 또는 `(user_id, deleted_at, due_date)` 형태로 확장하거나, SQLite의 부분 인덱스(`WHERE deleted_at IS NULL`)를 활용하는 방식을 data-model.md §6에 검토 사항으로 명시한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 아니오 (초기 버전에서는 허용 가능, 성능 이슈 발생 시 마이그레이션)

#### DB-06. 검색(LIKE) 규칙 — 한국어 대소문자 처리·FTS5 고려 여부 미정의
- 검토 관점: DB/시스템 규칙 (data-model.md 전체 검색 관련 기술 없음; api-spec.md §4-1 search 파라미터; backend-spec.md §8-2 plansService.list)
- 문제: api-spec.md §4-1에서 `search` 파라미터는 `title + memo LIKE '%keyword%'`로 기술되어 있으나, data-model.md에는 검색 관련 DB 규칙이 전혀 없다. (1) SQLite LIKE는 ASCII 문자만 대소문자 무시 처리하며 한글 자모 분리 검색 불가, (2) `%keyword%` 패턴은 인덱스를 전혀 사용할 수 없어 전체 테이블 스캔, (3) FTS5 가상 테이블 도입 여부 미결정이다.
- 이유: 대학생 사용 시나리오에서 "영처" 검색으로 "영상처리 과제"를 찾을 수 없고, 일정이 많은 사용자에서 검색마다 풀 스캔이 발생한다. data-model.md가 검색 동작 규칙을 정의해야 한다.
- 수정 제안: data-model.md에 검색 규칙 섹션을 추가한다. 최소한 (1) 검색 범위(현재 조회 월 vs. 전체 미삭제 레코드), (2) COLLATE NOCASE 적용 여부, (3) FTS5 가상 테이블 도입 여부(초기 버전에서 미도입이면 "미도입 결정"으로 명시), (4) 검색 결과 정렬 기준을 명시한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예 (검색 범위 결정 없이 구현 불가)

#### DB-07. 다중 필터 AND/OR 조합 규칙 — NULL category 필터 동작 미정의
- 검토 관점: DB/시스템 규칙 (api-spec.md §4-1 쿼리 파라미터; backend-spec.md §8-2; data-model.md §4-2 category_id 설명)
- 문제: api-spec.md §4-1에서 `category` 파라미터는 OR 조건임이 명시되어 있으나, `category=0` 또는 `category=null`로 "미분류(category_id IS NULL)" 일정을 필터링하는 방법이 정의되어 있지 않다. K-09=B에 따라 미분류 일정이 존재할 수 있음에도 해당 일정을 필터로 조회하는 방법이 없다. 또한 다중 필터(카테고리 OR + 중요도 + 완료 여부)의 조합이 AND인지 각 필터 간 OR인지 data-model.md에 명시되어 있지 않다.
- 이유: 프론트엔드 필터 UI 구현과 백엔드 쿼리 로직이 다르게 해석될 수 있다. 특히 미분류 일정은 카테고리 칩 UI에서 "미분류" 옵션을 선택했을 때 조회되어야 하는데 이 경로가 없다.
- 수정 제안: data-model.md 또는 api-spec.md에 (1) 필터 간 조합 방식(카테고리 OR, 중요도 AND, 완료 여부 AND), (2) 미분류 필터링을 위한 파라미터 표현 방법(`category=null` 또는 별도 `uncategorized=1` 파라미터)을 명시한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예

#### DB-08. completed_at 컬럼 부재 — 완료 시각 추적 불가 및 정렬 모호성
- 검토 관점: DB/시스템 규칙 (data-model.md §4-1 컬럼 정의, §4-2 is_completed 설명)
- 문제: `is_completed` 컬럼은 0/1 토글만 저장하며 완료 처리 시각을 기록하는 `completed_at` 컬럼이 없다. PRD §12-7에서 "완료 항목은 목록 최하위 이동"을 명시하는데, 복수의 완료 항목 간 정렬 기준이 없다(`is_completed=1`인 항목끼리의 순서는 `updated_at` 기준인지 불명확). 또한 미완료 복귀(토글) 시 정렬이 원래 위치로 돌아와야 하는지도 미정의이다.
- 이유: 완료된 항목이 여러 개일 때 UI 순서가 구현자마다 달라질 수 있으며, 추후 "언제 완료했는가" 통계가 필요할 경우 `updated_at`으로 역추적이 불가능하다(수정과 완료가 같은 컬럼을 갱신).
- 수정 제안: `completed_at TEXT NULL` 컬럼을 추가하고, 완료 토글 시 `is_completed=1`이면 `nowKST()`, `is_completed=0`이면 `NULL`로 설정한다. 정렬 규칙에 "완료 항목 간 정렬은 `completed_at` 내림차순"을 명시한다. 단, 스코프 절약이 목적이라면 `updated_at` 기준임을 data-model.md §4-2에 명기한다.
- 우선순위: 낮음
- 개발 전 반드시 수정해야 하는지 여부: 아니오 (정렬 규칙만 문서에 명시하면 최소 허용)

#### DB-09. 카테고리 삭제 트랜잭션 순서 — plans SET NULL → categories DELETE 순서 불명확
- 검토 관점: DB/시스템 규칙 (backend-spec.md §8-4 categoriesService.delete; api-spec.md §5-4; data-model.md §5 관계 정리)
- 문제: backend-spec.md §8-4의 트랜잭션 의사 코드는 `planRepository.updateMany(SET NULL)` 후 `categoryRepository.delete()` 순서이다. 그런데 `PRAGMA foreign_keys = ON` 활성화 상태에서 FK 제약이 있을 경우, SQLite는 categories 삭제 전에 plans의 FK가 유효해야 한다. Prisma의 `$transaction`이 이 순서를 보장하는지 여부가 data-model.md에 기술되어 있지 않다. 반대로 DB-01 이슈대로 FK가 비활성 상태라면 순서 무관하게 동작하지만 SET NULL도 동작하지 않는다.
- 이유: FK 활성화 여부에 따라 트랜잭션 내 실행 순서가 달라져야 하며, 이를 명시하지 않으면 구현자가 잘못된 순서로 작성할 경우 FK 제약 위반 오류가 발생할 수 있다.
- 수정 제안: DB-01 해결(FK pragma 활성화) 후, data-model.md §9.3 트랜잭션 일관성 항목에 "카테고리 삭제 트랜잭션 실행 순서: (1) plans.category_id = NULL 업데이트, (2) categories 레코드 삭제" 순서를 명기하고, Prisma `$transaction` 배열의 선언 순서와 실행 순서가 동일함을 확인한다.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

#### DB-10. 마이그레이션 롤백 정책 미정의
- 검토 관점: DB/시스템 규칙 (data-model.md §8 마이그레이션 전략)
- 문제: data-model.md §8-1에서 개발/운영 마이그레이션 명령어와 명명 규칙은 기술되어 있으나, 롤백 정책이 전혀 없다. `prisma migrate reset`은 개발 환경 전용 DB 초기화이며, 운영 환경에서 마이그레이션 실패 시 롤백 방법이 기술되어 있지 않다. §8-3에 "SQLite는 컬럼 삭제/변경이 제한적"이라 언급하지만 이 경우의 대응 방안도 없다.
- 이유: SQLite는 ALTER TABLE DROP COLUMN을 3.35 이전 버전에서 지원하지 않으며, 컬럼 타입 변경은 완전히 미지원이다. 운영 배포 중 마이그레이션 오류 발생 시 복구 방법이 없으면 서비스 중단으로 이어진다.
- 수정 제안: data-model.md §8에 다음을 추가한다. (1) 운영 마이그레이션 실패 시 대응: 이전 DB 파일 백업 복원, (2) 파괴적 변경(컬럼 삭제·타입 변경) 시 shadow table 재생성 절차 기술, (3) 각 마이그레이션 파일에 `-- rollback:` 주석으로 역 SQL 명시하는 컨벤션 도입 권장.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 아니오 (초기 개발 단계에서는 낮은 위험, 운영 전 보완)

#### DB-11. 백업·복구 정책 및 탈퇴 사용자 데이터 처리 정책 미정의
- 검토 관점: DB/시스템 규칙 (data-model.md 전체; prd.md §5 전체 시스템 범위)
- 문제: data-model.md 전체에서 DB 백업 정책, 복구 절차, 탈퇴 사용자 데이터 처리 정책이 언급되지 않는다. `users` 테이블에 `deleted_at` 컬럼이 없어 탈퇴를 물리 삭제(CASCADE로 plans·categories 전부 제거)로만 처리하게 된다. PRD §5에도 "제외 범위"에 탈퇴 정책이 명시되어 있지 않다.
- 이유: GDPR·개인정보보호법 관점에서 사용자 탈퇴 요청 시 데이터 즉시 삭제 또는 일정 기간 보존 후 삭제 여부를 사전에 결정해야 하며, SQLite 단일 파일 특성상 정기 백업 전략 없이는 파일 손상 시 복구 불가.
- 수정 제안: data-model.md에 (1) 탈퇴 처리 정책(즉시 물리 삭제 또는 소프트 삭제 후 30일 유예) 결정 및 명시, (2) SQLite DB 파일 정기 백업 주기(예: 일 1회 `.db` 파일 복사) 및 보관 위치 정책 추가. 초기 버전에서 미구현이더라도 "미구현 결정"으로 명시한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 아니오 (탈퇴 정책 결정은 개발 전 필요, 백업은 운영 전 필요)

#### DB-12. display_date와 due_date 범위 유효성 검증 규칙 미정의
- 검토 관점: DB/시스템 규칙 (data-model.md §4-2 display_date 설명; api-spec.md §4-2 일정 등록 요청 본문)
- 문제: data-model.md §4-2에서 `display_date`는 "사용자가 직접 지정하는 처리 예정일"이라 설명하고, 예시로 "마감 5/25이지만 5/22에 처리"가 있다. 그러나 `display_date > due_date`인 경우(마감일 이후에 처리하겠다는 설정)를 허용하는지 여부에 대한 DB CHECK 제약이나 서비스 레이어 검증 규칙이 없다. 또한 과거 날짜 `due_date` 허용 여부는 PRD §12-3에 명시되어 있으나 `display_date`의 과거 날짜 허용 여부는 미정의이다.
- 이유: `display_date`가 `due_date`보다 늦은 일정은 의미론적으로 "마감 이후에 처리"라는 모순으로, 사용자 실수일 가능성이 높다. 이를 허용하거나 차단하는 결정이 없으면 구현자마다 다르게 처리된다.
- 수정 제안: data-model.md §4-2에 다음 규칙을 명시한다. (1) `display_date <= due_date` 권장(경고 표시) 또는 강제(422 에러), (2) 과거 `display_date` 허용 여부. 결정에 따라 Zod 스키마에 `displayDate <= dueDate` 검증을 추가하고 data-model.md에 기술한다.
- 우선순위: 보통
- 개발 전 반드시 수정해야 하는지 여부: 예 (비즈니스 규칙 결정 없이 구현 불가)

#### DB-13. 동시성 — 낙관적 잠금 또는 충돌 처리 전략 미정의
- 검토 관점: DB/시스템 규칙 (data-model.md 전체; backend-spec.md §8-3 toggleComplete)
- 문제: data-model.md에 동시성 처리 전략이 전혀 없다. SQLite는 기본적으로 WAL(Write-Ahead Logging) 모드에서 읽기 동시성을 지원하나 쓰기는 직렬화된다. 그러나 같은 사용자가 복수 탭에서 동일 일정을 수정하거나 완료 토글을 동시에 요청할 경우, 두 번째 요청이 첫 번째 요청의 결과를 덮어쓰는 lost update 문제가 발생할 수 있다. `plans` 테이블에 `version` 또는 `updated_at` 기반 낙관적 잠금이 없다.
- 이유: 모바일 앱이 아닌 웹 SPA 환경에서 복수 탭 사용은 일반적이며, 특히 완료 토글의 경우 서로 다른 탭에서 동시 클릭 시 최종 상태가 예측 불가능하다.
- 수정 제안: data-model.md에 동시성 정책을 명시한다. (1) 초기 버전: SQLite 직렬 쓰기 특성에 의존, 낙관적 잠금 미적용 결정 명시, (2) 향후 버전: PATCH 요청 시 `updatedAt` 타임스탬프를 요청 body에 포함시켜 서버에서 비교 후 409 Conflict 반환하는 낙관적 잠금 방식 명시. 현재 `PATCH /api/v1/plans/:id`에 `updatedAt` 필드 포함 여부를 검토한다.
- 우선순위: 낮음
- 개발 전 반드시 수정해야 하는지 여부: 아니오 (SQLite 직렬 쓰기로 최소 보장, 명시적 결정만 필요)

#### DB-14. Prisma `@default(now())`의 String 타입 적용 시 SQLite 실제 동작 불일치
- 검토 관점: DB/시스템 규칙 (data-model.md §2-4, §3-4, §4-4 Prisma 스키마 의사 정의)
- 문제: 모든 엔티티의 Prisma 스키마에서 `createdAt String @default(now())`와 `updatedAt String @updatedAt` 형태를 사용한다. Prisma에서 `@default(now())`는 `DateTime` 타입에 대해 ISO 8601 포맷으로 동작하도록 설계되어 있으나, `String` 타입에 적용 시 Prisma 내부 동작이 SQLite 어댑터에 따라 다를 수 있다. 또한 `@updatedAt`는 공식적으로 `DateTime` 타입에서만 지원되며, `String` 타입에서는 자동 갱신이 보장되지 않는다.
- 이유: data-model.md §0에서 "KST 텍스트 직접 저장" 정책으로 `DateTime` 대신 `String` 타입을 채택했으나, 이로 인해 Prisma의 `@updatedAt` 자동 갱신과 `@default(now())`가 설계 의도대로 동작하지 않을 수 있다. backend-spec.md §9-3에서 `updatedAt: nowKST()`를 명시적으로 전달하는 방식이 언급되어 있으나, `@updatedAt` 어노테이션이 병행 사용될 경우 충돌이 발생한다.
- 수정 제안: (1) `createdAt`/`updatedAt`에서 `@default(now())`와 `@updatedAt`를 제거하고, 애플리케이션에서 명시적으로 `nowKST()`를 전달하는 방식으로 통일한다. (2) 또는 Prisma `DateTime` 타입으로 전환하고 KST 텍스트 저장 정책을 변경한다. data-model.md §2-4, §3-4, §4-4의 Prisma 의사 스키마를 이에 맞게 수정하고, 선택한 방식을 §0 개요에 반영한다.
- 우선순위: 높음
- 개발 전 반드시 수정해야 하는지 여부: 예

---

## 4. 다음 단계

1. **48시간 내 의사 결정 필요 (Top 6 차단 이슈)**
   - DB-01: SQLite FK pragma 활성화 방식 확정
   - DB-02: created_at/updated_at의 KST 저장 방식 확정 (`nowKST()` 명시 전달)
   - DB-14: Prisma `String + @updatedAt` vs `DateTime` 타입 선택
   - BE-01·BE-02: Refresh Token 서버 측 무효화·Rotation 정책 확정
   - BE-12: Refresh Token 쿠키 `Path` 설정 및 로그아웃 동작 명시

2. **개발 착수 전 22개 "필수 수정" 항목 패치**
   - FE: FE-01, 02, 03, 04, 06, 07, 10, 11, 12 (9개)
   - BE: BE-01, 02, 03, 04, 05, 06, 12 (7개 중 보통 우선순위 포함 6개)
   - DB: DB-01, 02, 03, 06, 07, 09, 12, 14 (8개 중 보통 우선순위 포함 7개)

3. **검토 후 문서 수정 위치**
   - PRD 보정: §10-1, §20-3, §22-2, §24-3, §30-1 D-11
   - api-spec.md: §3-1, §3-3, §4-1, §4-6, §5-3, §6-4
   - backend-spec.md: §4-1, §5-3, §5-4, §8-2, §8-3, §8-4
   - data-model.md: §0, §2-4, §3-3, §3-4, §4-2, §4-3, §4-4, §5, §6, §8, §9
   - frontend-spec.md: §3-1, §3-3, §3-5, §4-1, §4-2, §5, §7-1, §10-2
   - screen-flow.md: §2, §3, §4-2, §5, §8, §15
   - wireframe-spec.md: §1, §3, §4, §5, §9-3, §10, §11

4. **개발 단계로 진입 조건**
   - 위 22개 필수 수정 항목 모두 패치 완료
   - 6개 차단 이슈에 대한 팀 결정 회의 의사록 docs/02-analysis/ 또는 docs/04-design/에 기록
   - 수정 후 본 design-review.md를 v1.1로 업데이트 또는 "검토 완료" 표시

---

## 5. PRD 수정 필요 항목

본 보완 작업 중 PRD 자체의 수정이 필요한 사항을 식별. 설계 문서에서 직접 수정하지 않고 별도 PRD 패치 단계에서 처리 권장.

#### P-01. 회원가입 후 자동 로그인 vs 로그인 페이지 리디렉션 정책
- 근거 검토: BE-06
- PRD 영향 위치: prd.md §10-1
- 현 PRD 내용: 회원가입 성공 시 `/login` 리디렉션으로 기술. 별도 로그인 단계 필요.
- 권장 수정안: UX 관점에서 "회원가입 성공 → Access+Refresh 토큰 즉시 발급 → `/` 리디렉션"이 더 자연스러운 흐름. 현재 PRD가 이 방향을 차단하고 있어 팀 논의 필요.
- 우선순위: 보통
- 이번 보완에서의 임시 처리: PRD §10-1 존중하여 "토큰 미발급, 별도 로그인 단계"로 설계 문서 확정. api-spec.md §3-1 `[확인 필요]` 주석 제거.

#### P-02. PUT vs PATCH 메서드 일관성 — 카테고리 수정
- 근거 검토: FE-01, BE-09
- PRD 영향 위치: prd.md §20-3 C-03
- 현 PRD 내용: 카테고리 수정을 `PUT`으로 명시. 일정 수정은 `PATCH`.
- 권장 수정안: REST 관례상 부분 업데이트는 PATCH가 적합. 카테고리 수정도 PATCH로 통일하고 부분 업데이트 허용하는 것이 클라이언트 구현에 유리. 또는 PUT 유지 시 모든 필드 필수 명시를 PRD에 추가.
- 우선순위: 낮음
- 이번 보완에서의 임시 처리: PRD §20-3 C-03의 PUT을 존중. api-spec.md §5-3 및 frontend-spec.md §3-5에 "PUT = 전체 교체, name·color·sort_order 모두 필수"로 명시.

#### P-03. 검색 결과 표시 영역 — PRD §30-1 D-11 미확정
- 근거 검토: FE-03
- PRD 영향 위치: prd.md §30-1 D-11
- 현 PRD 내용: "미확정"으로 표기되어 있음.
- 권장 수정안: "검색 모드 진입 시 캘린더/주간바 숨김, 전체 일정 목록을 별도 영역(`<SearchResultList />`)에 표시"로 확정 필요.
- 우선순위: 높음
- 이번 보완에서의 임시 처리: AI 권장안을 채택하여 설계 문서(screen-flow.md §8, wireframe-spec.md §3, frontend-spec.md §3-3) 모두 확정값으로 기술. PRD는 별도 패치 필요.

#### P-04. 정렬 4순위 created_at 누락 — PRD §22-2 vs screen-flow 불일치
- 근거 검토: FE-04
- PRD 영향 위치: prd.md §22-2
- 현 PRD 내용: PRD §22-2에 4순위 `created_at 오래된 순`이 명시되어 있으나 screen-flow.md §2에 누락되어 있었음.
- 권장 수정안: PRD §22-2 내용 자체는 정확함. 설계 문서가 PRD를 반영하지 못한 케이스.
- 우선순위: 보통
- 이번 보완에서의 임시 처리: screen-flow.md §2 및 frontend-spec.md §4-1에 4순위 `created_at ASC` 추가 완료.

#### P-05. 주간 바 확장 카드 연필 아이콘 인터랙션 미명시 — PRD §24-3
- 근거 검토: FE-11
- PRD 영향 위치: prd.md §24-3
- 현 PRD 내용: 연필 아이콘이 존재한다고 명시하나, 카드 본문 클릭과 연필 아이콘 클릭의 인터랙션 차이를 명세하지 않음.
- 권장 수정안: PRD §24-3에 "카드 본문 클릭 = 상세 모달 뷰 모드, 연필 아이콘 클릭 = 상세 모달 편집 모드 직접 진입"으로 명시 추가 필요.
- 우선순위: 보통
- 이번 보완에서의 임시 처리: screen-flow.md §15 및 wireframe-spec.md §3에 인터랙션 분리 명시 완료.

---

## 6. 보완 반영 결과

> 패치 일자: 2026-05-20
> 패치 범위: design-review.md 내 "개발 전 반드시 수정해야 하는지 여부: 예" 22개 항목

### 6.1 패치 요약

| 분류 | 총 항목 | 반영 완료 | 부분 반영 | PRD 결정 필요로 보류 |
|---|---|---|---|---|
| FE | 9 | 9 | 0 | 0 |
| BE | 7 | 7 | 0 | 0 |
| DB | 8 | 8 | 0 | 0 |
| **합계** | **24** | **24** | **0** | **0** |

### 6.2 항목별 반영 내역

#### FE-01 카테고리 수정 메서드 PUT vs PATCH
- 수정 파일: frontend-spec.md, api-spec.md
- 수정 위치: frontend-spec.md §3-5, api-spec.md §5-3
- 수정 내용: `useUpdateCategory` 및 `updateCategory.ts`는 `PUT /api/v1/categories/:id` 사용 명시. PUT = 전체 교체이므로 `name·color·sort_order` 모두 필수 요청 바디 정책 명확화. api-spec.md §5-3 요청 본문 표에 필수(✓) 명시.
- 상태: 완료

#### FE-02 필터 UI 컴포넌트 와이어프레임 부재
- 수정 파일: wireframe-spec.md, frontend-spec.md
- 수정 위치: wireframe-spec.md §3 기본 상태, frontend-spec.md §3-3
- 수정 내용: wireframe §3에 필터 칩 그룹(카테고리 다중·중요도 다중·완료 여부 단일·초기화 버튼) ASCII 와이어프레임 추가. frontend-spec §3-3에 `<PlanFilterBar />` 컴포넌트 및 상세 동작 설명 추가.
- 상태: 완료

#### FE-03 검색 결과 표시 영역 미확정
- 수정 파일: screen-flow.md, wireframe-spec.md, frontend-spec.md
- 수정 위치: screen-flow.md §8, wireframe-spec.md §3, frontend-spec.md §3-3
- 수정 내용: AI 권장안 채택 — "검색 모드 진입 시 캘린더/주간바 숨김, 전체 일정 목록을 `<SearchResultList />` 별도 영역에 표시". `[확인 필요]` 주석 제거. 세 파일 모두 동일하게 명시.
- 상태: 완료

#### FE-04 정렬 4순위(created_at) + 정렬 위치(서버/클라) 미명시
- 수정 파일: screen-flow.md, frontend-spec.md
- 수정 위치: screen-flow.md §2 step 8~9, frontend-spec.md §4-1
- 수정 내용: screen-flow §2에 "4순위: created_at ASC(등록 순서)" 추가. frontend-spec §4-1에 "정렬은 서버 ORDER BY로 수행, 클라이언트 추가 정렬 없음" 명시. PRD §22-2와 일치.
- 상태: 완료

#### FE-06 PlanCreatePage 뒤로가기(←) 동작 미명세
- 수정 파일: screen-flow.md, frontend-spec.md
- 수정 위치: screen-flow.md §3 취소 흐름, frontend-spec.md §3-4
- 수정 내용: "헤더 ← 클릭 = 취소 확인 모달 트리거(취소 버튼과 동일)" 명시. React Router v6 `useBlocker` 사용 명시. 브라우저 백/새로고침 시 `beforeunload` 처리 명시.
- 상태: 완료

#### FE-07 캘린더 날짜 셀 클릭 시 미니 팝업 와이어프레임 부재
- 수정 파일: wireframe-spec.md, frontend-spec.md
- 수정 위치: wireframe-spec.md §3 기본 상태, frontend-spec.md §3-3
- 수정 내용: wireframe §3에 날짜 셀 클릭 시 미니 팝업 ASCII 와이어프레임 추가(셀 아래 카드 형태, 일정 제목 목록, 클릭 시 ?planId=X 이동, 외부클릭/ESC 닫기). frontend-spec §3-3에 `<CalendarDayPopup />` 컴포넌트 CalendarCell 하위로 추가.
- 상태: 완료

#### FE-10 일정 수정 시 due_date 변경 → display_date 자동 연동 여부 미명세
- 수정 파일: screen-flow.md, wireframe-spec.md, frontend-spec.md
- 수정 위치: screen-flow.md §5, wireframe-spec.md §5 편집 모드, frontend-spec.md §4-2
- 수정 내용: "수정 모드에서는 due_date 변경 시 display_date 자동 연동 없음(기존 값 유지). 등록 모드에서만 자동 연동" 명시. 세 파일 모두 동일하게 적용.
- 상태: 완료

#### FE-11 주간 바 확장 카드 연필 아이콘 PRD와 불일치
- 수정 파일: wireframe-spec.md, screen-flow.md
- 수정 위치: wireframe-spec.md §3 주간 바 확장 카드, screen-flow.md §15
- 수정 내용: PRD §24-3에 연필 아이콘 명시됨 → wireframe §3 카드 우측 끝에 `✏` 추가. screen-flow §15에 "연필 아이콘 클릭 = 상세 모달 + 편집 모드 직접 진입, 카드 본문 클릭 = 상세 모달 뷰 모드 진입"으로 인터랙션 분리.
- 상태: 완료

#### FE-12 planStore.planDetailId와 URL ?planId 동기화 방향 불명확
- 수정 파일: frontend-spec.md
- 수정 위치: frontend-spec.md §4-2 planStore
- 수정 내용: "planDetailId는 URL ?planId에서 `useSearchParams`로 파생하는 단일 진실 공급원(SSoT). Zustand planStore에 저장하지 않음. `openDetailModal(id)`은 `navigate({ search: '?planId=id' })` 호출만 수행. 모달 닫기는 `setSearchParams({})`" 명시. planStore에서 planDetailId 필드 삭제.
- 상태: 완료

#### BE-01 Refresh Token 서버 측 무효화 수단 없음
- 수정 파일: backend-spec.md, data-model.md, api-spec.md
- 수정 위치: backend-spec.md §5-3, data-model.md §2-1·§2-4, api-spec.md §3-4
- 수정 내용: `users` 테이블에 `refresh_token_hash TEXT NULL` 컬럼 추가. 로그인 시 hash 저장, 로그아웃 시 NULL 설정, refresh 시 DB값과 비교 후 새 hash로 교체 정책 명시.
- 상태: 완료

#### BE-02 Token Rotation 정책 미결
- 수정 파일: backend-spec.md, api-spec.md
- 수정 위치: backend-spec.md §5-3, api-spec.md §3-3
- 수정 내용: Token Rotation 채택 확정. `/auth/refresh` 호출 시 새 access + 새 refresh 발급, DB hash 교체. 재사용 감지 시 전체 세션 폐기(`refresh_token_hash = NULL`) 정책 명시.
- 상태: 완료

#### BE-03 `GET /plans` 정렬 키 미명시
- 수정 파일: backend-spec.md, api-spec.md
- 수정 위치: backend-spec.md §8-2, api-spec.md §4-1
- 수정 내용: 서버 고정 정렬 확정. ORDER BY: `is_completed ASC, priority CASE(high=0/normal=1/low=2) ASC, due_time ASC NULLS LAST, created_at ASC`. 클라이언트 sort 파라미터 없음 명시.
- 상태: 완료

#### BE-04 `category` 필터 다중 값 Zod 스키마 부재
- 수정 파일: backend-spec.md
- 수정 위치: backend-spec.md §8-2
- 수정 내용: `GetPlansQuerySchema` 의사 정의 추가. `category`와 `priority` 모두 `z.preprocess` 패턴으로 단일/다중 값 처리. `uncategorized` boolean 파라미터 추가.
- 상태: 완료

#### BE-05 Prisma `schema.prisma` 의사 정의 부재
- 수정 파일: backend-spec.md
- 수정 위치: backend-spec.md §9-4 (신규 섹션)
- 수정 내용: User·Category·Plan 모델 의사 정의 추가. `onDelete: Cascade/SetNull`, `@@unique([userId, name])`, 인덱스 4개(`@@index`) 선언 포함. `users.email @unique`, `refresh_token_hash` 컬럼 포함.
- 상태: 완료

#### BE-06 회원가입 응답 Access Token 발급 여부 + PRD §10-1 충돌
- 수정 파일: api-spec.md
- 수정 위치: api-spec.md §3-1
- 수정 내용: PRD §10-1 기준으로 "회원가입 성공 시 토큰 미발급, 사용자는 `/login` 리디렉션 후 별도 로그인 단계" 확정. `[확인 필요]` 주석 제거.
- 상태: 완료 (PRD 수정 필요 항목 P-01에 UX 개선 권고 기록)

#### BE-12 Refresh Token 쿠키 Path 설정 — 로그아웃 쿠키 수신 불가
- 수정 파일: backend-spec.md, api-spec.md
- 수정 위치: backend-spec.md §5-4, api-spec.md §3-4
- 수정 내용: (A) 권장안 채택 — Refresh Token 쿠키 Path를 `/api/v1/auth/refresh`에서 `/api/v1/auth`로 변경. refresh + logout 양쪽에서 쿠키 수신 가능. 로그아웃 삭제 헤더에도 동일 Path 명시.
- 상태: 완료

#### DB-01 SQLite FK pragma 미명시
- 수정 파일: data-model.md
- 수정 위치: data-model.md §0 신규 섹션, §8-3
- 수정 내용: "SQLite는 기본적으로 FK 검사 비활성. Prisma 연결 시 매번 `PRAGMA foreign_keys = ON` 실행 필수." 명시. `config/prisma.ts`에서 `$executeRawUnsafe('PRAGMA foreign_keys = ON')` 호출 방법 기술.
- 상태: 완료

#### DB-02 `CURRENT_TIMESTAMP` UTC 반환 — KST 정책과 충돌
- 수정 파일: data-model.md
- 수정 위치: data-model.md §0 신규 섹션, §2-1, §3-1, §4-1
- 수정 내용: "created_at/updated_at/deleted_at은 DB `CURRENT_TIMESTAMP` 미사용. 모든 시각은 애플리케이션에서 `nowKST()` 호출 결과를 명시적으로 전달하여 INSERT/UPDATE." 규칙 명시. 각 테이블 컬럼 정의에서 `DEFAULT CURRENT_TIMESTAMP` → "DB 기본값 없음, 애플리케이션 필수 전달"로 변경.
- 상태: 완료

#### DB-03 categories `(user_id, name)` UNIQUE 부재
- 수정 파일: data-model.md, api-spec.md
- 수정 위치: data-model.md §3-3, §3-4, api-spec.md §2, §5-2, §5-3
- 수정 내용: `@@unique([userId, name])` 추가. 위반 시 에러 코드 `CATEGORY_NAME_ALREADY_EXISTS` (409 Conflict) 정의. api-spec.md 공통 에러 코드 표 및 §5-2·§5-3 에러 표에 추가.
- 상태: 완료

#### DB-06 검색 LIKE 규칙·한국어·FTS5 정책
- 수정 파일: data-model.md
- 수정 위치: data-model.md §9-4 (신규 섹션)
- 수정 내용: 검색 규칙 섹션 추가. 검색 범위=전체 미삭제 레코드(현재 월 한정 없음), SQLite LIKE 한국어 정확 매칭만 지원(부분 자모 분리 검색 불가) 명시, FTS5 MVP 미도입 결정 명시, COLLATE NOCASE는 ASCII에만 적용 명시.
- 상태: 완료

#### DB-07 다중 필터 AND/OR + 미분류 필터
- 수정 파일: api-spec.md, data-model.md
- 수정 위치: api-spec.md §4-1, data-model.md §9-5 (신규 섹션)
- 수정 내용: "필터 조합 규칙: 카테고리 OR + 중요도 OR + 완료 여부 단일 → 세 그룹 간 AND. 미분류 필터링은 `?uncategorized=1` 파라미터 추가." 명시. api-spec.md §4-1 쿼리 파라미터 표에 `uncategorized` 추가.
- 상태: 완료

#### DB-09 카테고리 삭제 트랜잭션 순서
- 수정 파일: data-model.md
- 수정 위치: data-model.md §9-6 (신규 섹션)
- 수정 내용: "카테고리 삭제 트랜잭션 순서: ① `planRepository.updateMany(SET NULL)`, ② `categoryRepository.delete(id)`. Prisma `$transaction` 배열의 선언 순서 = 실행 순서." 명시.
- 상태: 완료

#### DB-12 display_date vs due_date 범위 검증
- 수정 파일: data-model.md
- 수정 위치: data-model.md §4-2
- 수정 내용: "`display_date`는 `due_date`보다 늦을 수 없다." 정책 확정. Zod 스키마 `.refine(d => displayDate <= dueDate)` 적용 명시. 위반 시 422 에러. 과거 날짜 허용. DB CHECK 제약은 SQLite 한계로 애플리케이션 검증으로만 처리 명시.
- 상태: 완료

#### DB-14 Prisma `String @default(now())` + `@updatedAt` 자동 갱신 미보장
- 수정 파일: data-model.md
- 수정 위치: data-model.md §0 신규 섹션, §2-4, §3-4, §4-4, §9-3
- 수정 내용: 모든 Prisma 의사 스키마에서 `@default(now())`와 `@updatedAt` 제거. 대신 컬럼 정의에 주석 "// 애플리케이션에서 nowKST() 필수 전달". `String` 타입 유지 + 애플리케이션 명시 전달 방식 채택.
- 상태: 완료

### 6.3 파일별 변경 요약

| 파일 | 변경 섹션 | 주요 변경 내용 |
|---|---|---|
| frontend-spec.md | §3-3, §3-4, §3-5, §4-1, §4-2 | PlanFilterBar·CalendarDayPopup·SearchResultList 컴포넌트 추가, planStore SSoT 정책, 정렬 정책, PUT 명시, 뒤로가기 정책 |
| wireframe-spec.md | §3, §5 | 필터 칩 그룹 와이어프레임, 미니 팝업 와이어프레임, 검색 모드 와이어프레임, 연필 아이콘, 편집 모드 display_date 정책 |
| screen-flow.md | §2, §3, §5, §8, §15 | 정렬 4순위, 뒤로가기 정책, display_date 비연동, 검색 모드 확정, 연필 아이콘 인터랙션 분리 |
| api-spec.md | §2, §3-1, §3-3, §3-4, §4-1, §5-2, §5-3 | 에러 코드 추가, 회원가입 토큰 미발급 확정, Token Rotation 확정, 로그아웃 쿠키 Path, 정렬·필터 규칙, 카테고리 중복 에러 |
| backend-spec.md | §5-3, §5-4, §8-2, §9-4 | Token Rotation+BE-01 정책, 쿠키 Path 변경, 정렬·Zod 스키마, Prisma 의사 정의 |
| data-model.md | §0, §2-1, §2-4, §3-1, §3-3, §3-4, §4-1, §4-2, §4-4, §8-3, §9-3~§9-6 | FK pragma, KST 타임스탬프 정책, refresh_token_hash, unique 제약, 검색·필터·트랜잭션 규칙, display_date 검증 |

### 6.4 검증 체크리스트

- [x] 22개 필수 수정 항목 모두 패치 반영
- [x] PRD 충돌 시 설계를 PRD에 맞춤 (역방향 수정 없음)
- [x] PRD 자체 수정 필요 항목은 §5에 기록 (P-01~P-05)
- [x] api-spec과 backend-spec의 엔드포인트 일관성 유지
- [x] data-model의 컬럼/제약이 backend-spec의 Prisma 스키마와 일치
- [x] 6개 설계 문서가 서로 모순되지 않음

### 6.5 잔여 권고

보통/낮음 우선순위로 분류되어 이번 패치에서 제외된 18개 항목 중 향후 처리 권장 사항:

| ID | 항목 | 권장 처리 시점 |
|---|---|---|
| FE-05 | D-Day 배지 diff==2 케이스 명시 | 구현 착수 전 (ddayCalc.ts 작성 시) |
| FE-08 | 반응형 최소 지원 뷰포트 확정 | 개발 착수 전 팀 결정 |
| FE-09 | 비밀번호 찾기 링크 미표시 확정 | 개발 착수 전 |
| FE-13 | 토스트 성공 색상 토큰 추가 | 디자인 시스템 구축 시 |
| BE-07 | `GET /plans` total 필드 용도 명시 | API 구현 착수 전 |
| BE-08 | 완료 토글 멱등성 처리 방식 | 구현 착수 전 선택 필요 |
| BE-09 | PUT vs PATCH 일관성 (PRD 수정 후 연동) | PRD 패치 후 |
| BE-10 | authMiddleware 만료 vs 서명 에러 클라이언트 분기 | 인터셉터 구현 시 |
| BE-11 | multer 파일 없음 처리 위치 | 프로필 구현 시 |
| BE-13 | month 필터 31일 하드코딩 → endOfMonth() 사용 | 구현 착수 전 |
| DB-04 | categories is_default 컬럼 여부 | 팀 의사결정 후 |
| DB-05 | soft delete 인덱스 전략 최적화 | 성능 이슈 발생 시 |
| DB-08 | completed_at 컬럼 추가 여부 | 팀 의사결정 후 |
| DB-10 | 마이그레이션 롤백 정책 | 운영 배포 전 |
| DB-11 | 백업·탈퇴 데이터 처리 정책 | 운영 전 |
| DB-13 | 동시성 낙관적 잠금 전략 | 향후 버전 |
