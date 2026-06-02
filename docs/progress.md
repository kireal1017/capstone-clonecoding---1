# progress.md - 스마트 점검 리포트 개발 진행 기록

> 이 문서는 OMC / Claude Code 세션별 진행 상황을 누적 기록하는 단일 진행 관리 문서입니다.  
> 모든 세션은 작업 시작 전 이 문서를 읽고, 작업 종료 후 이 문서를 갱신해야 합니다.

---

## 1. 프로젝트 현재 상태 요약

| 항목 | 상태 | 비고 |
|---|---|---|
| S00 공통 부트스트랩 | 완료 | 모노레포 구조 생성 완료 |
| B01 백엔드 기본 서버 | 완료 | routes/utils 분리, 공통 응답·에러 핸들러 |
| B02 DB Schema / Seed | 완료 | SQLite + better-sqlite3, 13테이블, seed |
| B03 사용자 / 권한 API | 완료 | GET /api/demo/users, POST /api/session/select-user, GET /api/units (X-User-Id 미들웨어) |
| B04 Inspection CRUD | 완료 | draft/submitted/reported |
| B05 Report Snapshot | 완료 | POST /api/inspections/:id/submit, 규칙 기반 등급 산출, report+snapshot 자동 생성, reported 전이 |
| B06 AI GPT API | 완료 | POST /api/ai/inspection-guide, fetch 기반 GPT 호출, 5키 JSON, ai_guides 저장, 금지표현 필터, graceful fallback |
| B07 Report / 공유 / 확인 | 완료 | GET /api/reports[/:id], POST /:id/confirm, POST /:id/share, GET /api/share/:token (만료 없음, 공개) |
| B08 Report 비교 API | 완료 | GET /api/reports/compare, 같은 호실+유형, 수리 전↔후 예외, 자동분석 없음 |
| B-VERIFY 백엔드 전체 검증 | 완료 (통과) | 27개 항목 전부 통과, 결함 0, 수정 불필요 |
| F01 공통 UI 시스템 | 완료 | Vue Router + API client + 14개 공통 컴포넌트 + /ui-preview, DESIGN.md 팔레트 |
| F02 사용자 선택 / 시공업자 시작 | 완료 | / 사용자선택 + /contractor 홈 + /contractor/inspections/new 2단계 흐름 |
| F03 전체 점검 UI | 완료 | 공간별 3상태 빠른 체크 + 이상 항목 상세 + PATCH 저장/하이드레이트 |
| F04 문제 항목 점검 UI | 완료 | issue flow — 분야/문제 항목/상태/위치/증상 + 현장 확인 항목(있음/없음/확인 필요) |
| F05 AI 점검 도우미 UI | 완료 | AI 행동 카드 + 초안 적용 + 최종 의견(수정) + 제출(리포트 생성) |
| F06 이미지 첨부 | 완료 | Base64 변환 + 슬롯 갤러리(유형·설명), 10MB/20장 제한, PATCH images |
| F07 리포트 목록 / 상세 | 완료 | 임대인/임차인 목록·상세, 확인 완료(멱등), 공유 링크 생성, 인쇄/PDF, 수정·삭제 UI 없음 |
| F08 비교 / 공유 / PDF | 완료 | 리포트 비교(불일치 오류), 공유 공개 조회, 인쇄 전용 템플릿 + window.print |
| F-VERIFY Playwright 프론트 전체 검증 | 통과 | Playwright MCP 실브라우저 재검증 완료(18화면 × Mobile/Tablet/Desktop). 발견 결함 3건 즉시 수정. 잔여: /contractor `GET /api/inspections` 404(백엔드 갭, graceful 처리됨) |
| I01 통합 검증 | 통과 | 실브라우저 17개 시나리오 전부 성공(작성→AI→사진→제출→리포트→확인→공유→비교→인쇄). 결함 1건(사진 첨부 이중 file chooser) 수정 |
| I02 시연 데이터 / UX 보정 | 완료 | 16단계 데모 플로우 성공, 발표용 문구 보정, 위험요소 기록. (보정 2차) 리포트 비교 옵션·결과에 `#id` 표기로 동일 라벨 구분, 발표 전 clean seed 재설정 |
| I03 README / 제출 정리 | 완료 | 루트 README 13개 섹션 전면 작성(설치·env·DB·실행·시연 16단계·기능·제외·한계·트러블슈팅), 루트 `db:reset` 스크립트 추가 |

상태값은 다음 중 하나를 사용합니다.

```text
미시작 / 진행 중 / 완료 / 부분 완료 / 보류 / 실패
```

---

## 2. 핵심 결정 사항

| 번호 | 결정 사항 | 내용 |
|---:|---|---|
| 1 | 프로젝트 구조 | 모노레포 |
| 2 | 프론트엔드 | Vue 3 + Vite + Tailwind CSS |
| 3 | 백엔드 | Node.js + Express |
| 4 | DB | SQLite + better-sqlite3 |
| 5 | 이미지 | Base64로 SQLite 저장 |
| 6 | AI | GPT API, 백엔드 호출 |
| 7 | AI 응답 | JSON |
| 8 | PDF | HTML 템플릿 + window.print() |
| 9 | 리포트 | 제출 시 자동 생성, Snapshot JSON 저장 |
| 10 | 리포트 수정/삭제 | 생성 완료 후 불가, 필요 시 새 리포트 생성 |
| 11 | 공유 링크 | 시공업자/임대인/임차인 모두 생성 가능, 만료 없음 |
| 12 | 임차인 의견 | 1차 구현 제외 |
| 13 | 리포트 비교 | 같은 호실 + 같은 점검 유형, 수리 전/후 예외 허용 |
| 14 | 세션 기록 | `docs/progress.md` 하나에 누적 기록 |

---

## 3. 현재 문서 구조

```text
docs/
├─ prd/
├─ specs/
├─ harness/
├─ design/
├─ wireframes/
└─ progress.md
```

---

## 4. 세션 기록 요약

| 세션 ID | 영역 | 상태 | 작업 요약 | 주요 변경 파일 | 검증 결과 | 다음 작업 |
|---|---|---|---|---|---|---|
| S00 | 공통 | 완료 | 모노레포 + Express health + Vite/Tailwind 골격 | 루트/backend/frontend 신규 | health 200, vite ready | B01 |
| B01 | 백엔드 | 완료 | routes/utils 분리, 공통 응답·에러 핸들러 구축 | backend/src/app.js, routes/health.js, utils/response.js | health 200, 404 일관 응답 | B02 |
| B02 | 백엔드 | 완료 | better-sqlite3 설치, 13개 테이블 schema, seed 데이터, db:init/seed/reset 스크립트 | backend/src/db/connection.js, schema.sql, init.js, seed.js, backend/package.json | 13테이블 생성, seed counts 확인, comparable 그룹 1건, health 200 | B03 |
| B03 | 백엔드 | 완료 | GET /api/demo/users, POST /api/session/select-user, GET /api/units + requireUserId 미들웨어 (역할별 호실 필터) | backend/src/routes/demo.js, session.js, units.js, middleware/auth.js, routes/index.js | demo/users 3명, session 정상/401, units 역할 필터 10시나리오 통과 | B04 |
| B04 | 백엔드 | 완료 | inspections CRUD + 상태 머신 + 자식 행 replace + reported 차단 | backend/src/{routes/inspections,services/inspectionFlow,db/repositories/inspections}.js + routes/index.js | 15 시나리오 통과 (생성/조회/수정/삭제/권한/상태) | B05 |
| B05 | 백엔드 | 완료 | POST /:id/submit — 규칙 기반 등급 산출 + report/snapshot 자동 생성 + reported 전이 (단일 트랜잭션) | backend/src/services/{grading,reportSnapshot}.js, db/repositories/reports.js, routes/inspections.js, utils/errors.js | 등급 A~E 매트릭스 통과, submit 201, 중복 409, reported PATCH/DELETE 403, 권한 401/403, 스냅샷 불변성 실증 | B06 |
| B06 | 백엔드 | 완료 | POST /api/ai/inspection-guide — fetch 기반 GPT 호출, 2개 시스템 프롬프트 1회 호출 병합, 5키 JSON, ai_guides 저장, 금지표현 필터, graceful fallback | backend/src/services/{aiClient,aiGuide}.js, db/repositories/aiGuides.js, routes/ai.js, routes/index.js, app.js, .env.example | 실 GPT 호출 200/fallback=false/5키, ai_guides 저장, B05 스냅샷에 aiGuide 임베드, 금지표현 치환, NO_API_KEY→fallback | B07 |
| B07 | 백엔드 | 완료 | Report 목록/상세 + 확인 완료(owner/tenant 멱등·독립) + 공유 링크 생성/공개 조회 (역할별 접근, 만료 없음) | backend/src/db/repositories/reports.js(확장), routes/reports.js, routes/share.js, routes/index.js | 역할별 목록(누수 0), 상세 200/403/404, 확인 멱등·독립 2건, contractor 확인 403, 공유 토큰 생성+무인증 공개 조회(마스킹 없음), 잘못된 토큰 404 | B08 |
| B08 | 백엔드 | 완료 | GET /api/reports/compare — 같은 호실+유형 2개 비교, 수리 전↔후 예외, 자동 분석/책임판단 없음, 두 snapshot+compareMeta+validation 반환 | backend/src/routes/reports.js(/compare를 /:id 앞에 등록) | 비교 200(snapshot 2개), 수리 전↔후 예외 200(sameType=false/exc=true), 유형 불일치·다른 호실·파라미터 누락·동일 id 400, 미존재 404, 권한없음 403, 라우트 순서 실증 | B-VERIFY |
| B-VERIFY | 백엔드 | 완료 (통과) | 실서버 기동 + 전체 API 호출로 B01~B08 27개 항목 검증. 결함 0, 코드 수정 없음 | (검증 전용 — 코드 변경 없음) | 27/27 통과: health/demo/auth/units/CRUD/상태머신/submit·report/snapshot/등급·E등급/AI·prompts·fallback/목록·상세·확인·공유·비교/오류형식 | F01 |
| F01 | 프론트 | 완료 | Vue Router 설치·구성, API client(VITE_API_BASE_URL+X-User-Id), DESIGN.md 팔레트 적용, 14개 공통 UI 컴포넌트, /ui-preview 쇼케이스, S00 보일러플레이트 제거 | frontend/{router,api/client,lib/session}.js, tailwind.config, style.css, src/components/ui/*(14), src/views/*(7), App.vue, main.js, .env | npm run build 0 에러(50모듈), dev 서버 /·/ui-preview 200, 14컴포넌트 빌드 | F02 |
| F02 | 프론트 | 완료 | 데모 사용자 선택(localStorage 영속·역할 라우팅) + 시공업자 홈(카드형) + 새 점검 2단계(목적 SelectCard → 대상 입력 → POST 생성) | src/views/{Home,ContractorHome,NewInspection,InspectionDetail}.vue, constants/inspectionTypes.js, router/index.js | build 0 에러(55모듈), dev /·/contractor·/inspections/new 200, demo/users·units·POST inspections 실연동(id 반환), 역할 가드 | F03 |
| F03 | 프론트 | 완료 | 전체 점검(whole) 작성 UI — 8공간 빠른 체크(정상/주의/수리 필요 3상태) + 이상 항목만 상세(위치·설명) + PATCH 전체 items 저장 + GET 하이드레이트 병합 | src/views/InspectionDetail.vue(전면 교체), constants/inspectionSpaces.js | build 0 에러(56모듈), 실서버 라운드트립(PATCH 전체배열→GET 복원, state/location/description 유지, replace 의미 검증), flow!=='whole'·reported 분기 | F04 |
| F04 | 프론트 | 완료 | 문제 항목 점검(issue) UI — 분야(5)→문제 항목→상태(주의/수리 필요)→위치→증상 + 현장 확인 항목(있음/없음/확인 필요, 직접 선택). InspectionDetail을 dispatcher로 리팩터, whole/issue 분리 | src/views/inspection/{WholeInspection,IssueInspection}.vue, InspectionDetail.vue(dispatcher), constants/inspectionFields.js | build 0 에러(59모듈), whole 회귀 무사, issue 라운드트립(items+observations, inspectionItemId=null FK안전), urgent+repair→E 등급 실증 | F05 |
| F05 | 프론트 | 완료 | AI 점검 도우미(행동 카드) + opinionDraft 초안 적용 + 시공업자 최종 의견(수정) + 점검 제출(저장→submit→리포트). whole/issue 양 흐름 마지막 단계 | src/components/inspection/AiOpinionPanel.vue(공용), WholeInspection.vue·IssueInspection.vue(단계 추가) | build 0 에러, 실 GPT 5키 카드, finalOpinion PATCH 영속, 제출 시 snapshot.finalOpinion=수정본(초안 아님) 실증, ai_guide 스냅샷 임베드, fallback 수동작성 | F06 |
| F06 | 프론트 | 완료 | 이미지 첨부 — 파일 선택→Base64(접두어 제거) 변환, 슬롯 갤러리(사진 유형 6종·설명), 10MB/장·20장 제한 + 오류, PATCH images(전체 교체, inspectionItemId=null) | src/components/inspection/PhotoManager.vue, constants/photoTypes.js, WholeInspection.vue·IssueInspection.vue | build 0 에러(62모듈), images 라운드트립(base64·photoType·caption 유지, itemId null), replace 의미, 제출 시 snapshot.images에 base64 포함 | F07 |
| F07 | 프론트 | 완료 | 임대인/임차인 리포트 목록·상세(snapshot 문서 렌더) + 확인 완료(멱등·독립) + 공유 링크 생성(URL+복사) + 인쇄/PDF. 수정·삭제 UI·임차인 의견 UI 없음 | src/views/reports/{ReportList,ReportDetail}.vue, router/index.js (OwnerReports/TenantReports 스텁 삭제) | build 0 에러, 역할별 목록, 상세(items/images/finalOpinion/confirmations/shareLinks), 확인 owner→already true 멱등·tenant 독립, 공유 201, tenant 타호실 403 | F08 |
| F08 | 프론트 | 완료 | 리포트 비교(/owner/compare, 불일치 시 백엔드 오류 표시·자동판단 없음) + 공유 링크 공개 조회(/share/:token, 조회·PDF만) + 인쇄 전용 템플릿(/reports/:id/print, @media print margin, window.print). 공용 ReportDocument 추출 | src/components/inspection/ReportDocument.vue, src/views/{ShareView, reports/{CompareView,PrintView}}.vue, ReportDetail.vue(리팩터), ReportList.vue(비교 버튼), router | build 0 에러(66모듈), compare 200/불일치 400 메시지, 공유 무인증 조회(이름 노출), 잘못된 토큰 404, 인쇄 소스 GET 정상 | F-VERIFY |
| F-VERIFY | 프론트 | 부분 통과 (보류) | (1차) Playwright MCP 미연결로 실브라우저 검증 불가 → 대체 검증(빌드·dev기동·18라우트 SPA 응답·정적 디자인/정책 감사) 수행. 실렌더링·콘솔/네트워크·3 viewport는 보류 | (검증 전용, 코드 변경 없음) | build 0에러, 백+프론트 dev 200, 18라우트 200, 팔레트 토큰·flat(shadow/gradient 0)·pill버튼 0·리포트 수정삭제/임차인의견 UI 0·공유 read-only·print CSS 확인 | I01 |
| F-VERIFY(재검증) | 프론트 | 통과 | (2차) Playwright MCP 실브라우저로 18화면 × 3 viewport 검증. 데모 전 플로우 직접 조작(점검 작성→AI→제출→리포트→확인→공유→비교→인쇄). 결함 3건 발견·수정 | frontend/src/views/reports/ReportList.vue, frontend/src/components/inspection/ReportDocument.vue | 18화면 렌더 정상, 결함 3건 수정 후 콘솔 클린(잔여 1건은 백엔드 갭), 팔레트 런타임 일치, 반응형(모바일 stacked/태블릿·데스크톱 side-by-side) 정상, build 0에러 | I03 |
| I02 | 통합 | 완료 | 발표 시연 데이터·UX 보정 — 16단계 데모 플로우 실서버 1회 성공(=I01 통합 점검 겸함), 발표용 문구 보정, 위험요소 기록 | frontend/src/views/{ContractorHome,NewInspection}.vue(문구만) | 16단계 전부 성공(B등급 리포트 생성·공유 공개조회·비교 valid), build 0에러, 구조 변경 없음 | I03 |
| I01(재검증) | 통합 | 통과 | 프론트/백 통합 17개 시나리오 실브라우저 검증. 실제 이미지 업로드까지 포함해 Base64→PATCH→submit→snapshot→리포트/공유/인쇄/비교 렌더 전구간 확인. 결함 1건(사진 첨부 이중 file chooser) 수정 + 위험 1건 기록 | frontend/src/components/inspection/PhotoManager.vue | 17/17 시나리오 성공, 리포트 id=4(A등급)+이미지 base64 스냅샷 임베드·상세/공유/인쇄/비교에서 정상 렌더(broken 0), 콘솔 클린(잔여 1=백엔드 갭), API 계약 sweep 200, build 0에러 | I03 |
| I02(보정) | 통합 | 완료 | 발표 시연 UX 보정 2차 — 리포트 비교에서 동일 호실·유형·등급·날짜 리포트가 드롭다운/결과에서 구분 안 되는 문제 수정(`#id` 표기). 발표 전 clean seed 재설정 | frontend/src/views/reports/CompareView.vue | 비교 옵션/요약/패널 헤더에 #id 표기 실브라우저 확인(#3 vs #4 구분, #4↔#1 비교 valid), 콘솔 0 error, build 0에러, seed 비교 그룹(unit1 move_in ×2) 유지 | I03 |
| FIX-01 | 프론트(+백 1건) | 완료 | 사용자 직접 테스트 피드백 7건 반영(사용자선택 UI·footer overlap·제출후 이동/토스트·문제항목 검증·임시저장·뒤로가기 확인·비교 오류 한국어/인쇄 2열). 전역 토스트·ConfirmDialog 신설, GET /api/inspections 추가 | frontend: lib/toast.js, components/ui/{ToastHost,ConfirmDialog}.vue, App·AppLayout·SelectCard·Home·NewInspection·ContractorHome·Whole/IssueInspection·CompareView / backend: routes·repositories/inspections.js | 7/7 실브라우저 재검증, build 0에러, 목록 API 200/403 | F-VERIFY 재검증 / I03 |
| I03 | 통합 | 완료 | 루트 README 전면 작성(13개 섹션: 소개·스택·구조·설치·env·DB초기화·백/프론트 실행·시연 16단계·기능·제외·한계·트러블슈팅). 루트 `db:reset` 스크립트 추가. .env.example 점검(실키 없음) | README.md, package.json | README만으로 신규 사용자 실행 가능, 실키 미포함, 제외·한계 명시, 시연 순서 명확 | 제출 준비 완료 |

---

## 5. 상세 세션 기록

### S00 공통 부트스트랩

| 항목 | 내용 |
|---|---|
| 세션 ID | S00 |
| 영역 | 공통 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T07:48:00Z |
| 담당 목표 | 모노레포 초기 구조 생성 |
| 사용 문서 | PRD, 하네스, DESIGN.md |

#### 구현 내용

- 루트 .gitignore, package.json, README.md 생성
- backend/ npm init, package.json (ESM, node --watch), express/cors/dotenv 설치
- backend/src/app.js — Express 헬스체크 `/api/health` 구현
- backend/.env.example, backend/.gitignore, backend/database/.gitkeep 생성
- backend/prompts/inspection-guide.system.md — PRD §11.1 원문 복사
- backend/prompts/opinion-draft.system.md — PRD §11.2 원문 복사
- frontend/ — npm create vite@latest --template vue 스캐폴드
- frontend/ npm install, tailwindcss@^3.4.0 + postcss + autoprefixer 설치
- tailwind.config.js content 배열 설정, style.css 상단 @tailwind 3줄 추가
- src/App.vue Vite 기본 HelloWorld 제거, 최소화 완료

#### 수정/생성한 파일

- `.gitignore` (신규)
- `package.json` (신규)
- `README.md` (신규)
- `backend/package.json` (신규)
- `backend/src/app.js` (신규)
- `backend/.env.example` (신규)
- `backend/.gitignore` (신규)
- `backend/database/.gitkeep` (신규)
- `backend/prompts/inspection-guide.system.md` (신규)
- `backend/prompts/opinion-draft.system.md` (신규)
- `frontend/` (Vite 스캐폴드 신규)
- `frontend/tailwind.config.js` (content 배열 수정)
- `frontend/src/style.css` (@tailwind 3줄 추가)
- `frontend/src/App.vue` (최소화)

#### 실행 명령

```bash
npm --prefix backend run dev
curl http://localhost:3000/api/health
npm --prefix frontend run dev
```

#### 검증 결과

| 검증 항목 | 결과 | 비고 |
|---|---|---|
| GET /api/health | 200 OK | {"ok":true,"service":"smart-inspection-backend"} |
| Vite dev 서버 | ready | "ready in 3027 ms", Local: http://localhost:5173 |

#### 실패/보류/TODO

- 없음

#### 다음 세션 인수인계

- B01 — backend/ 구조 확장: routes/, controllers/, services/, db/ 디렉터리 + SQLite better-sqlite3 연동

---

### B01 백엔드 기본 서버 구조

| 항목 | 내용 |
|---|---|
| 세션 ID | B01 |
| 영역 | 백엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T07:57:00Z |
| 담당 목표 | routes/utils 분리, 공통 응답·에러 핸들러 구축 |
| 사용 문서 | 백엔드_PRD_세션별.md §3, 개발_하네스 |

#### 구현 내용

- `backend/src/utils/response.js` — ok/fail/sendOk/sendFail 공통 헬퍼 (success 별칭 포함)
- `backend/src/utils/errors.js` — HttpError 클래스 + notFoundHandler/errorHandler (BAD_JSON, PAYLOAD_TOO_LARGE 포함)
- `backend/src/routes/index.js` — /api 라우터 진입점 (B03~B08 마운트 지점 확보)
- `backend/src/routes/health.js` — GET `/api/health` 라우터 분리 (sendOk 사용으로 통일)
- `backend/src/app.js` — apiRouter 마운트, notFoundHandler/errorHandler 교체
- GET /api/health 응답 포맷 변경: `{ok, service, time}` → `{ok, data:{service, time}}`
- error 응답 포맷 변경: `{ok:false, error:"CODE"}` → `{ok:false, error:{code, message, details?}}`

#### 수정/생성한 파일

- `backend/src/app.js` (수정)
- `backend/src/utils/response.js` (신규 → 보완: ok/fail/sendOk/sendFail 헬퍼 추가)
- `backend/src/utils/errors.js` (신규: HttpError 클래스 + notFoundHandler/errorHandler)
- `backend/src/routes/index.js` (신규: /api 라우터 진입점)
- `backend/src/routes/health.js` (신규 → 보완: sendOk 사용으로 통일)

#### 실행 명령

```bash
npm --prefix backend run dev
```

#### 검증 결과

| 검증 항목 | 결과 | 응답 본문 |
|---|---|---|
| GET /api/health | 200 OK | `{"ok":true,"data":{"service":"smart-inspection-backend","time":"..."}}` |
| GET /api/missing | 404 | `{"ok":false,"error":{"code":"NOT_FOUND","message":"route not found: GET /api/missing"}}` |
| POST /api/health (broken JSON) | 400 | `{"ok":false,"error":{"code":"BAD_JSON","message":"invalid JSON body"}}` |

#### 실패/보류/TODO

- 없음

#### 다음 세션 인수인계

- B02 — SQLite + better-sqlite3 DB schema 및 seed 데이터

---

### B02 DB Schema / Seed

| 항목 | 내용 |
|---|---|
| 세션 ID | B02 |
| 영역 | 백엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T08:17:00Z |
| 담당 목표 | better-sqlite3 연결, 13개 테이블 schema, seed 데이터, db 스크립트 |
| 사용 문서 | 백엔드_PRD_세션별.md §4, PRD §13·§18·§20 |

#### 구현 내용

- `backend/src/db/connection.js` — better-sqlite3 싱글턴 getDb/closeDb, backend/database/ 디렉터리 자동 생성 (정정 라운드 1: 경로 ../../../→../../ 수정)
- `backend/src/db/schema.sql` — 13개 테이블 DDL (정정 라운드 1: 컬럼명/enum 명세 일치 — unit_label/role_in_unit/contractor_user_id/flow/snapshot_json/confirmed_role 등, buildings.owner_id 제거, units.floor 제거)
- `backend/src/db/init.js` — schema 적용 스크립트 (--force 시 전체 DROP 후 재생성)
- `backend/src/db/seed.js` — 데모 seed: users 3, buildings 2, units 3(1203호/201호/703호), unit_users 7, inspections 5(move_in/periodic/urgent), reports 3, report_snapshots 3 (정정 라운드 1: 명세대로 재작성)
- `backend/package.json` — db:init / db:init:force / db:seed / db:reset 스크립트 추가
- `backend/.gitignore` — *.sqlite-wal / *.sqlite-shm 추가
- better-sqlite3 ^12.10.0 설치

#### 수정/생성한 파일

- `backend/src/db/connection.js` (신규)
- `backend/src/db/schema.sql` (신규)
- `backend/src/db/init.js` (신규)
- `backend/src/db/seed.js` (신규)
- `backend/package.json` (스크립트·의존성 추가)

#### 실행 명령

```bash
npm --prefix backend install better-sqlite3
npm --prefix backend run db:reset
```

#### 검증 결과

| 검증 항목 | 결과 | 비고 |
|---|---|---|
| 테이블 13개 생성 | 성공 | ai_guides, buildings, inspection_images, inspection_items, inspection_observations, inspections, report_confirmations, report_snapshots, reports, share_links, unit_users, units, users |
| seed counts | 성공 | users=3, buildings=2, units=3(1203호/201호/703호), unit_users=7, inspections=5, inspection_items=20, inspection_images=6, reports=3, report_snapshots=3 |
| 비교 가능 그룹 | 성공 | [{unit_id:1, inspection_type:'move_in', n:2}] — 1203호(unit_id=1) 입주전 2건 |
| inspection_type | 성공 | move_in / periodic / urgent 포함 |
| GET /api/health | 200 OK | {"ok":true,"data":{"service":"smart-inspection-backend","time":"..."}} |

#### 실패/보류/TODO

- 없음

#### 다음 세션 인수인계

- B03 — 데모 사용자 및 권한 API (GET /api/demo/users, POST /api/session/select-user, GET /api/units)

---

### B03 사용자 / 권한 API

| 항목 | 내용 |
|---|---|
| 세션 ID | B03 |
| 영역 | 백엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T09:00:00Z |
| 담당 목표 | 데모 사용자 목록, 세션 선택, 호실 권한 API 구현 |
| 사용 문서 | 백엔드_PRD_세션별.md §5, PRD §6, §19.1, §19.2 |

#### 구현 내용

- `backend/src/db/repositories/users.js` — findUserById, listAllUsers (정정 라운드 1: 신규)
- `backend/src/db/repositories/units.js` — listUnitsForUser(userId, roleInUnit): JOIN 쿼리 + 카멜케이스/중첩 매핑 (정정 라운드 1: 신규)
- `backend/src/middleware/auth.js` — `requireUser` 미들웨어 (X-User-Id 헤더 우선, ?userId 쿼리 폴백), 검증 통과 시 `req.user = {id, name, role}` 설정 (정정 라운드 1: requireUserId→requireUser, req.currentUser→req.user, 인라인 SQL 제거 후 repository 사용)
- `backend/src/routes/demo.js` — GET `/api/demo/users`: listAllUsers 사용
- `backend/src/routes/session.js` — POST `/api/session/select-user`: findUserById 사용, userId 누락 400, 잘못된 ID 401
- `backend/src/routes/units.js` — GET `/api/units`: `requireUser` 적용, `listUnitsForUser` 호출, 응답은 `{units}`만 (정정 라운드 1: data.user 제거, 카멜케이스+중첩 응답)
- `backend/src/routes/index.js` — demo/session/units 라우터 마운트

#### 수정/생성한 파일

- `backend/src/db/repositories/users.js` (신규 — 정정 라운드 1)
- `backend/src/db/repositories/units.js` (신규 — 정정 라운드 1)
- `backend/src/middleware/auth.js` (신규 → 정정 라운드 1: requireUser/req.user 통일 + repository 사용)
- `backend/src/routes/demo.js` (신규 → 정정 라운드 1: repository 사용)
- `backend/src/routes/session.js` (신규 → 정정 라운드 1: repository 사용)
- `backend/src/routes/units.js` (신규 → 정정 라운드 1: 응답 카멜케이스+중첩, data.user 제거)
- `backend/src/routes/index.js` (수정: 3개 라우터 마운트)

#### 검증 결과

| 검증 항목 | 결과 | 응답 요약 |
|---|---|---|
| GET /api/demo/users | 200 OK | 이시공/김임대/박임차 3명 |
| POST /api/session/select-user userId=2 | 200 OK | 김임대 owner |
| POST /api/session/select-user 빈 body | 400 BAD_REQUEST | userId is required |
| POST /api/session/select-user userId=999 | 401 UNAUTHORIZED | user not found |
| GET /api/units 헤더 없음 | 401 UNAUTHORIZED | X-User-Id header is required |
| GET /api/units X-User-Id:1 이시공 | 200 OK | 3호실 (1203/201/703), 각 `{id, unitLabel, building:{id,name,address}, roleInUnit:'contractor'}` |
| GET /api/units X-User-Id:2 김임대 | 200 OK | 3호실 (1203/201/703), roleInUnit='owner', 카멜케이스+중첩 |
| GET /api/units X-User-Id:3 박임차 | 200 OK | 1203호 1개, `{id:1, unitLabel:"1203호", building:{id:1, name:"노원 햇살아파트", ...}, roleInUnit:"tenant"}` |
| GET /api/units X-User-Id:999 | 401 UNAUTHORIZED | user not found |
| GET /api/units?userId=3 | 200 OK | 박임차 1203호 1개 |

#### 실패/보류/TODO

- 없음

#### 다음 세션 인수인계

- B04 — Inspection CRUD (draft/submitted/reported)

---

### B04 Inspection CRUD

| 항목 | 내용 |
|---|---|
| 세션 ID | B04 |
| 영역 | 백엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T09:01:00Z |
| 담당 목표 | POST/GET/PATCH/DELETE /api/inspections + items/observations/images 자식 행 replace + 상태 머신 + reported 차단 |
| 사용 문서 | 백엔드_PRD_세션별.md §6, PRD §6, §8, §13.4, §19.3 |

#### 구현 내용

- `backend/src/services/inspectionFlow.js` — `resolveFlow(inspectionType)`: 7가지 타입 → flow 자동 결정 (move_in/periodic→whole, 나머지→issue), 잘못된 값이면 422 validationError
- `backend/src/db/repositories/inspections.js` — findInspectionById(중첩 items/observations/images), hasContractorPermissionOnUnit, createInspection, updateInspectionMeta, deleteInspection, replaceItems, replaceObservations, replaceImages
- `backend/src/routes/inspections.js` — 4개 라우트 (POST/GET/:id/PATCH/:id/DELETE/:id), requireUser 미들웨어, contractor 역할 검증, 본인 소유 검증, reported 차단, PATCH status는 draft/submitted만 허용
- `backend/src/routes/index.js` — inspectionsRouter 마운트 추가

#### 수정/생성한 파일

- `backend/src/services/inspectionFlow.js` (신규)
- `backend/src/db/repositories/inspections.js` (신규)
- `backend/src/routes/inspections.js` (신규)
- `backend/src/routes/index.js` (수정: inspections 마운트)

#### 실행 명령

```bash
npm --prefix backend run dev
```

#### 검증 결과

| # | 시나리오 | HTTP | 결과 |
|---|---|---|---|
| 1 | POST 헤더 없음 | 401 | UNAUTHORIZED: X-User-Id header is required |
| 2 | POST owner(id=2) 시도 | 403 | FORBIDDEN: only contractor can manage inspections |
| 3 | POST unitId 누락 | 400 | BAD_REQUEST: unitId is required |
| 4 | POST 잘못된 type(oops) | 422 | VALIDATION_ERROR: invalid inspectionType |
| 5 | POST urgent 정상 (items 1개) | 201 | flow="issue", status="draft", id=6, items 1개 포함 |
| 6 | GET /inspections/6 본인 | 200 | 동일 inspection 객체 반환 |
| 7 | GET /inspections/99999 | 404 | NOT_FOUND: inspection not found |
| 8 | GET /inspections/6 다른 사용자(id=2) | 403 | FORBIDDEN: only contractor can manage inspections |
| 9 | PATCH finalOpinion 추가 | 200 | finalOpinion="확인 완료" 반영, updatedAt 갱신 |
| 10 | PATCH /inspections/1 (reported) | 403 | FORBIDDEN: reported inspection cannot be modified |
| 11 | PATCH status="reported" 직접 설정 | 400 | BAD_REQUEST: status can only be set to draft or submitted |
| 12 | DELETE /inspections/6 | 200 | {deleted:true, id:6} |
| 13 | GET /inspections/6 삭제 후 | 404 | NOT_FOUND: inspection not found |
| 14 | DELETE /inspections/2 (reported) | 403 | FORBIDDEN: reported inspection cannot be deleted |
| 15 | GET /inspections/4 (seed draft) | 200 | status="draft", items 2개 포함 |

#### 실패/보류/TODO

- 없음

#### 다음 세션 인수인계

- B05 — 등급 산출 + Report Snapshot 자동 생성 (POST /api/inspections/:id/submit)

---

### B05 등급 산출 및 Report Snapshot 생성

| 항목 | 내용 |
|---|---|
| 세션 ID | B05 |
| 영역 | 백엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T10:30:00Z |
| 담당 목표 | POST /api/inspections/:id/submit — 규칙 기반 등급 산출 + reports/report_snapshots 자동 생성 + inspection reported 전이 |
| 사용 문서 | 백엔드_PRD_세션별.md §7, PRD §11·§13, 기능명세서 v3.0 |

#### 구현 내용

- `backend/src/services/grading.js` — `computeGrade({flow, inspectionType, items})` 순수 함수 (DB 미접근, AI 미사용)
  - Auto-E(두 flow 공통, 최우선): `category==='fire_safety' && state==='repair_needed'` → E
  - whole: repair≥2→D / (caution≥3 또는 repair===1)→C / caution≥1→B / else A
  - issue: (inspectionType==='urgent' && repair≥1)→E / repair≥1→D / caution≥1→C / else B (issue는 A 미반환)
- `backend/src/db/repositories/reports.js` — `getUnitWithBuilding`, `getUnitParticipants`(role별 첫 사용자), `getLatestAiGuide`(없거나 parse 실패 시 null), `findReportByInspectionId`, `createReportWithSnapshot`(단일 트랜잭션: report INSERT → reportId 주입 → snapshot INSERT → inspections.status='reported')
- `backend/src/services/reportSnapshot.js` — `buildSnapshot(...)`: 제출 시점 데이터의 불변 복사본 객체 생성. seed 스냅샷 shape 준수(report/inspection/unit/participants/items/observations/images(full base64)/aiGuide/finalOpinion/caution). report.id는 insert 이후 트랜잭션 내부에서 주입
- `backend/src/utils/errors.js` — `conflict(message, details)` 409 CONFLICT 헬퍼 추가
- `backend/src/routes/inspections.js` — `POST /:id/submit` 추가: requireUser→contractor 검증→소유 검증→reported/기존 report 중복 차단(409)→필수값 검증(items≥1, whole flow 전 항목 state 필수)→등급 산출→snapshot 생성→`{reportId, grade}` 201 반환

#### 수정/생성한 파일

- `backend/src/services/grading.js` (신규)
- `backend/src/services/reportSnapshot.js` (신규)
- `backend/src/db/repositories/reports.js` (신규)
- `backend/src/utils/errors.js` (수정: conflict 409 헬퍼 추가)
- `backend/src/routes/inspections.js` (수정: POST /:id/submit + imports)

#### 실행 명령

```bash
npm --prefix backend run db:reset
npm --prefix backend run dev   # POST http://localhost:3000/api/inspections/:id/submit
```

#### 검증 결과

| # | 시나리오 | HTTP | 결과 |
|---|---|---|---|
| 1 | POST /inspections/4/submit (whole, normal+caution) | 201 | reportId=4, grade=B |
| 2 | POST /inspections/4/submit 재호출 | 409 | CONFLICT: inspection already reported |
| 3 | PATCH /inspections/4 (reported) | 403 | FORBIDDEN |
| 4 | DELETE /inspections/4 (reported) | 403 | FORBIDDEN |
| 5 | POST /inspections/5/submit (urgent, issue, repair 없음) | 201 | grade=B |
| 6 | POST /inspections/1/submit (seed reported) | 409 | CONFLICT |
| 7 | POST submit 헤더 없음 | 401 | UNAUTHORIZED |
| 8 | POST submit owner(id=2) | 403 | FORBIDDEN: only contractor |
| 9 | 등급 매트릭스: all normal | - | A |
| 10 | 등급 매트릭스: caution 3개 | - | C |
| 11 | 등급 매트릭스: repair_needed 2개 | - | D |
| 12 | 등급 매트릭스: fire_safety repair_needed | - | E (auto) |
| 13 | 스냅샷 내용 | - | report.id=4, grade=B, unit/building/participants/items/caution 포함, status=reported |
| 14 | 스냅샷 불변성 | - | 제출 후 inspection_items를 repair_needed로 직접 변경해도 snapshot은 normal,caution 유지 |

#### 실패/보류/TODO

- 없음
- 비고: issue flow 항목의 `state`가 비어 있으면 등급은 B로 산출됨(현 규칙상 정상). 추후 issue flow의 심각도 표현 방식이 정해지면 재검토 가능.

#### 다음 세션 인수인계

- B06 — AI GPT API 연동 (POST /api/ai/inspection-guide, ai_guides 저장, JSON 강제, 금지 표현 필터, graceful fallback). 스냅샷은 이미 `getLatestAiGuide`로 AI 가이드를 포함하므로 B06 이후 제출 시 자동 반영됨

---

### B06 AI GPT API 연동

| 항목 | 내용 |
|---|---|
| 세션 ID | B06 |
| 영역 | 백엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T11:30:00Z |
| 담당 목표 | POST /api/ai/inspection-guide — GPT 호출로 AI 점검 도우미 JSON 생성, ai_guides 저장, 금지표현 필터, graceful fallback |
| 사용 문서 | 백엔드_PRD_세션별.md §8, PRD §11, 개발 하네스 |

#### 구현 내용

- `backend/src/services/aiClient.js` — `callOpenAIChatJson({systemPrompts, userContent, timeoutMs})`: 의존성 없이 global `fetch`로 OpenAI Chat Completions 호출. system 프롬프트 N개 + merge 지침 + user 메시지를 한 번에 전송, `response_format: { type:'json_object' }`, `AbortController` 타임아웃(기본 20s). 키 없으면 `NO_API_KEY` throw, 비정상 응답 시 `OPENAI_HTTP_<status>` throw
- `backend/src/services/aiGuide.js` — 두 프롬프트 파일을 모듈 로드 시 1회 읽어 캐시. `generateInspectionGuide(context)`(절대 throw 안 함, 실패 시 fallback), `sanitizeGuide`(금지표현 → '추가 확인 필요' 치환, filtered 플래그), `normalizeShape`(5키 타입 보장), `FALLBACK_GUIDE`, `BANNED_PHRASES`
- `backend/src/db/repositories/aiGuides.js` — `saveAiGuide(inspectionId, guideObject)`(JSON.stringify 저장), `inspectionExists(id)`
- `backend/src/routes/ai.js` — `POST /inspection-guide`: 컨텍스트로 가이드 생성 → inspectionId가 유효&존재하면 ai_guides 저장(saved 플래그) → **항상 HTTP 200**(fallback 포함)으로 `{guide, fallback, filtered, saved, aiGuideId?}` 반환. 저장 실패도 응답을 막지 않음
- `backend/src/routes/index.js` — `/ai` 라우터 마운트
- `backend/src/app.js` — cwd 무관하게 backend/.env를 명시 경로로 로드하도록 dotenv 수정(키는 환경변수에서도 로드됨)
- `backend/.env.example` — `OPENAI_MODEL=gpt-4o-mini` 문서화 (실제 키 미포함)

#### 모델/키 정책

- `OPENAI_API_KEY`는 백엔드 환경변수/backend/.env에서만 읽음. 프론트엔드 노출 없음. 모델은 `OPENAI_MODEL`(기본 `gpt-4o-mini`)
- AI는 등급을 정하지 않으며 이미지 판독 안 함. 금지표현 7종은 응답 후처리로 중립 치환

#### 실행 명령

```bash
npm --prefix backend run dev
# POST http://localhost:3000/api/ai/inspection-guide  body: { inspectionId?, ...context }
```

#### 검증 결과

| # | 시나리오 | 결과 |
|---|---|---|
| 1 | 실 GPT 호출 (inspectionId=4, 누수 컨텍스트) | 200, fallback=false, 5키(summary/actionCards/requiredDocuments/cautionPhrases/opinionDraft) 모두 채워짐, 한국어 정상 |
| 2 | ai_guides 저장 | saved=true, aiGuideId=1, response_json 파싱 가능 |
| 3 | B05 스냅샷 연동 | inspection 4 제출 시 snapshot.aiGuide가 저장된 가이드로 임베드(opinionDraft 일치) — B05↔B06 통합 실증 |
| 4 | 금지표현 필터 | '임차인 책임/임대인 책임/고의/과실 확정/보증금 공제/소송에서 유리/판례상 확정' 전부 '추가 확인 필요'로 치환, 누출 0, filtered=true |
| 5 | graceful fallback | 키 제거 시 NO_API_KEY → fallback=true, FALLBACK_GUIDE(5키) 반환, 점검 흐름 차단 없음 |

#### 실패/보류/TODO

- 없음
- 비고: `openai` SDK 미설치 — global `fetch`로 직접 호출(추가 의존성 없음). 모델은 `gpt-4o-mini` 기본값, 필요 시 `OPENAI_MODEL`로 교체 가능

#### 다음 세션 인수인계

- B07 — Report 조회/확인 완료/공유 링크 (GET /api/reports, GET /api/reports/:id, POST /api/reports/:id/confirm, POST /api/reports/:id/share, GET /api/share/:token). 역할별 접근 제한, 공유 링크 만료/비밀번호/마스킹 없음, 공유 접근자는 조회/PDF만

---

### B07 Report 조회 / 확인 완료 / 공유 링크

| 항목 | 내용 |
|---|---|
| 세션 ID | B07 |
| 영역 | 백엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T12:30:00Z |
| 담당 목표 | 리포트 목록/상세, 임대인·임차인 확인 완료, 공유 링크 생성 및 공개 조회 |
| 사용 문서 | 백엔드_PRD_세션별.md §9, PRD §6·§15·§17·§19 |

#### 구현 내용

- 접근 규칙: **리포트는 `unit_users(unit_id=report.unit_id, user_id=현재사용자)` 행이 있으면 접근 가능** — contractor/owner/tenant 단일 규칙(B03 모델과 일관)
- `backend/src/db/repositories/reports.js`(확장, 기존 B05 export 유지) — `getUserRoleOnUnit`(owner>tenant>contractor 우선), `hasUnitAccess`, `listReportsForUser`(접근 호실 리포트 최신순), `getReportRow`, `getSnapshotByReportId`, `listConfirmations`, `addConfirmation`(INSERT OR IGNORE 멱등), `createShareLink`(crypto.randomBytes 16바이트 hex 토큰), `listShareLinks`, `findReportByShareToken`
- `backend/src/routes/reports.js`(신규, requireUser) — `GET /`(목록), `GET /:id`(404→403 순 검사, snapshot+confirmations+shareLinks 포함), `POST /:id/confirm`(owner/tenant만, role 자동 판별, 멱등 alreadyConfirmed 플래그), `POST /:id/share`(접근자 누구나, 201 + sharePath)
- `backend/src/routes/share.js`(신규, **인증 없음/공개**) — `GET /:token`: 토큰→리포트→snapshot+confirmations 반환. 이름 마스킹 없음, 확인/수정/삭제 UI 없음
- `backend/src/routes/index.js` — `/reports`, `/share` 마운트

#### 정책 준수

- 공유 링크: 만료 없음, 비밀번호 없음, 시공업자/임대인/임차인 모두 생성 가능
- 공유 조회: 무인증 공개, 임대인/임차인 이름 그대로 노출(마스킹 없음), 조회/PDF만
- 확인 완료: owner/tenant 독립 저장, contractor 불가, 멱등. 임차인 의견 작성 기능 미구현(범위 제외)

#### 검증 결과

| # | 시나리오 | 결과 |
|---|---|---|
| 1 | GET /reports contractor(1) | 4건 (unit1 x3 + 검증용 unit2 x1) |
| 2 | GET /reports owner(2) | 4건 |
| 3 | GET /reports tenant(3) | 3건 (unit1만), unit2 리포트 누수 없음 |
| 4 | GET /reports/1 tenant(3) | 200, grade=B, snapshot 포함, roleInUnit=tenant |
| 5 | GET /reports/4(unit2) tenant(3) | 403 (접근 차단) |
| 6 | GET /reports/99999 | 404 |
| 7 | POST /reports/1/confirm owner(2) | role=owner, alreadyConfirmed=false |
| 8 | POST /reports/1/confirm owner(2) 재호출 | alreadyConfirmed=true (멱등) |
| 9 | POST /reports/1/confirm tenant(3) | role=tenant, alreadyConfirmed=false (독립 저장) |
| 10 | POST /reports/1/confirm contractor(1) | 403 |
| 11 | GET /reports/1 confirmations | 2건 [owner:김임대, tenant:박임차] |
| 12 | POST /reports/1/share tenant(3) | 201, token + sharePath=/share/&lt;token&gt; |
| 13 | GET /api/share/&lt;token&gt; (무인증) | 200, snapshot 포함, confirmations 포함, 이름(김임대) 노출 — 마스킹 없음 |
| 14 | GET /api/share/deadbeef | 404 |

#### 실패/보류/TODO

- 없음
- 비고: 검증 중 unit2(201호, tenant 미배정) 리포트를 임시 생성해 403 경로를 실증한 뒤 db:reset으로 원복

#### 다음 세션 인수인계

- B08 — Report 비교 API (GET /api/reports/compare?leftId=&rightId=). 같은 호실 + 같은 점검 유형 정확히 2개만 허용, 수리 전↔수리 후 예외 허용, 자동 분석 없이 두 snapshot 반환, 조건 불일치 시 400. **주의: `/compare` 리터럴 라우트를 `/:id`보다 먼저 등록**해야 `:id`에 흡수되지 않음

---

### B08 Report 비교 API

| 항목 | 내용 |
|---|---|
| 세션 ID | B08 |
| 영역 | 백엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T13:30:00Z |
| 담당 목표 | GET /api/reports/compare — 같은 호실+유형 2개 비교, 수리 전↔후 예외, 자동 분석 없이 두 snapshot 반환 |
| 사용 문서 | 백엔드_PRD_세션별.md §10, PRD §14·§19 |

#### 구현 내용

- `backend/src/routes/reports.js` — `GET /compare` 라우트 추가. **반드시 `/:id`보다 먼저 등록**(그렇지 않으면 `/compare`가 `/:id`에 흡수됨) — 실제 50행(/compare) < 119행(/:id)로 배치
- `typesComparable(a,b)`: 동일 유형 OR 둘 다 `{repair_pre, repair_post}` 집합이면 비교 허용(수리 전↔후 예외)
- `parsePositiveInt`: `"1.5"/"1abc"/"0"/"-2"` 등 비정상 쿼리 거부
- 검증 순서: 파라미터 누락/비정상 → 400 → leftId===rightId → 400 → 리포트 미존재 → 404 → 두 리포트 호실 접근권한(`hasUnitAccess`) 없음 → 403 → 다른 호실 → 400 → 유형 비호환 → 400 → 성공 200
- 응답: `{ left:<snapshot>, right:<snapshot>, compareMeta:{ unit, leftReport, rightReport, repairExceptionApplied }, validation:{ valid, sameUnit, sameType, repairExceptionApplied } }`. **자동 책임 판단·변경점 분석 없음**, raw snapshot 2개만 반환
- 기존 repository getter(getReportRow/getSnapshotByReportId/getUnitWithBuilding/hasUnitAccess) 재사용 — repository/스키마 변경 없음

#### 검증 결과

| # | 시나리오 | 결과 |
|---|---|---|
| 1 | compare 1&3 (unit1 move_in) contractor(1) | 200, snapshot 2개, unit=1203호, grades B/A, valid=true, sameType=true, exc=false |
| 2 | compare repair_pre & repair_post (unit1) | 200, valid=true, sameType=false, repairExceptionApplied=true (예외 허용) |
| 3 | compare 1&2 (move_in vs periodic, 같은 호실) | 400 (유형 불일치) |
| 4 | compare 1&unit2report (다른 호실) | 400 (same-unit 위반) |
| 5 | compare leftId만 | 400 (파라미터 누락) |
| 6 | compare 1&1 | 400 (자기 자신 비교) |
| 7 | compare 1&99999 | 404 (미존재) |
| 8 | compare 1&unit2report as tenant(3) | 403 (접근권한 없음) |
| 9 | 라우트 순서 | `/compare`가 200 응답 — `/:id`에 흡수되지 않음 실증 |

#### 실패/보류/TODO

- 없음
- 비고: 검증 중 unit1 repair_pre/repair_post, unit2 periodic 리포트를 임시 생성해 예외·다른호실·403 경로 실증 후 db:reset 원복

#### 다음 세션 인수인계

- **B01~B08 백엔드 기능 구현 전부 완료.** 다음은 **B-VERIFY** — 실제 서버 기동 + 전체 API 호출로 B01~B08의 27개 항목 점검. 작은 오류만 수정, 큰 구조 변경은 보류 이슈로 기록. 최종 판정(통과/부분 통과/보류/실패). B-VERIFY 통과 전 F01 시작 금지

---

### B-VERIFY 백엔드 전체 검증

| 항목 | 내용 |
|---|---|
| 세션 ID | B-VERIFY |
| 영역 | 백엔드 |
| 상태 | 완료 |
| **최종 판정** | **통과 (PASS)** — 27/27 항목 통과, 결함 0, 코드 수정 없음 |
| 작업 일시 | 2026-06-01T14:30:00Z |
| 담당 목표 | 실서버 기동 + 전체 API 호출로 B01~B08 PRD 정합성 검증 |
| 사용 문서 | progress.md, PRD, 백엔드 PRD, 기능명세서, 하네스, 검증프롬프트 운영규칙 |

#### 검증 방법

- `npm run db:reset`로 클린 seed 후 `node backend/src/app.js` 실서버 기동, 실제 HTTP 호출로 전 엔드포인트 점검. 실 GPT 호출 1회 + 직접 DB/모듈 점검(node) 병행. 검증 후 임시 데이터 db:reset 원복.

#### 검증 결과 (27개 항목)

| # | 검증 대상 | 결과 |
|---|---|---|
| 1 | GET /api/health | ✅ 200, `{ok:true,data:{service}}` |
| 2 | GET /api/demo/users | ✅ 200, 3명(이시공/김임대/박임차) |
| 3 | userId 기반 권한 체크 | ✅ 무인증 401, 잘못된 userId 401 |
| 4 | GET /api/units | ✅ 역할 필터(contractor 3 / tenant 1) |
| 5 | Inspection 생성/조회/수정/삭제 | ✅ 201/200/200/200, 타인 조회 403 |
| 6 | draft/submitted 수정·삭제 가능 | ✅ PATCH draft 200, DELETE draft 200 |
| 7 | reported 수정·삭제 차단 | ✅ PATCH 403 / DELETE 403 |
| 8 | 비-contractor·잘못된 type | ✅ 403 / 422 |
| 9 | PATCH status=reported 직접 설정 차단 | ✅ 400 |
| 10 | 점검 제출 시 report 자동 생성 | ✅ submit→reportId 반환 |
| 11 | 재제출 차단 | ✅ 409 |
| 12 | report_snapshots JSON 저장 | ✅ 전 행 JSON 파싱 가능 |
| 13 | 등급 산출 규칙 | ✅ urgent+caution(issue)→C |
| 14 | 소방·안전 수리 필요 시 E등급 | ✅ fire_safety repair_needed→E |
| 15 | GPT API 연동 구조 | ✅ 실 호출 200, fallback=false |
| 16 | prompts 파일 2개 읽기 | ✅ inspection-guide 959B / opinion-draft 642B |
| 17 | AI JSON 응답 구조 | ✅ 5키(summary/actionCards/requiredDocuments/cautionPhrases/opinionDraft) |
| 18 | AI 실패 graceful fallback | ✅ NO_API_KEY→fallback=true, FALLBACK_GUIDE 5키 |
| 19 | 리포트 목록/상세 | ✅ 역할별 목록, 상세 snapshot 포함 |
| 20 | 권한 없는 리포트 접근 차단 | ✅ tenant→타 호실 리포트 403 |
| 21 | 임대인/임차인 확인 완료 | ✅ owner/tenant 독립 저장, contractor 403 |
| 22 | 확인 멱등성 | ✅ 재호출 alreadyConfirmed=true, 2건 누적 |
| 23 | 공유 링크 생성/조회 | ✅ 토큰 생성 + 무인증 공개 조회 200 |
| 24 | 공유 링크 만료 없음·마스킹 없음 | ✅ 만료 컬럼/검사 없음, 이름(김임대/박임차) 그대로 |
| 25 | 공유 접근자 권한 제한 | ✅ /share는 조회 전용(확인/수정/삭제 엔드포인트 없음) |
| 26 | 리포트 비교 + 조건 | ✅ 같은 호실+유형 200, 불일치 400, 수리 전↔후 예외 200 |
| 27 | 공통 오류 응답 형식 | ✅ `{ok:false,error:{code,message}}` (404·401 raw body 확인) |

추가 확인: 13개 테이블 전부 존재, 라우터 연결(/health·/demo·/session·/units·/inspections·/ai·/reports·/share) 정상.

#### 수정 사항

- **없음.** 모든 항목이 PRD/백엔드 PRD 계약에 부합 — import/경로/라우터/응답구조/validation 오류 0건. 수정 가능 범위 내 결함이 발견되지 않아 코드 변경 없이 통과.

#### 보류 이슈

- 없음 (수정 금지 범위에 해당하는 구조 변경 필요 사항 없음).

#### 다음 세션 인수인계

- **B-VERIFY 통과 → 프론트엔드 F01 진행 가능.** F01 — 공통 UI 시스템(DESIGN.md Tesla 스타일, 컬러 팔레트, 평면 카드). 와이어프레임 v6 화면 흐름 + `VITE_API_BASE_URL` 주입, localStorage(`selectedUserId`/`selectedRole`) 기반 데모 사용자 구분. 백엔드 API 계약은 본 progress.md §6 참고

---

### F01 프론트 기본 세팅 + 공통 UI 시스템

| 항목 | 내용 |
|---|---|
| 세션 ID | F01 |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T15:30:00Z |
| 담당 목표 | Vue 3+Vite+Tailwind 정리, Router/API client 구성, DESIGN.md 기반 공통 UI 컴포넌트 + /ui-preview |
| 사용 문서 | 프론트엔드 PRD v2, DESIGN.md, 와이어프레임 v6, 하네스 |

#### 구현 내용

- **환경 정리:** S00 Vite 템플릿 잔재(보라색 accent, dark-mode, hero/#next-steps 스타일) 제거. `style.css`는 `@tailwind` 3줄 + 시스템 폰트(한글 폴백)·기본색·`@media print{.no-print}`만 유지. `HelloWorld.vue` 삭제
- **Tailwind 토큰:** `tailwind.config.js` theme 확장 — colors(brand #3E6AE1 / surface #F4F4F4 / ink #171A20 / body #393C41 / muted #5C5E62 / hair #EEEEEE / ph #8E8E8E), borderRadius(btn 4px / card 12px), fontFamily.sans(시스템 폰트, 실제 Universal Sans 파일 미사용)
- **Router:** `vue-router@4` 설치, `src/router/index.js`(createWebHistory) — `/`,`/ui-preview`,`/contractor`,`/owner/reports`,`/tenant/reports`,`/share/:token`,catch-all NotFound. 전부 lazy import. `main.js`에 `.use(router)`
- **API client:** `src/api/client.js` — `VITE_API_BASE_URL` 기반 fetch 래퍼, `X-User-Id`(localStorage) 자동 첨부, `{ok,data}` 봉투 파싱, **백엔드 오류형식 `{error:{code,message}}` 정확히 파싱**(lead 수정), `api.get/post/patch/del`. `src/lib/session.js` — selectedUserId/selectedRole localStorage 헬퍼
- **공통 UI 14종** (`src/components/ui/`): AppLayout, PageHeader, BaseButton(primary/secondary/ghost, 4px, pill 금지), BaseCard(평면, 무그림자), BaseBadge, StatusTag(draft/submitted/reported + 등급 A~E), FormField, SelectCard, StepIndicator, EmptyState, AlertMessage(info/success/warning, 적·녹색 미사용), PhotoSlot, ReportSection, PrintButton(window.print + .no-print)
- **/ui-preview:** 14개 컴포넌트 전 상태 쇼케이스. 나머지 라우트는 AppLayout+PageHeader+EmptyState 스텁(기능은 후속 세션)
- **.env / .env.example:** `VITE_API_BASE_URL=http://localhost:3000/api`

#### 디자인 준수

- Primary CTA #3E6AE1 단일 강조색, 평면 카드·여백 중심, 과한 shadow/gradient/pill 없음, 폰트 굵기 400/500, 휴대폰 외곽 프레임 미구현(반응형 웹). 모바일 우선(AppLayout max-w-md → md:max-w-3xl)

#### 검증 결과

| 검증 항목 | 결과 |
|---|---|
| npm run build | ✅ 0 에러, 50개 모듈 변환(14컴포넌트+7뷰+router 컴파일) |
| npm run dev | ✅ Vite 5173 ready |
| GET / | ✅ 200 |
| GET /ui-preview | ✅ 200, #app 마운트, /src/main.js 로드(router import 확인) |
| Tailwind 적용 | ✅ CSS 빌드 10.5kB |
| 공통 컴포넌트 14종 | ✅ 전부 생성 + /ui-preview에서 import |

#### 실패/보류/TODO

- 없음
- 비고: 브라우저 시각 렌더링(viewport 3종 픽셀 검증)은 F-VERIFY(Playwright) 담당. F01은 빌드/라우팅/서빙 수준까지 검증
- lead 수정 1건: `api/client.js`의 오류 봉투 파싱을 백엔드 `{error:{code,message}}` 구조에 맞게 정정(F02+ API 오류 처리 대비)

#### 다음 세션 인수인계

- F02 — 사용자 선택 / 시공업자 홈 / 점검 목적 선택 / 점검 대상 입력. 와이어프레임 기준, 공통 UI(SelectCard/BaseButton/PageHeader 등) 재사용. `GET /api/demo/users`·`POST /api/session/select-user`·`GET /api/units` 호출, 선택 결과를 localStorage(selectedUserId/selectedRole)에 저장

---

### F02 데모 사용자 선택 + 시공업자 시작 화면

| 항목 | 내용 |
|---|---|
| 세션 ID | F02 |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T16:30:00Z |
| 담당 목표 | 데모 사용자 선택·역할 라우팅, 시공업자 홈, 새 점검 시작(목적→대상) 흐름 |
| 사용 문서 | 프론트엔드 PRD v2 §3.5, DESIGN.md, 와이어프레임 v6(시공업자 홈/점검 목적/점검 대상) |

#### 구현 내용

- `src/constants/inspectionTypes.js` — 7개 점검 유형(value/label/description/flow) + `labelOf`/`flowLabel` 헬퍼. flow 자동: move_in·periodic→whole, 나머지→issue
- `src/views/Home.vue`(/) — `GET /api/demo/users` → SelectCard 3개(시공업자/임대인/임차인). 선택 시 `setSession({id,role})` + best-effort `POST /session/select-user` + 역할별 라우팅(contractor→/contractor, owner→/owner/reports, tenant→/tenant/reports). **onMounted에서 getUserId/getRole로 영속 선택 복원**(새로고침 유지), 로드 실패 시 AlertMessage+재시도
- `src/views/ContractorHome.vue`(/contractor) — 역할 가드(비-contractor→/), PageHeader(사용자 전환 액션), Primary "+ 새 점검 시작", "오늘 할 일" 카드(작성 중/제출 대기 카운트), 작성 중/제출 대기 섹션(StatusTag). **목록 API 부재(gap)는 try/catch로 EmptyState graceful 처리**
- `src/views/NewInspection.vue`(/contractor/inspections/new) — 역할 가드, StepIndicator(목적/대상/작성/제출). Step1: 7개 유형 SelectCard. Step2: 요약 카드(유형+진행방식), `GET /units` 건물/호실 select, 점검일 input(기본 오늘), 임대인/임차인(자동표시 placeholder). "점검 시작"→`POST /inspections`→`/contractor/inspections/:id`, "임시 저장"→생성 후 /contractor
- `src/views/InspectionDetail.vue`(/contractor/inspections/:id) — F03/F04용 스텁(EmptyState)
- `src/router/index.js` — `/contractor/inspections/new`(`/:id`보다 먼저)·`/:id` 추가

#### 검증 결과

| 검증 항목 | 결과 |
|---|---|
| npm run build | ✅ 0 에러, 55모듈 |
| dev 서버 라우트 | ✅ /·/contractor·/contractor/inspections/new 200 |
| 백엔드 실연동 | ✅ demo/users 3명, units 3개(contractor), POST inspections→id 반환(flow=whole, status=draft), select-user→contractor |
| 영속/가드 로직 | ✅ Home onMounted 영속 복원, ContractorHome/NewInspection 역할 가드 (코드 검증) |
| 공통 UI 재사용 | ✅ SelectCard/BaseButton/PageHeader/BaseCard/FormField/StepIndicator/StatusTag/EmptyState/AlertMessage |

#### 실패/보류/TODO

- **백엔드 갭(보류, frontend 세션 범위 밖 — graceful 처리만 함):**
  1. **점검 목록 조회 API 부재** — `GET /api/inspections`(시공업자 본인 점검 목록) 엔드포인트가 없어 시공업자 홈의 작성 중/제출 대기 카드를 데이터로 채울 수 없음. 현재 try/catch로 EmptyState 표시. **후속 백엔드 보강 권장**(예: `GET /api/inspections?status=` 본인 필터)
  2. **`/api/units` 참여자 미포함** — 호실의 임대인/임차인 이름이 응답에 없어 "임대인/임차인 자동 표시"가 placeholder. **후속 백엔드 보강 권장**(units 응답에 participants 추가 또는 별도 엔드포인트)
- 브라우저 인터랙션(클릭 플로우, 새로고침 영속) 실측은 F-VERIFY(Playwright) 담당

#### 다음 세션 인수인계

- F03 — 입주 전/정기 전체 점검 UI(공간별 빠른 체크 → 이상 항목 상세 → 사진 → 최종 의견). `/contractor/inspections/:id`(현재 스텁)에서 실제 점검 작성 구현. PATCH /api/inspections/:id로 items 저장. **위 백엔드 갭 1(목록 API)을 F03 착수 전 또는 병행으로 보강하면 시공업자 홈이 완성됨**

---

### F03 입주 전/정기 전체 점검 UI

| 항목 | 내용 |
|---|---|
| 세션 ID | F03 |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T17:30:00Z |
| 담당 목표 | 전체 점검(whole flow) 작성 화면 — 공간별 3상태 체크, 이상 항목 상세, 저장/복원 |
| 사용 문서 | 프론트엔드 PRD v2 §3.6, DESIGN.md, 와이어프레임 v6(공간별 빠른 확인/이상 항목 상세/검토) |

#### 구현 내용

- `src/constants/inspectionSpaces.js`(신규) — `WHOLE_SPACES`(8공간×기본 항목: 현관/거실/주방/방1/방2/화장실/베란다/보일러룸), `STATES`(정상/주의/수리 필요 = normal/caution/repair_needed), `buildDefaultItems()`(전 공간×항목 normal 기본 32슬롯 생성)
- `src/views/InspectionDetail.vue`(스텁 → 전면 구현) — 3단계 흐름(StepIndicator: 공간별 확인 / 이상 항목 / 검토)
  - **Step0:** 공간별 BaseCard, 항목마다 3상태 세그먼트 컨트롤(정상 기본·즉시 선택), 정상/주의/수리 카운트 BaseBadge
  - **Step1:** `abnormalItems`(주의·수리 필요만) 각각 위치·상태 설명 FormField. 이상 없으면 EmptyState
  - **Step2:** 요약 카드(유형/진행방식/공간 수/카운트) + 이상 항목 목록 + 저장
  - **데이터 모델:** GET items를 `buildDefaultItems()` 위에 (space,detailItem) 키로 병합 하이드레이트(idempotent). 저장은 PATCH로 **전체 items 배열** 전송(백엔드 replace 의미 대응) → 저장 후 GET 재호출로 라운드트립 확정
  - 분기: `flow!=='whole'`(issue)→EmptyState(F04 안내), `status==='reported'`→읽기 전용(저장 숨김·입력 disabled), 역할 가드(비-contractor→/)
- lead 수정 1건: Step1 힌트 조건의 연산자 우선순위 버그(`!inspection.status === 'reported'` → `inspection.status !== 'reported'`) 정정

#### 검증 결과

| 검증 항목 | 결과 |
|---|---|
| npm run build | ✅ 0 에러, 56모듈(InspectionDetail 청크) |
| 저장 라운드트립(실서버) | ✅ POST move_in/periodic→flow=whole, PATCH 전체 items→GET 복원, state/location/description 유지 |
| replace 의미 | ✅ 3항목 PATCH→GET 3개, 2항목 재PATCH→GET 2개(전체 교체) |
| 이상 항목 분리 | ✅ caution/repair_needed만 상세 단계 노출(computed) |
| 분기 처리 | ✅ flow!=='whole'·reported 읽기전용 코드 검증 |
| 공통 UI 재사용 | ✅ BaseCard/BaseBadge/FormField/StepIndicator/EmptyState/AlertMessage/BaseButton |

#### 실패/보류/TODO

- 없음
- 비고: space/detailItem은 한글 라벨로 저장(스키마상 free text, 등급 산출은 state·category만 사용하므로 무관). 사진 첨부(PhotoSlot)는 F06, 최종 의견·제출은 F05 범위
- 브라우저 인터랙션(3상태 탭, 단계 이동, 새로고침 후 데이터 유지) 실측은 F-VERIFY(Playwright) 담당
- (이월) 백엔드 갭: 점검 목록 API 부재 — 시공업자 홈에서 이 점검으로 진입하는 카드가 비어 있음. 목록 API 보강 시 홈→점검 진입 완성

#### 다음 세션 인수인계

- F04 — 퇴거/긴급/수리 문제 항목 점검(issue flow) UI. 분야/문제 항목 선택 → 위치·증상 → 현장 확인 항목(있음/없음/확인 필요). `/contractor/inspections/:id`에서 `flow==='issue'`일 때 렌더(현재 EmptyState로 분기됨). PATCH items/observations 저장은 F03와 동일 패턴

---

### F04 퇴거/긴급/수리 문제 항목 점검 UI

| 항목 | 내용 |
|---|---|
| 세션 ID | F04 |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T18:30:00Z |
| 담당 목표 | 문제 항목 점검(issue flow) 작성 화면 — 분야/문제/위치/증상 + 현장 확인 항목 |
| 사용 문서 | 프론트엔드 PRD v2 §3.7, DESIGN.md, 와이어프레임 v6(B-01 문제 정보 + 현장 확인) |

#### 구현 내용

- **리팩터:** `InspectionDetail.vue`를 thin **dispatcher**로 재구성(역할 가드 + GET + 로드 에러/로딩만). flow에 따라 자식 컴포넌트 분기
  - `src/views/inspection/WholeInspection.vue`(신규) — F03 whole-flow 로직 **그대로 이동**(prop `inspection`로 하이드레이트, `saved` emit). 동작 동일(회귀 검증 통과)
  - `src/views/inspection/IssueInspection.vue`(신규) — F04 issue-flow UI
- `src/constants/inspectionFields.js`(신규) — `PROBLEM_FIELDS`(5분야×대표 문제 항목), `DEFAULT_OBSERVATIONS`(외부 충격 흔적/부식·노후 흔적/연결부 이상/이전 수리 이력), `OBSERVATION_VALUES`(있음/없음/확인 필요), `ISSUE_STATES`(주의/수리 필요), `categoryLabel`/`problemItemsFor`
- **IssueInspection 흐름(2단계):** Step0 = 문제 정보(분야 칩 → 문제 항목 select(+직접 입력) → 문제 상태 → 위치 → 증상) **+** 현장 확인 항목(행마다 있음/없음/확인 필요 세그먼트, +항목 추가) / Step1 = 검토·저장
- **현장 확인 직접 선택:** 기본값 `need_check`(확인 필요)로 시작, **AI/코드가 자동 결정하지 않음** — 시공업자가 명시 선택
- **저장 매핑:** items `[{category, problemItem, state, location, description, space:null, detailItem:null}]`, observations `[{observationKey, value, note:null, inspectionItemId:null}]`. **inspectionItemId=null 필수**(PATCH가 items를 새 id로 재생성하므로 FK 위반 방지)
- **분야↔category:** 인테리어·마감→interior, 샷시·창호→window, 설비·배관→plumbing, 전기→electrical, 소방·안전→fire_safety
- **문제 상태(state) 추가:** B05 등급 규칙(issue flow는 state·category 기반)이 동작하도록 주의/수리 필요 선택을 도입 — 명세에 명시되진 않았으나 등급 산출이 의미 있게 작동하기 위한 최소 추가(시공업자 직접 선택, AI 아님)

#### 검증 결과

| 검증 항목 | 결과 |
|---|---|
| npm run build | ✅ 0 에러, 59모듈 |
| whole-flow 회귀 | ✅ 리팩터 후에도 flow=whole, items/state 라운드트립 정상(F03 무손상) |
| issue 저장 라운드트립 | ✅ category/problemItem/state/location/description + observations 4건 값 복원 |
| FK 안전 | ✅ 저장된 observations 모두 inspectionItemId=null |
| 등급 연동 | ✅ urgent + repair_needed 제출 → E등급(상태값이 B05 grading에 반영) |
| 현장 확인 직접 선택 | ✅ 기본 need_check, 자동 결정 없음 |

#### 실패/보류/TODO

- 없음
- 비고: issue flow는 단일 문제 항목(items[0]) 모델. 다중 문제는 1차 범위 밖. AI 도우미(현장 확인값 자동 추천 금지 준수)·사진은 F05/F06
- 브라우저 인터랙션(분야 선택·세그먼트·단계 이동·재오픈 유지) 실측은 F-VERIFY(Playwright)

#### 다음 세션 인수인계

- F05 — AI 점검 도우미(행동형 카드) + 시공업자 전문 의견 작성 + 점검 제출. `POST /api/ai/inspection-guide`로 가이드 받아 카드 UI 표시(긴 문단 금지), finalOpinion PATCH 저장, `POST /api/inspections/:id/submit`로 제출→리포트 생성. issue/whole 양쪽 작성 화면 마지막에 연결

---

### F05 AI 점검 도우미 + 최종 의견 + 제출

| 항목 | 내용 |
|---|---|
| 세션 ID | F05 |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T19:30:00Z |
| 담당 목표 | AI 행동 카드 UI, opinionDraft 초안 적용, 시공업자 최종 의견(수정), 점검 제출 |
| 사용 문서 | 프론트엔드 PRD v2 §3.8, DESIGN.md, 와이어프레임 v6(AI 행동 가이드 / 전문 의견 작성) |

#### 구현 내용

- `src/components/inspection/AiOpinionPanel.vue`(신규, 공용 presentational) — props: inspectionId/context/modelValue(finalOpinion)/readonly
  - "AI 도우미 실행" → `POST /api/ai/inspection-guide`(inspectionId + context). 응답을 **카드로 렌더**(긴 문단 금지): 요약 카드 / 행동 가이드(actionCards: 촬영·자료·주의·확인 칩 + 제목·설명 + 버튼) / 확인 자료(requiredDocuments 태그) / 표현 주의(cautionPhrases 불릿) / 의견 초안(opinionDraft + "초안 적용")
  - **초안 적용** → `update:modelValue`로 최종 의견란 채움
  - **최종 의견 textarea는 guide 유무와 무관하게 항상 표시**(수동 작성 보장). fallback=true/네트워크 오류 시 안내 + textarea 그대로 사용 가능
  - readonly(reported) 시 실행/적용/입력 비활성. 법적 판단 라벨 없음(백엔드 금지표현 필터 + 중립 라벨)
- `WholeInspection.vue`·`IssueInspection.vue`(수정) — 마지막 단계 "AI · 최종 의견" 추가, `finalOpinion` ref(하이드레이트), `aiContext` computed(현재 작성 상태), PATCH에 finalOpinion 포함, **"점검 제출"**(저장(items/obs/finalOpinion) → `POST /inspections/:id/submit` → 성공 시 등급 안내 + `saved` emit으로 dispatcher 재조회 → reported 읽기전용 전환). 기존 F03/F04 로직 무수정

#### 정책 준수

- 리포트에는 **AI 초안이 아니라 시공업자 최종 의견(finalOpinion)만** 포함(백엔드 snapshot이 inspection.finalOpinion 사용) — 실증 통과
- AI 결과는 카드 UI(요약/행동/자료/주의/초안), 단일 긴 문단 아님
- AI 실패해도 제출/작성 가능(graceful)

#### 검증 결과 (Node UTF-8 통합 테스트)

| 검증 항목 | 결과 |
|---|---|
| npm run build | ✅ 0 에러 |
| 실 GPT 호출 | ✅ fallback=false, 5키(summary/actionCards/requiredDocuments/cautionPhrases/opinionDraft), actionCards 2건 |
| finalOpinion 영속 | ✅ PATCH 후 inspection.finalOpinion 일치 |
| 제출→스냅샷 의견 | ✅ **snapshot.finalOpinion = 시공업자 수정본**(AI 초안 아님) — issue·whole 양쪽 |
| 등급 | ✅ issue urgent+repair→E, whole caution→B |
| ai_guide 스냅샷 임베드 | ✅ inspectionId로 저장된 가이드가 제출 스냅샷에 포함 |
| fallback 수동작성 | ✅ guide 없이도 최종 의견 textarea 동작 |

#### 실패/보류/TODO

- 없음
- 비고: PowerShell 5.1의 한글 요청 본문 인코딩 이슈로 1차 검증이 false 표시 → Node(fetch, UTF-8)로 재검증해 전부 통과 확인. 실제 서버/브라우저(fetch)는 UTF-8이라 무관
- 행동 카드의 액션 버튼(촬영 등)은 F05에서 안내용(실 촬영은 F06). 사진 첨부는 F06

#### 다음 세션 인수인계

- F06 — 임대인/임차인 리포트 목록·상세 + (사진 첨부 PhotoSlot 연동). `GET /api/reports`·`GET /api/reports/:id` 역할별, snapshot 렌더(등급·항목·사진·확인 이력·최종 의견). 생성 완료 리포트는 수정/삭제 UI 절대 금지

---

### F06 이미지 첨부 UI (Base64)

| 항목 | 내용 |
|---|---|
| 세션 ID | F06 |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T20:30:00Z |
| 담당 목표 | 파일 선택→Base64 변환, 사진 유형·설명, 용량/장수 제한, 저장 API 연동 |
| 사용 문서 | 프론트엔드 PRD v2, DESIGN.md, 와이어프레임 v6(사진 슬롯/추가) |

#### 구현 내용

- `src/constants/photoTypes.js`(신규) — `PHOTO_TYPES` 6종(전체 위치→overview / 근접→close_up / 크기 기준→scale / 전후 사진→before_after / 임시 조치 전→temp_before / 임시 조치 후→temp_after, 백엔드 enum 일치), `photoTypeLabel`
- `src/components/inspection/PhotoManager.vue`(신규 공용) — props modelValue(images 배열)/max(기본 20)/readonly
  - 파일 선택 → `FileReader.readAsDataURL` → **데이터URI 접두어 제거**(`split(',')[1]`)해 raw base64 저장(백엔드/스냅샷 저장 형식과 일치), 미리보기는 `data:${mime};base64,${base64}` 재조립(PhotoSlot 재사용)
  - 이미지마다 사진 유형 select + 설명 input, 삭제 버튼. 카운트 배지 `N / max`
  - **검증·오류:** 이미지 아닌 파일 거부 / 1장 10MB 초과 거부(파일명 포함 메시지) / max(20) 초과 거부 — 각 명확한 AlertMessage
  - readonly(reported) 시 추가/수정/삭제 비활성, 사진 없으면 EmptyState
  - max는 prop으로 분리 — 추후 항목당 5장 캡은 `:max="5"`로 재사용 가능(현 세션은 리포트 전체 20장 캡 적용)
- `WholeInspection.vue`·`IssueInspection.vue`(수정) — `images` ref(하이드레이트), 마지막 단계 AiOpinionPanel **위**에 `<PhotoManager v-model="images" :max="20" />` 배치, **저장·제출 PATCH 양쪽**에 images 포함(`inspectionItemId:null` 필수 — items 재생성 FK 방지), aiContext.photoCount=images.length

#### 검증 결과 (Node UTF-8 통합)

| 검증 항목 | 결과 |
|---|---|
| npm run build | ✅ 0 에러, 62모듈 |
| images 라운드트립 | ✅ 3장 PATCH→GET, photoType/캡션(한글) 유지, **base64 보존**, inspectionItemId 전부 null |
| replace 의미 | ✅ 3장→1장 재PATCH 시 1장 |
| 제출 스냅샷 | ✅ snapshot.images에 base64 포함(리포트에 사진 증빙 반영) |
| 제한/오류 | ✅ 10MB/장·20장·이미지 타입 검증 + 메시지(코드 검증, 브라우저 FileReader) |

#### 실패/보류/TODO

- 없음
- 비고: "항목당 5장"은 인스펙션 레벨 갤러리(현재)엔 직접 적용 안 함 — PhotoManager `max` prop으로 항목별 그룹에 재사용 시 `:max="5"` 적용 가능(문서화). 현재는 리포트 전체 20장 캡이 바인딩 제약. AI 이미지 판독 없음(준수)
- FileReader·10MB·미리보기는 브라우저 전용이라 코드 레벨 검증, 실측은 F-VERIFY(Playwright)

#### 다음 세션 인수인계

- F07 — 임대인/임차인 리포트 목록·상세. `GET /api/reports`(역할별 목록)·`GET /api/reports/:id`(snapshot 상세: 등급·항목·사진(base64 미리보기)·확인 이력·최종 의견). **생성 완료 리포트엔 수정/삭제 UI 절대 금지**, 확인 완료(`POST /:id/confirm`)는 owner/tenant만. (원 세션 계획의 F06=리포트와 F07=비교/공유가 한 칸씩 이동됨)

---

### F07 임대인/임차인 리포트 목록 + 상세

| 항목 | 내용 |
|---|---|
| 세션 ID | F07 |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T21:30:00Z |
| 담당 목표 | 역할별 리포트 목록·상세, 확인 완료, 공유 링크, PDF 버튼 |
| 사용 문서 | 프론트엔드 PRD v2 §3.6, DESIGN.md, 와이어프레임 v6(임대인/임차인 목록·상세) |

#### 구현 내용

- `src/views/reports/ReportList.vue`(신규, 공용) — 역할 가드(owner/tenant 외 →/), `GET /api/reports`(백엔드가 역할별 필터, 클라 필터 없음). 카드: 호실·건물·유형·등급(StatusTag)·생성일 → 상세로 이동(역할별 base). 빈/로딩/오류 처리
- `src/views/reports/ReportDetail.vue`(신규, 공용) — `GET /api/reports/:id` → snapshot을 **읽기 전용 문서**로 렌더(ReportSection): 기본정보(등급·호실·유형·방식·일자·참여자), 점검 항목(state 배지), 현장 확인(observations), 사진 증빙(PhotoSlot base64 미리보기 + 유형/캡션), 시공업자 최종 의견, 확인 이력, 주의 문구
  - **액션(.no-print):** 확인 완료(owner/tenant만, `POST /:id/confirm`, 본인+roleInUnit 일치 시 "확인 완료됨" 비활성=멱등), 공유 링크 생성(`POST /:id/share` → URL 표시+복사), 인쇄/PDF(PrintButton=window.print)
  - **수정/삭제 UI 없음, 임차인 의견 작성 UI 없음**(준수). 403/404 처리
- `src/router/index.js` — `/owner/reports`·`/tenant/reports`→ReportList, `/owner/reports/:id`·`/tenant/reports/:id`→ReportDetail. 기존 OwnerReports/TenantReports 스텁 삭제

#### 검증 결과 (Node 통합)

| 검증 항목 | 결과 |
|---|---|
| npm run build | ✅ 0 에러 |
| 역할별 목록 | ✅ owner 3건/tenant 3건(본인 호실), 필요한 필드(id/type/grade/createdAt/unit/roleInUnit) |
| 상세 렌더 데이터 | ✅ snapshot(items 6·images 2·finalOpinion)·confirmations·shareLinks·참여자(김임대/박임차) |
| 확인 완료 멱등·독립 | ✅ owner 1차 already=false→2차 true, tenant 독립 → 확인 2건 |
| 공유 링크 | ✅ 201 token+sharePath |
| 접근 차단 | ✅ tenant→타 호실(unit2) 리포트 403 |

#### 실패/보류/TODO

- 없음
- 비고: PDF 버튼은 현재 window.print()(상세 화면 인쇄, `.no-print`로 액션바 제외). F08에서 `/reports/:id/print` 전용 인쇄 템플릿 + `@media print`로 고도화 예정
- 공유 링크 화면(`/share/:token`)은 현재 스텁 — F08에서 공개 조회 화면 구현
- 브라우저 인터랙션(클릭·확인·복사) 실측은 F-VERIFY(Playwright)

#### 다음 세션 인수인계

- F08 — 리포트 비교(`GET /api/reports/compare`) + 공유 링크 공개 화면(`/share/:token`, `GET /api/share/:token`) + 인쇄 전용 템플릿(`/reports/:id/print`, `@media print`, window.print). 공유 화면엔 확인/수정/삭제 UI 금지, 비교는 같은 호실+유형(수리 전↔후 예외)

---

### F08 리포트 비교 + 공유 공개 화면 + 인쇄/PDF

| 항목 | 내용 |
|---|---|
| 세션 ID | F08 |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-01T22:30:00Z |
| 담당 목표 | 리포트 비교, 공유 링크 접근 화면, 인쇄용 PDF 템플릿(window.print) |
| 사용 문서 | 프론트엔드 PRD v2 §3.4·§3.7, DESIGN.md, 와이어프레임 v6(비교/공유/리포트 양식) |

#### 구현 내용

- `src/components/inspection/ReportDocument.vue`(신규 공용) — F07 ReportDetail의 snapshot 읽기 전용 렌더(기본정보·항목·현장확인·사진·의견·확인이력·주의)를 추출. 4개 화면(상세·공유·인쇄·비교)이 공유 → 단일 렌더러
- `ReportDetail.vue`(리팩터) — 본문을 `<ReportDocument>`로 교체, 액션바(확인/공유/인쇄) 유지. **인쇄 버튼은 `/reports/:id/print` 전용 템플릿으로 이동**. F07 동작 무손상
- `src/views/ShareView.vue`(구현, `/share/:token` 공개) — `GET /api/share/:token`(무인증) → ReportDocument 렌더. **푸터에 PrintButton만**(조회·PDF 저장만), 확인/수정/삭제/의견 UI 전무. 이름 마스킹 없음. 잘못된 토큰→EmptyState
- `src/views/reports/PrintView.vue`(신규, `/reports/:id/print`) — owner/tenant 가드, `GET /api/reports/:id` → ReportDocument를 인쇄 최적화 레이아웃. `.no-print` 액션바(인쇄/PDF→window.print, 닫기→back). 스코프 `@media print{@page{margin:16mm}}`로 전역 margin:0 오버라이드 → 여백 있는 출력
- `src/views/reports/CompareView.vue`(신규, `/owner/compare`) — owner 가드, `GET /api/reports`로 두 select 채움 → "비교하기"→`GET /api/reports/compare?leftId=&rightId=`. 성공 시 validation 요약(호실·수리전↔후 예외 배지) + 두 snapshot 좌우(PC 2열)/상하(모바일) ReportDocument. **불일치 4xx 시 백엔드 메시지를 AlertMessage로 표시**, 자동 diff/판단 없음. lead 수정: unit.building 객체 표시 버그(`.name`) 정정
- `src/router/index.js` — `/owner/compare`·`/reports/:id/print` 추가. `ReportList.vue` — owner일 때 "리포트 비교" 버튼

#### 검증 결과 (Node 통합)

| 검증 항목 | 결과 |
|---|---|
| npm run build | ✅ 0 에러, 66모듈 |
| 비교 성공 | ✅ 1&3(unit1 move_in) 200, valid·sameType, left/right snapshot, unit/building 표시 |
| 비교 불일치 오류 | ✅ 1&2(유형 다름) 400 + 메시지("...same inspection type...") → AlertMessage |
| 공유 공개 조회 | ✅ 무인증 200, snapshot, 이름(김임대) 노출(마스킹 없음) |
| 잘못된 토큰 | ✅ 404 → EmptyState |
| 인쇄 소스 | ✅ GET /reports/:id snapshot(items 6·finalOpinion) |

#### 실패/보류/TODO

- 없음
- 비고: 공유 화면 조회·PDF만(확인/수정/삭제 없음) 준수, 비교 자동 판단 없음 준수, PDF=window.print 브라우저 방식(서버 생성 아님). 브라우저 인쇄창·2열 레이아웃·복사 실측은 F-VERIFY(Playwright)

#### 다음 세션 인수인계

- **프론트엔드 기능 구현(F01~F08) 전부 완료.** 다음은 **F-VERIFY** — Playwright MCP로 18개 화면을 Mobile(390×844)/Tablet(768×1024)/Desktop(1440×900) 3개 viewport에서 검증(콘솔/네트워크 오류, 라우팅, 인쇄 CSS, 디자인 기준). 백엔드+프론트 동시 기동 필요. 수정 금지 범위(DB 대개편/API 대규모 변경/인증 추가/서버 PDF/범위 외 기능) 준수

---

### F-VERIFY 프론트엔드 전체 검증

| 항목 | 내용 |
|---|---|
| 세션 ID | F-VERIFY |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| **최종 판정** | **부분 통과 (보류)** — 빌드·라우팅·정적 디자인/정책 감사 통과, 실브라우저·반응형 검증은 보류 |
| 작업 일시 | 2026-06-01T23:30:00Z |
| 담당 목표 | 프론트 18개 화면 실브라우저 검증(Playwright) |
| 사용 문서 | progress.md, PRD, 프론트엔드 PRD, DESIGN.md, 와이어프레임, 하네스, 검증프롬프트 운영규칙 |

#### ⚠️ 환경 제약

- **Playwright MCP 서버가 세션에 연결되어 있지 않음**(연결된 MCP: context7 / oh-my-claudecode 플러그인 / claude.ai 커넥터만). 따라서 **실브라우저 렌더링·콘솔/네트워크 오류·3개 viewport 반응형 픽셀 검증은 수행 불가**.
- 사용자 승인 하에 **브라우저 없는 대체 검증**으로 진행(빌드 / dev 기동 / 라우트 응답 / 정적 디자인·정책 소스 감사).

#### 대체 검증 결과

| # | 검증 항목 | 결과 |
|---|---|---|
| 1 | 프론트 프로덕션 빌드 | ✅ 0 에러 |
| 2 | 백엔드 dev 기동 + health | ✅ 200 |
| 3 | 프론트 dev 기동(5173) | ✅ 200, main.js+router 로드 |
| 4 | 18개 화면 라우트(대표 12경로 SPA 응답) | ✅ 전부 200 (/, /contractor, /inspections/new, /inspections/:id, /owner·/tenant/reports[/:id], /owner/compare, /reports/:id/print, /share/:token, /ui-preview) |
| 5 | 팔레트 토큰 | ✅ tailwind 토큰(brand #3E6AE1 / surface #F4F4F4 / ink #171A20 / body #393C41 / muted #5C5E62)로 일원화 |
| 6 | flat 디자인 | ✅ shadow/gradient 클래스 0건(shadow-md/lg/xl·drop-shadow·gradient 미사용) |
| 7 | pill 버튼 남용 | ✅ 버튼에 rounded-full 없음(rounded-full은 StepIndicator/SelectCard 점·caution 불릿만) |
| 8 | 생성 완료 리포트 수정/삭제 UI | ✅ ReportDocument/ReportDetail에 수정·삭제 없음 |
| 9 | 공유 화면 권한 제한 | ✅ ShareView 조회·PrintButton만(확인/수정/삭제/의견 0) |
| 10 | 임차인 의견 작성 UI | ✅ 리포트 화면에 의견 입력 없음(최종 의견은 표시 전용) |
| 11 | AI 도우미 카드형 | ✅ AiOpinionPanel 카드 렌더(F05 실증) |
| 12 | 인쇄 CSS | ✅ PrintView window.print() + @media print @page margin |
| 13 | 휴대폰 외곽 프레임 | ✅ 일반 반응형 컨테이너(AppLayout), 프레임 미구현 |

#### 수정 사항

- 없음(대체 검증 범위에서 결함 미발견)

#### 보류 이슈

- **(보류) Playwright 실브라우저 검증** — MCP 미연결로 다음을 수행하지 못함: 실제 화면 렌더링 확인, 런타임 콘솔/네트워크 오류 캡처, Mobile(390×844)/Tablet(768×1024)/Desktop(1440×900) 반응형 레이아웃 픽셀 검증, 버튼 클릭 인터랙션 실측. **Playwright MCP 연결 후 재실행 권장.**

#### 다음 세션 인수인계

- I01 통합 검증으로 진행 가능(전체 플로우 점검). 단, **F-VERIFY의 실브라우저 검증은 보류 상태**이므로 Playwright MCP 환경이 준비되면 재검증 권장. 최종 발표 전 실브라우저 1회 점검이 바람직

---

### F-VERIFY (재검증) Playwright MCP 실브라우저 전체 검증

| 항목 | 내용 |
|---|---|
| 세션 ID | F-VERIFY (재검증) |
| 영역 | 프론트엔드 |
| 상태 | 완료 |
| **최종 판정** | **통과** — 18화면 × 3 viewport 실브라우저 검증 완료, 발견 결함 3건 모두 수정 |
| 작업 일시 | 2026-06-03T02:00:00Z |
| 담당 목표 | 1차에서 보류된 실브라우저·콘솔/네트워크·반응형 검증 수행 |
| 사용 문서 | progress.md, PRD, 프론트엔드 PRD v2, DESIGN.md, 와이어프레임 v6, 검증프롬프트 운영규칙 |
| 환경 | Playwright MCP **연결됨**. backend(3000)+frontend(5173) 동시 기동, `npm run db:reset`로 클린 seed 후 검증 |

#### 검증 방식

- 데모 전 플로우를 실제 브라우저에서 직접 조작: 사용자 선택 → 시공업자 새 점검(입주 전/긴급 2종) → 공간별 점검(거실 창호 주의) → 이상 항목 → 검토 → AI 도우미 실행(실 GPT, 행동 카드) → 초안 적용 → 최종 의견 수정 → 제출(201, **등급 B**) → 리포트 자동 생성 → 임대인/임차인 목록·상세 → 확인 완료 → 공유 링크 생성 → 공유 공개 조회 → 리포트 비교(valid/불일치) → 인쇄 화면.
- viewport: Mobile 390×844 / Tablet 768×1024 / Desktop 1440×900.

#### 화면별 결과 (18/18)

| # | 화면 | 결과 |
|---|---|---|
| 1 | `/` 사용자 선택 | ✅ 카드 3개, demo/users 200 |
| 2 | `/contractor` 시공업자 홈 | ⚠️ 렌더 정상, 콘솔 404 1건(`GET /api/inspections` 백엔드 갭, try/catch graceful) |
| 3 | `/contractor/inspections/new` | ✅ StepIndicator + CTA |
| 4 | 점검 목적 선택 | ✅ 7종 카드, 다음 비활성→활성 |
| 5 | 점검 대상 입력 | ✅ 호실 select·점검일·참여자 placeholder |
| 6 | 전체 점검(whole) | ✅ 8공간 32항목 3상태, 요약 카운터, 이상 항목 위치/설명 |
| 7 | 문제 항목 점검(issue) | ✅ 긴급→issue 자동, 분야/문제항목/상태/위치/증상 + 현장 확인 항목 |
| 8 | AI 점검 도우미 | ✅ 실 GPT, **행동형 카드**(요약/행동 가이드/자료/주의/초안), 긴 문단 아님 |
| 9 | 사진 첨부 UI | ✅ 슬롯/0-20장/10MB 안내 |
| 10 | 전문 의견 작성 | ✅ 초안 적용 + textarea, 리포트엔 최종 수정본만(실증) |
| 11 | 제출 후 리포트 | ✅ 제출 201, inspection read-only(전 항목 disabled + "생성 완료" alert) |
| 12 | `/owner/reports` | ✅ (수정 후) 호실/건물/유형/등급/일자 정상 |
| 13 | `/owner/reports/:id` | ✅ snapshot 전체, 최종 의견=수정본, 수정·삭제 버튼 없음 |
| 14 | `/tenant/reports` | ✅ 본인 호실만(누수 0) |
| 15 | `/tenant/reports/:id` | ✅ 의견 작성 UI 없음(textarea 0), 확인/공유/인쇄만 |
| 16 | `/share/:token` | ✅ 공개 조회, 인쇄 버튼만, 확인/수정/삭제/의견 0, 이름 마스킹 없음 |
| 17 | 리포트 비교 | ✅ valid(같은 유형 배지), 불일치 400→AlertMessage, 모바일 stacked/태블릿·데스크톱 side-by-side |
| 18 | `/reports/:id/print` | ✅ `.no-print` 액션바 + `@page margin:16mm` 인쇄 CSS |

#### 발견 결함 및 수정 (3건, 모두 in-scope 프론트 수정)

| # | 심각도 | 위치 | 증상 | 수정 |
|---|---|---|---|---|
| 1 | **높음** | `ReportList.vue` | 리포트 목록 카드 제목/건물/유형이 빈칸(`undefined`) — API 필드명 불일치(`unitName/building/type` 사용, 실제는 `unit.label/unit.building.name/inspectionType`) | `report.unit?.label` / `report.unit?.building?.name` / `labelOf(report.inspectionType)`로 정정, aria-label 동일 정정 |
| 2 | 중간 | `ReportDocument.vue` | base64 없는 이미지 엔트리(seed snapshot의 `{photoType}`만 있는 항목) 렌더 시 `data:image/jpeg;base64,undefined` → 콘솔 `ERR_INVALID_URL` | `validImages` computed로 `base64Data` 있는 이미지만 렌더(섹션·카운트도 반영) |
| 3 | 낮음 | `ReportDocument.vue` | seed snapshot의 공간명이 영문 키(entrance/living…)로 표시(실 제출 리포트는 한글 라벨) | `WHOLE_SPACES` 기반 `spaceLabel()` key→label 매핑(한글 값은 passthrough) |

- 3건 모두 수정 후 실브라우저 재확인: 목록 정상 표시, 비교 화면 콘솔 클린(0 error), seed 리포트 공간명 한글화. `npm run build` 0 에러.

#### 디자인 기준 (런타임 computed 측정)

| 기준 | 측정값 | 결과 |
|---|---|---|
| Primary CTA `#3E6AE1` | 비교하기/다음 버튼 bg = `#3E6AE1`, `bg-brand` 토큰 = `#3E6AE1` | ✅ |
| 기본 배경 `#FFFFFF` | body bg = `#FFFFFF` | ✅ |
| 보조 배경 `#F4F4F4` | `.bg-surface` = `#F4F4F4` | ✅ |
| 주요 텍스트 `#171A20` | `.text-ink` = `#171A20` | ✅ |
| 본문 텍스트 `#393C41` | 보조 버튼 텍스트 = `#393C41` | ✅ |
| 과한 shadow/gradient/pill | heavy shadow 0 / gradient 0 / 버튼 rounded-full 0 | ✅ |
| 휴대폰 외곽 프레임 미구현 | 일반 반응형 컨테이너 | ✅ |
| AI 도우미 카드형 | 행동 가이드 카드(촬영/확인 유형 배지) | ✅ |
| 리포트 수정/삭제 없음 | 상세·공유·인쇄 전부 0 | ✅ |
| 공유 read-only | 인쇄 버튼만 | ✅ |
| 임차인 의견 UI 없음 | textarea 0 | ✅ |

#### 반응형 (가로 스크롤·레이아웃)

| 화면 | Mobile 390 | Tablet 768 | Desktop 1440 |
|---|---|---|---|
| 가로 스크롤 | 없음(검사 화면 전부 scrollW≤vw) | 없음 | 없음 |
| 리포트 비교 패널 | 상하 stacked(x=16 동일, y 차이) | 좌우 side-by-side(x=16/388) | 좌우 side-by-side |
| 리포트 상세 액션바 | 3버튼 한 줄, 뷰포트 내(클리핑 없음) | 정상 | 정상 |
| 점검 작성/issue 폼 | 칩 wrap·CTA 하단 고정 노출 | 정상 | 정상 |

#### 콘솔/네트워크 오류

- **결함성 콘솔 오류 0건**(수정 완료). 잔여 로그 2종은 모두 의도된 동작:
  - `/contractor`: `GET /api/inspections` **404** — 백엔드 목록 API 부재(보류 갭). 프론트 `try/catch`로 빈 목록 graceful 처리(코드 주석에 명시). 브라우저 네트워크 레이어 로그라 앱단 억제 불가 → **백엔드 `GET /api/inspections` 구현이 정식 해소책**.
  - 비교 불일치: `GET /reports/compare` **400** — 정상 validation 응답. 프론트가 catch하여 AlertMessage로 백엔드 메시지 표시.
- 주요 API 실호출 확인: demo/users·units·POST inspections(201)·PATCH·submit(201)·reports·confirm·share·share/:token·compare 전부 정상.

#### 수정 사항 (파일)

- `frontend/src/views/reports/ReportList.vue` (필드명 정정)
- `frontend/src/components/inspection/ReportDocument.vue` (validImages 필터 + spaceLabel 매핑)

#### 실패/보류/TODO

- **(보류·백엔드)** `GET /api/inspections`(시공업자 본인 점검 목록) 미구현 — `/contractor` 콘솔 404의 원인. 프론트는 graceful 처리되어 시연 비차단. 백엔드 세션에서 read-only 목록 엔드포인트 추가 권장.
- 수정 금지 범위(플로우 재설계/API 대규모 변경/DB 구조/임차인 의견·리포트 수정삭제 기능/서버 PDF) 미침범.
- 비고: 검증 중 report id=4(등급 B, 제출), draft inspection id=7(issue, 미제출), 확인/공유 데이터가 생성됨 → 발표 전 `npm run db:reset` 권장.

#### 다음 세션 인수인계

- **F-VERIFY 실브라우저 검증 완료(통과)** — 발표 전 실브라우저 점검 보류 항목 해소됨. 다음은 **I03 README/제출 정리**. 단일 잔여 이슈는 백엔드 `GET /api/inspections` 목록 API(보류).

---

### I01 (재검증) 프론트/백엔드 통합 검증

| 항목 | 내용 |
|---|---|
| 세션 ID | I01 (재검증) |
| 영역 | 통합 |
| 상태 | 완료 |
| **최종 판정** | **통과** — 17개 통합 시나리오 전부 실브라우저 1회 이상 성공 |
| 작업 일시 | 2026-06-03T02:45:00Z |
| 담당 목표 | 프론트↔백엔드 API 연결 전구간 검증, 응답 구조/프론트 사용 구조 불일치 수정 |
| 사용 문서 | progress.md, B-VERIFY/F-VERIFY 결과, PRD, 프론트엔드 PRD |
| 환경 | backend 재기동(포트 정리 후) + frontend, `npm run db:reset` 클린 seed에서 시작 |

#### 시나리오별 결과 (17/17 성공)

| # | 시나리오 | API/결과 |
|---|---|---|
| 1 | 데모 사용자 선택 | GET /api/demo/users 200, POST /api/session/select-user 200 |
| 2 | 시공업자 홈 진입 | /contractor 렌더(콘솔 404=GET /api/inspections 백엔드 갭, graceful) |
| 3 | 새 점검 생성 | POST /api/inspections 201 (id=6) |
| 4 | 입주 전 점검 작성 | flow=whole 자동 결정 |
| 5 | 전체 점검 저장 | 8공간 32항목 작성, 제출 시 PATCH 200으로 전량 영속 |
| 6 | AI 점검 도우미 호출 | POST /api/ai/inspection-guide 200, 행동 카드 렌더(실 GPT) |
| 7 | 이미지 첨부 | **실제 PNG 업로드** → Base64 변환 → 미리보기 1/20, 깨짐 없음 |
| 8 | 최종 의견 작성 | textarea 입력, 리포트엔 최종 수정본만 |
| 9 | 점검 제출 | PATCH 200 → POST /:id/submit 201 |
| 10 | 리포트 자동 생성 | report id=4, **등급 A**(전 항목 정상), snapshot 생성 |
| 11 | 임대인 리포트 목록 | GET /api/reports 200, 카드 제목 정상(필드명 수정 반영) |
| 12 | 임차인 리포트 목록 | 본인 호실만 4건, 누수 0, "임차인 · 내 호실 리포트" |
| 13 | 확인 완료 | POST /api/reports/4/confirm, 버튼 "확인 완료됨" 비활성(멱등) |
| 14 | 공유 링크 생성 | POST /api/reports/4/share, /share/&lt;token&gt; URL 발급 |
| 15 | 공유 링크 접근 | GET /api/share/&lt;token&gt; 200 무인증 공개, 인쇄 버튼만(확인/수정/삭제 0) |
| 16 | PDF 인쇄창 호출 | /reports/4/print 렌더, `.no-print` 액션바 + 이미지 정상 |
| 17 | 리포트 비교 | GET /api/reports/compare 200, 같은 유형 valid, 좌우 2패널, 콘솔 0 error |

#### 이미지 전구간 통합 실증 (이전 세션 미검증 구간)

- 시공업자 화면에서 실제 PNG 업로드 → 컴포넌트가 Base64로 변환 → 제출 시 PATCH로 저장 → submit 시 snapshot.images에 `{base64Data, mimeType, photoType, caption, sizeBytes}` 임베드(API 응답으로 base64Data 길이>0 확인).
- 같은 이미지가 **리포트 상세·공유·인쇄·비교** 4개 화면에서 `data:image/png;base64,...`로 렌더되고 `naturalWidth>0`(깨짐 없음) 확인. F-VERIFY에서 넣은 `validImages` 가드와 정합.

#### 발견 결함 및 수정 (1건)

| 심각도 | 위치 | 증상 | 원인 | 수정 |
|---|---|---|---|---|
| 중간 | `PhotoManager.vue` / `PhotoSlot.vue` | "사진 추가" 클릭 시 파일 선택창이 **두 번** 열림 | 추가 타일의 래퍼 `@click="$emit('add')"`(→ `triggerFileInput()`로 input.click())와, 같은 타일을 덮은 투명 `<input type=file>` 오버레이의 네이티브 클릭이 **둘 다** 발화 | `PhotoManager`의 파일 input을 투명 오버레이(`absolute inset-0 opacity-0 …`)에서 `hidden`으로 변경 → 프로그램적 `@add → triggerFileInput()` 경로만 단일 발화. 재검증 시 chooser 1회만 열림 확인 |

#### 발견 위험(미수정·기록) 1건

- **(위험·중간) 전체 점검 작성 중 페이지 리로드 시 미저장분 유실.** whole flow는 항목/사진/의견을 제출 시점까지 **메모리에만** 보관하고 그때 PATCH로 일괄 저장한다. 따라서 작성 도중 어떤 이유로든 페이지가 리로드(HMR·새로고침 등)되면 서버의 원본(전 항목 normal)으로 재하이드레이트되어 **1단계·전부 정상으로 조용히 되돌아간다**(작성 내용 소실, 경고 없음).
  - 본 세션 중 `.png` 임시파일을 프로젝트 트리에 생성했을 때 Vite HMR 전체 리로드가 발생해 이 현상을 실제로 재현함(이후 임시파일은 watch 밖 경로로 이동해 회피).
  - 근본 해소책은 단계 전환/주기적 **autosave(PATCH)** 도입이나, 이는 "새 기능 추가 금지" 범위라 I01에서는 미구현·기록만. 발표 시연은 한 번에 진행되므로 비차단.

#### 임시 우회 처리

- 검증용 1×1 PNG는 Playwright MCP의 허용 루트 제약 때문에 `.playwright-mcp/`(Vite watch 밖)에 두고 업로드, 종료 시 삭제. 앱 코드 무관.

#### F-VERIFY 수정 3건 통합 재확인

- ReportList 필드명 정정, ReportDocument `validImages`·`spaceLabel` — 목록 제목 정상·이미지 정상 렌더·공간명 한글, 통합 흐름에서 회귀 없음.

#### 수정 사항 (파일)

- `frontend/src/components/inspection/PhotoManager.vue` (파일 input 오버레이 → hidden, 이중 chooser 제거)

#### 실패/보류/TODO

- 실패: 없음(17/17 성공).
- 보류: 위 "작성 중 리로드 시 미저장분 유실" 위험(autosave는 범위 외) / 백엔드 `GET /api/inspections` 목록 API(콘솔 404 원인).
- 비고: 검증 데이터(report id=4 A등급+이미지, 확인/공유 1건) 생성됨 → 발표 전 `npm run db:reset` 권장.

#### 다음 세션 인수인계

- **I01 통합 검증 통과.** 다음은 **I03 README/제출 정리**. I03에 보류 이슈(목록 API·autosave 위험) 명시 권장.

---

### I02 (보정 2차) 발표 시연 UX 보정

| 항목 | 내용 |
|---|---|
| 세션 ID | I02 (보정 2차) |
| 영역 | 통합 |
| 상태 | 완료 |
| **최종 판정** | **완료** — 발표 시연 핵심 UX 마찰 1건 보정, clean seed 재설정 |
| 작업 일시 | 2026-06-03T03:15:00Z |
| 담당 목표 | 발표 시연 흐름의 화면 혼란 보정, seed 데모 데이터 정비 |
| 사용 문서 | progress.md, I01 결과, 프론트엔드 PRD v2, 와이어프레임, DESIGN.md |
| 비고 | 데모 16단계 전구간 동작은 I01(재검증)에서 17/17 성공으로 확인됨 → 본 세션은 발표자 관점 마찰 제거에 집중 |

#### 발견한 발표 마찰 + 보정 (1건)

| 위치 | 마찰 | 원인 | 보정 |
|---|---|---|---|
| `CompareView.vue` (리포트 비교) | 같은 호실·같은 유형·같은 등급·같은 날짜 리포트가 비교 드롭다운/결과에서 **라벨이 완전히 동일**해 어느 것이 "방금 만든 리포트"인지 구분 불가 | 옵션 라벨이 `호실 · 유형 · 등급 · 날짜`뿐 → 데모에서 새 리포트(예: 거실 창호 주의→B)와 seed #1(B, move_in, 같은 날짜)이 글자 그대로 일치 | 비교 **드롭다운 옵션·검증 요약·좌우 패널 헤더**에 `#리포트id` 표기 추가. 발표자가 "#4가 방금 만든 리포트"라고 바로 지칭 가능 |

- 실브라우저 확인: 드롭다운에 `#4 · … A등급`, `#3 · … A등급`로 구분 표시(이전엔 두 줄이 동일), `#4 ↔ #1` 비교 시 요약 "이전: #4 … / 현재: #1 …", 패널 헤더 "이전 리포트 #4 · 입주 전 점검"/"현재 리포트 #1 · …" 정상. 콘솔 0 error, build 0 에러.
- 리포트 **목록 카드는 #id 미표기 유지**(최신순 정렬이라 "맨 위 카드 = 방금 생성"으로 식별 가능 + Tesla 미니멀 카드 가독성 보존).

#### seed / 데모 데이터 정비

- 발표 전 **clean seed 재설정**(backend 중지 → `npm run db:reset` → 재기동). 결과 리포트: `#1 move_in B`, `#2 periodic C`, `#3 move_in A`.
- **비교 시연 그룹 유지**: `comparable groups: [{unit_id:1, inspection_type:'move_in', n:2}]` (= #1, #3) 그대로 보존 → 데모 step 15에서 새 리포트(#4)와 비교 가능.
- 검증용 누적 데이터(I01의 #4 등) 제거됨 → 발표 시 드롭다운이 깔끔.

#### 기존 문구 보정(1차 I02) 유지 확인

- ContractorHome 빈 상태("새 점검을 시작하면 여기에 표시됩니다." 등), NewInspection 임대인/임차인 placeholder("리포트 생성 시 …") 문구 그대로 유지. 회귀 없음.

#### 발표 시연 시 남은 위험 요소 (운영 참고)

1. **AI 도우미는 실 OpenAI API 의존** — 발표장 인터넷/키 필요. 장애 시 graceful fallback 카드로 시연 비차단(단 결과가 기본 안내로 표시).
2. **전체 점검 작성 중 페이지 리로드 시 미저장분 유실**(I01 기록) — 작성 도중 새로고침 금지. 한 번에 제출까지 진행하면 무관.
3. **시공업자 홈 작성 중/제출 대기 카드 비어 있음** — 백엔드 `GET /api/inspections` 부재(콘솔 404, graceful). "+ 새 점검 시작"으로 진행하면 영향 없음.
4. **점검 대상 입력의 임대인/임차인은 placeholder** — 실제 이름은 리포트에서 표시(검증됨).
5. **매 시연 전 `npm run db:reset` 권장** — 본 세션에서 재설정 완료. 시연 중 생성된 리포트 누적 시 비교 드롭다운이 길어짐(단 #id로 구분은 가능).

#### 수정 사항 (파일)

- `frontend/src/views/reports/CompareView.vue` (비교 옵션/요약/패널 헤더에 `#id` 표기)

#### 실패/보류/TODO

- 실패: 없음. 데모 흐름 동작은 I01에서 확인, 본 세션 변경(비교 #id)도 실브라우저 검증 완료.
- 보류: 백엔드 `GET /api/inspections` 목록 API / 전체점검 autosave 위험 / seed snapshot 이미지·공간명(프론트 방어로 표시는 정상).

#### 다음 세션 인수인계

- 발표 시연 UX 보정 완료, clean seed 상태로 정리됨. 다음은 **I03 README/제출 정리**(실행 가이드 + 데모 안내 + 보류 이슈 명시).

---

### I02 발표 시연 데이터 + UX 보정

| 항목 | 내용 |
|---|---|
| 세션 ID | I02 |
| 영역 | 통합 |
| 상태 | 완료 |
| 작업 일시 | 2026-06-02T00:30:00Z |
| 담당 목표 | 발표 시연 데이터 보정, 발표용 문구 정리, 시연 플로우 1회 성공 검증 |
| 사용 문서 | progress.md, PRD, 프론트엔드 PRD, DESIGN.md, 와이어프레임 |
| 비고 | I01(통합 검증)은 별도 미실행 상태였으나, 본 세션의 16단계 데모 플로우 실서버 검증이 전체 플로우 통합 점검을 겸함 |

#### UX 문구 보정 (구조 변경 없음, 문구만)

- `ContractorHome.vue` — 빈 상태 설명 2건의 개발자용 문구("목록 API는 후속 세션에서 연결됩니다") → 발표용("새 점검을 시작하면 여기에 표시됩니다." / "제출 대기 중인 점검이 여기에 표시됩니다.")
- `NewInspection.vue` — 임대인/임차인 placeholder "자동 표시 예정" → "리포트 생성 시 임대인·임차인 정보가 표시됩니다"
- `/ui-preview`의 "F01 디자인 시스템" 문구는 개발용 내부 페이지(시연 18화면에 미포함)라 유지

#### 데모 플로우 16단계 실서버 검증 (전부 성공)

| 단계 | 결과 |
|---|---|
| 1 이시공 선택 | ✅ demo/users 3명, select-user role=contractor |
| 2 새 점검 시작 | ✅ POST /inspections id 생성 |
| 3 입주 전 점검 | ✅ flow=whole(전체 점검) 자동 결정 |
| 4 1203호 선택 | ✅ unit1 |
| 5 공간별 전체 점검 | ✅ items PATCH 저장 |
| 6 거실 창호 주의 | ✅ caution + 위치/설명 |
| 7 AI 점검 도우미 | ✅ 실 GPT 호출, fallback=false, actionCards |
| 8 사진 첨부 | ✅ Base64 2장 |
| 9 최종 의견 | ✅ finalOpinion 저장 |
| 10 점검 제출 | ✅ 201 |
| 11 리포트 자동 생성 | ✅ reportId, **등급 B** |
| 12 김임대 리포트 확인 | ✅ 목록 4건, 상세 snapshot |
| 13 공유 링크 생성 | ✅ 토큰 발급 + 무인증 공개 조회 200 |
| 14 박임차 리포트 확인 | ✅ 본인 호실 리포트 상세 200 |
| 15 리포트 비교 | ✅ 신규 vs seed(1) move_in 비교 valid |
| 16 PDF 저장 버튼 | ✅ 인쇄 소스(snapshot+finalOpinion) GET 200 (UI window.print) |

#### 남은 위험 요소 (발표 시 유의)

1. **AI 도우미는 실 OpenAI API 의존** — 발표장 인터넷/키 필요. 장애 시 graceful fallback 카드로 대체되어 시연은 중단되지 않으나, AI 결과가 기본 안내로 표시됨
2. **시공업자 홈의 작성 중/제출 대기 카드는 비어 있음** — 백엔드 `GET /api/inspections` 목록 API 부재(보류 이슈). 시연은 "+ 새 점검 시작"으로 진행되어 영향 없음. 빈 상태 문구는 발표용으로 보정 완료
3. **점검 대상 입력의 임대인/임차인은 placeholder** — `/api/units` 참여자 미포함(보류 이슈). 실제 이름은 리포트에서 표시됨(검증됨). 문구 보정 완료
4. **F-VERIFY 실브라우저 검증 보류** — Playwright MCP 미연결. 발표 전 실브라우저 1회 점검 권장
5. **매 시연 전 `npm run db:reset` 권장** — 깨끗한 seed로 시작(비교 가능 그룹 unit1 move_in 유지). 시연 중 생성된 리포트가 누적되면 비교 select가 길어질 수 있음

#### 실패/보류/TODO

- 없음(시연 차단 결함 미발견). 위 위험 요소는 발표 운영 참고용

#### 다음 세션 인수인계

- I03 — README / 제출 정리(실행 가이드: `npm install` → `npm run db:reset` → `npm run dev` ×2, 데모 사용자/플로우 안내, 환경변수 OPENAI_API_KEY 안내). 보류 이슈(목록 API·units 참여자·Playwright 재검증) 명시 권장

---

## 5-A. 추가 수정사항 - 사용자 직접 테스트 피드백 반영 (FIX-01)

> 사용자가 직접 브라우저로 테스트하며 발견한 7개 이슈를 반영한 세션. 실브라우저(Playwright MCP)로 수정 후 재검증함.

| 번호 | 심각도 | 영역 | 문제 요약 | 상태 |
|---:|---|---|---|---|
| 1 | 주의 | 메인 / 데모 사용자 선택 | 선택 표시 원형 UI 설명 부족 및 하단 네비게이션 불필요 | 완료 |
| 2 | 심각 | 시공업자 점검 작성 | fixed bottom navigation이 하단 입력 영역을 가려 최종 의견 작성 불가 | 완료 |
| 3 | 주의 | 점검 제출 후 이동 | 제출 후 점검 작성 페이지에 남아 있어 UX 불편 | 완료 |
| 4 | 심각 | 문제 항목 점검 검증 | 위치/증상 설명 필수값 없이 다음 단계 이동 가능 | 완료 |
| 5 | 심각 | 임시 저장 | 임시 저장 후 메인 복귀/토스트/작성 중 점검 표시가 제대로 동작하지 않음 | 완료 |
| 6 | 개선 | 점검 작성 중 뒤로가기 | 작성 중단 확인 팝업 필요 | 완료 |
| 7 | 주의 | 리포트 비교 | 비교 오류 메시지 영어 표시 / 비교 PDF 좌우 출력 | 완료(오류 한국어) · 부분 완료(PDF 좌우=best-effort) |

### FIX-01 사용자 직접 테스트 피드백 반영 (상세)

| 항목 | 내용 |
|---|---|
| 세션 ID | FIX-01 |
| 영역 | 프론트(+백엔드 목록 API 1건) |
| 상태 | 완료 |
| **최종 판정** | **완료** — 7개 이슈 모두 수정, 실브라우저 재검증. 비교 PDF 좌우만 부분(best-effort) |
| 작업 일시 | 2026-06-03T04:30:00Z |
| 사용 문서 | progress.md, PRD, 프론트엔드 PRD v2, DESIGN.md, 와이어프레임 v6, 하네스, 운영규칙 |

#### 이슈별 수정 내용

1. **메인 데모 사용자 선택 UI (완료)** — `Home.vue`의 하단 fixed 네비게이션(선택한 역할로 이동/다른 사용자 선택) 제거(카드 클릭 시 즉시 역할 화면 이동). `SelectCard.vue` 우측 원형 UI를 radio/체크(선택 시 체크 표시) + `sr-only "선택됨/선택 가능"` + `aria-pressed` 로 개선. → 실측: 하단 네비 없음, 카드 클릭→`/contractor` 이동, 접근성 라벨 "이시공 시공업자 선택 가능".
2. **하단 네비 overlap (완료)** — `AppLayout.vue`에서 fixed footer 높이를 `ResizeObserver`로 측정해 `<main>` 하단 패딩을 동적 부여(footer+24px), footer에 `env(safe-area-inset-bottom)` 적용. → 실측(Mobile 390): footer 161px, main padding-bottom 185px, **최종 의견 textarea(bottom 604) < footer top(683)** 으로 가려지지 않고 입력 가능.
3. **제출 후 이동 + toast (완료)** — 전역 토스트 시스템 신설(`lib/toast.js` + `components/ui/ToastHost.vue`, `App.vue`에 마운트). Whole/Issue 제출 성공 시 `showToast('점검 리포트가 정상적으로 제출되었습니다…')` 후 `router.push('/contractor')`. 실패 시 작성 화면 유지 + 오류 표시. → 실측: 제출 시 `/contractor` 이동·리포트 생성, 토스트 렌더 확인(clean dev에서 `[role=status]` 1건).
4. **문제 항목 위치/증상 검증 (완료)** — `IssueInspection.vue` step0→1 이동을 `goToReview()`로 변경: 분야/문제항목 필수, **위치 trim≥2, 증상 trim≥5** 검증, 실패 시 단계 이동 차단 + 필드별 한국어 오류(`위치를 입력해 주세요.`/`증상 설명을 5자 이상 입력해 주세요.`) + `aria-invalid`/`aria-describedby`. → 실측: 빈값·1자/2자 모두 차단·오류 표시, 정상값(주방 싱크대 하부 / 5자+) 통과.
5. **임시 저장 정상화 (완료)** — 백엔드 `GET /api/inspections`(본인 draft/submitted 목록, reported 제외) 신규 추가(`listInspectionsForContractor`). Whole/Issue/New 임시 저장 시 draft 저장 → `showToast('점검 내용이 임시 저장되었습니다.')` → `/contractor` 이동. `ContractorHome` 작성중/제출대기 목록이 실제 데이터로 채워지고, 카드 클릭(`role=button`/Enter) 시 `/contractor/inspections/:id`로 **이어서 작성**. → 실측: 임시 저장 후 작성 중에 "퇴거 후 점검" 표시, 새로고침 후 유지, 클릭하면 입력값 하이드레이트되어 이어서 작성됨.
6. **뒤로가기 확인 팝업 (완료)** — `components/ui/ConfirmDialog.vue` 신설. Whole/Issue 상단 뒤로가기 → 확인 다이얼로그("리포트 작성을 중단하고 메인페이지로 돌아가시겠습니까? / 리포트 작성 내용은 저장되지 않습니다. / 저장을 원하신다면 임시 저장을 해주세요.") + `작성 중단`/`취소`. → 실측: 취소=현재 화면 유지, 작성 중단=`/contractor` 이동(저장 안 함). reported 상태는 다이얼로그 없이 바로 이동.
7. **비교 오류 한국어화 + 비교 PDF 좌우 (완료/부분)** — `CompareView.vue`에 `translateCompareError()` 추가: 백엔드 영어 메시지를 호실 불일치/유형 불일치/선택 오류/미존재/접근불가 → 한국어로 매핑. → 실측: 입주전 vs 정기 비교 시 "같은 점검 유형의 리포트만 비교할 수 있습니다. (수리 전 ↔ 수리 후는 예외)" 표시, 영어 누출 0. **PDF 좌우(부분 완료)**: 비교 그리드에 `.compare-grid` + `@media print { grid-template-columns:1fr 1fr }` 강제 2열 규칙 추가(요약 행은 원래 flex라 좌우 유지). 단, 두 리포트 전체를 좁은 인쇄 용지에서 한 페이지 좌우로 안정 유지하는 것은 보장 어려워 best-effort(아래 보류 참고).

#### 수정/생성한 파일

- 신규: `frontend/src/lib/toast.js`, `frontend/src/components/ui/ToastHost.vue`, `frontend/src/components/ui/ConfirmDialog.vue`
- 프론트 수정: `frontend/src/App.vue`(ToastHost 마운트), `components/ui/AppLayout.vue`(동적 하단 패딩), `components/ui/SelectCard.vue`(radio/체크·aria), `views/Home.vue`(footer 제거), `views/NewInspection.vue`(임시저장 토스트), `views/ContractorHome.vue`(목록 카드 클릭 이어쓰기), `views/inspection/WholeInspection.vue`·`IssueInspection.vue`(뒤로가기 확인·제출/임시저장 토스트+이동, Issue는 위치/증상 검증), `views/reports/CompareView.vue`(오류 한국어·print 2열)
- 백엔드 수정: `backend/src/routes/inspections.js`(`GET /` 목록), `backend/src/db/repositories/inspections.js`(`listInspectionsForContractor`)

#### 실행한 검증

```bash
npm --prefix frontend run build      # 0 에러
npm --prefix backend run db:reset    # 클린 seed
# Playwright MCP: / · /contractor · 점검 작성(whole/issue) · 비교 화면 실조작
curl -s http://localhost:3000/api/inspections -H "X-User-Id: 1"   # 200 (contractor), 403 (owner)
```

#### 검증 결과 요약

- build 0 에러. 신규 목록 API 200(contractor)/403(owner). 7개 이슈 실브라우저 재검증 통과(위 이슈별 실측).
- viewport: 데모 사용자/작성/footer overlap은 Mobile 390에서, 비교는 Desktop 1440에서 확인.
- 비고: 토스트는 다수 증분 수정 후 dev HMR 모듈 중복으로 렌더가 막혔다가, **dev 서버 재시작(클린 모듈 그래프) 후 정상 렌더 확인**. 프로덕션 빌드/정상 로드에서는 문제 없음.

#### 보류 항목

| 우선순위 | 이슈 | 영역 | 상태 | 비고 |
|---|---|---|---|---|
| 중간 | 리포트 비교 PDF 좌우 배치 | 프론트/PDF | 부분 완료(보류) | `@media print` 2열 규칙으로 요약·기본정보 좌우는 유지되나, 두 리포트 전체(사진 포함)를 좁은 용지에서 한 페이지 좌우로 안정 유지하기는 어려움. 화면 표시는 좌우 정상. 완전 보장은 추후 서버 PDF 생성 방식 검토 필요 |
| 중간 | 전체 점검 작성 중 리로드 시 미저장분 유실 | 프론트 | 보류 | I01 기록 유지. autosave 도입은 범위 외 |

#### 다음 세션 인수인계

- 7개 사용자 피드백 반영 완료. 다음은 **F-VERIFY 재검증**(이번 변경이 18화면 전반에 영향 → 재검증 권장) 또는 **I03 최종 README/제출 정리**. 비교 PDF 좌우 완전 보장과 autosave는 보류.

---

### I03 최종 README 및 제출 정리

| 항목 | 내용 |
|---|---|
| 세션 ID | I03 |
| 영역 | 통합(문서) |
| 상태 | 완료 |
| **최종 판정** | **완료** — 신규 사용자가 README만으로 설치·실행·시연 가능 |
| 작업 일시 | 2026-06-03T05:00:00Z |
| 사용 문서 | progress.md, PRD, 프론트엔드 PRD, DESIGN.md, package.json·.env.example 실파일 |

#### 작업 내용

- **루트 `README.md` 전면 재작성**(기존 S00 스텁 → 13개 섹션):
  1 소개(법적 판단 아님 명시) · 2 기술 스택 · 3 폴더 구조 · 4 설치(`npm run install:all`) · 5 환경변수(backend/frontend `.env`, 실키 미포함) · 6 DB 초기화(`npm run db:reset` 등) · 7 백엔드 실행 · 8 프론트 실행 · 9 발표 시연 16단계(FIX-01 반영: 제출 후 자동 `/contractor`+토스트) · 10 주요 기능 + 데모 사용자 표 · 11 제외 기능 · 12 알려진 한계 · 13 문제 발생 시 확인(트러블슈팅 표).
- **루트 `package.json`에 `db:reset` 스크립트 추가**(`npm --prefix backend run db:reset` 래핑) → README의 DB 초기화 명령 일원화.
- **정확도 점검(실파일 기준)**: `frontend/.env(.example)`의 `VITE_API_BASE_URL=http://localhost:3000/api`(끝 `/api` 포함)를 정확히 반영, `backend/.env.example`은 `OPENAI_API_KEY=`(빈 값)·`OPENAI_MODEL=gpt-4o-mini`·`PORT=3000`으로 **실제 키 없음 확인**, `.gitignore`가 `.env`/`*.sqlite` 무시함을 확인.

#### 수정/생성한 파일

- `README.md`(전면 재작성), `package.json`(루트, `db:reset` 스크립트 추가)

#### 검증

- README 명령 정확성 교차 확인: 루트 스크립트(install:all/db:reset/dev:backend/dev:frontend/start:backend)와 backend(dev/db:init/db:init:force/db:seed/db:reset)·frontend(dev/build/preview) 스크립트 일치.
- 보안: 실제 API Key 미기재, `.env` 비커밋 안내, 발표용 데모·비법적판단 명시.
- 한계/제외: AI fallback·인증 없음·작성 중 새로고침 유실·비교 PDF 좌우 best-effort·seed 일부 이미지/공간명을 숨기지 않고 명시.

#### 실패/보류/TODO

- 없음(문서 작업). 코드 보류 항목(비교 PDF 좌우 완전 보장 / 전체점검 autosave / seed snapshot 보정)은 README "알려진 한계"에 명시됨.

#### 다음 세션 인수인계

- **계획된 전 세션(S00~I03) 완료.** 발표 전 권장: ① `npm run db:reset`로 클린 시연 데이터, ② FIX-01 변경분에 대한 **F-VERIFY 재검증**(선택), ③ `OPENAI_API_KEY` 준비(없으면 fallback).

---

## 6. API 계약 변경 기록

| 일시 | 변경 항목 | 변경 내용 | 영향 범위 |
|---|---|---|---|
| 2026-06-01 | GET /api/health 응답 포맷 | `{ok,service,time}` → `{ok,data:{service,time}}` | 공통 포맷 통일, 외부 사용자 없음 |
| 2026-06-01 | 전체 error 응답 포맷 | `{ok:false,error:"CODE"}` → `{ok:false,error:{code,message,details?}}` | B01 내부 보완, 외부 사용자 없음 |
| 2026-06-01 | `/api/demo/users` · `/api/session/select-user` · `/api/units` 신규 | X-User-Id 헤더(또는 `?userId=` 쿼리) 기반 데모 권한. `/api/units`는 역할별 호실 필터, 응답 `{id, unitLabel, building:{id,name,address}, roleInUnit}` 카멜케이스+중첩 | F02 사용자 선택/시공업자 홈에서 호출 예정 |
| 2026-06-01 | /api/inspections 신규 (POST/GET/PATCH/DELETE) | flow 자동 결정, status 머신 draft↔submitted (PATCH), reported 수정·삭제 차단, items/observations/images 자식 행은 PATCH 시 전체 교체 | F03/F04에서 호출 예정 |
| 2026-06-01 | POST /api/inspections/:id/submit 신규 | 점검 제출 → 규칙 기반 등급(A~E) 산출 → reports + report_snapshots(JSON) 자동 생성 → inspection.status=reported (단일 트랜잭션). 응답 `{reportId, grade}` 201. 중복 제출 409, 비-contractor 403, 미인증 401. 스냅샷은 제출 시점 불변 복사본 | F05(제출 후 리포트 이동)·B07(리포트 조회)에서 사용 예정 |
| 2026-06-01 | POST /api/ai/inspection-guide 신규 | body `{inspectionId?, ...context}` → GPT로 `{summary, actionCards[], requiredDocuments[], cautionPhrases[], opinionDraft}` 생성. 금지표현 후처리 치환. inspectionId 유효 시 ai_guides 저장. AI 실패해도 **항상 200 + fallback 가이드**(점검 흐름 비차단). 응답 `{guide, fallback, filtered, saved, aiGuideId?}` | F05(AI 도우미 카드 UI)에서 호출 예정 |
| 2026-06-01 | Report/공유 API 신규 | `GET /api/reports`(접근 가능 목록), `GET /api/reports/:id`(상세: snapshot+confirmations+shareLinks, 403/404), `POST /api/reports/:id/confirm`(owner/tenant 멱등·독립, `{confirmed, role, alreadyConfirmed}`), `POST /api/reports/:id/share`(201, `{token, sharePath}`), `GET /api/share/:token`(**무인증 공개**, snapshot+confirmations, 마스킹 없음). 접근 규칙=unit_users 매핑 | F07(리포트 목록/상세)·F08(공유/PDF)에서 호출 예정 |
| 2026-06-01 | GET /api/reports/compare 신규 | `?leftId=&rightId=` → 같은 호실+같은 유형(수리 전↔후 예외) 2개 비교. 응답 `{left, right, compareMeta:{unit, leftReport, rightReport, repairExceptionApplied}, validation:{valid, sameUnit, sameType, repairExceptionApplied}}`. 자동 분석/책임판단 없음. 조건 불일치 400, 미존재 404, 권한없음 403. **`/compare`는 `/:id`보다 먼저 등록됨** | F08(비교 화면)에서 호출 예정 |
| 2026-06-03 | GET /api/inspections 신규 (FIX-01) | 본인(시공업자) 진행 중 점검 목록(draft/submitted, reported 제외). 응답 `{inspections:[{id, inspectionType, flow, status, inspectedAt, unit:{id, unitLabel, building:{id,name}}}]}`. 비-contractor 403. **`/`는 `/:id`보다 먼저 등록**. 기존 B04 계약(GET /api/inspections)의 미구현 갭 해소 — 신규 기능 아님 | ContractorHome 작성중/제출대기 목록 |

---

## 7. DB Schema 변경 기록

| 일시 | 변경 테이블 | 변경 내용 | 영향 범위 |
|---|---|---|---|
| 2026-06-01 | users, buildings, units, unit_users, inspections, inspection_items, inspection_observations, inspection_images, ai_guides, reports, report_snapshots, report_confirmations, share_links | 13개 테이블 신규 생성 | B02 초기 구현 |
| 2026-06-01 (정정) | schema 컬럼명/enum 명세 정합 | inspection_type/flow/state/photo_type 등 enum 명세대로 재정렬, unit_label/snapshot_json/confirmed_role 등 컬럼명 통일, buildings.owner_id 제거, units.floor 제거, DB 경로 backend/database로 수정 | 후속 B03~B08 영향 |

---

## 8. UI / 디자인 변경 기록

| 일시 | 변경 화면 | 변경 내용 | 기준 문서 |
|---|---|---|---|
| 2026-06-01 | 공통 UI 시스템 / /ui-preview | DESIGN.md 팔레트 적용한 14개 공통 컴포넌트 + Tailwind 토큰(brand/surface/ink/body/muted/hair/ph) 신설. 평면 카드·여백 중심, pill·과한 shadow 금지 | DESIGN.md, 프론트엔드 PRD v2, 와이어프레임 v6 |
| 2026-06-01 | 사용자 선택(/) · 시공업자 홈(/contractor) · 새 점검(/contractor/inspections/new) | 와이어프레임 카드형 구조 반영 — 사용자 SelectCard, 시공업자 홈 카드/상태태그, 점검 목적 7종 SelectCard 그리드, 점검 대상 폼 | 와이어프레임 v6, 프론트엔드 PRD v2 §3.5 |
| 2026-06-01 | 전체 점검 작성(/contractor/inspections/:id) | 8공간 카드 + 항목별 3상태 세그먼트(정상/주의/수리 필요), 이상 항목만 위치·설명 상세, 검토·저장 단계 | 와이어프레임 v6, 프론트엔드 PRD v2 §3.6 |
| 2026-06-01 | 문제 항목 점검 작성(issue flow) | 분야 칩(5) + 문제 항목 select + 상태(주의/수리 필요) + 위치/증상, 현장 확인 항목 행별 있음/없음/확인 필요 세그먼트 | 와이어프레임 v6 B-01, 프론트엔드 PRD v2 §3.7 |
| 2026-06-01 | AI 점검 도우미 + 최종 의견(양 점검 흐름 마지막 단계) | AI 응답을 카드(요약/행동/자료/주의/초안)로 표시, 초안 적용 버튼, 최종 의견 textarea, 점검 제출 | 와이어프레임 v6(AI 행동 가이드/전문 의견), 프론트엔드 PRD v2 §3.8 |
| 2026-06-01 | 사진 첨부 갤러리(마지막 단계) | 슬롯/추가 버튼형 Base64 이미지 갤러리, 사진 유형 6종 select + 설명, 10MB/20장 제한 메시지 | 와이어프레임 v6(사진 슬롯), 프론트엔드 PRD v2 |
| 2026-06-01 | 리포트 목록(/owner·/tenant/reports) · 상세(/:id) | 역할별 카드 목록, snapshot 문서형 상세(기본정보·항목·사진·의견·확인이력·주의), 확인 완료/공유/인쇄 액션. 수정·삭제·임차인 의견 UI 없음 | 와이어프레임 v6(리포트 목록·상세), 프론트엔드 PRD v2 |
| 2026-06-01 | 비교(/owner/compare)·공유 공개(/share/:token)·인쇄(/reports/:id/print) | 두 리포트 좌우/상하 비교(불일치 오류), 공유 무인증 조회(조회·PDF만), @media print 여백 인쇄 템플릿. 공용 ReportDocument | 와이어프레임 v6(비교/공유/리포트 양식), 프론트엔드 PRD v2 |
| 2026-06-02 | 시공업자 홈·점검 대상 입력 (문구만) | 빈 상태/placeholder 개발자용 문구를 발표용으로 보정(기능·구조 무변경) | I02 발표 시연 보정 |
| 2026-06-03 | 리포트 목록·리포트 문서(공용) | F-VERIFY 실브라우저 검증 결함 수정: 목록 카드 필드명 정정(unit.label/inspectionType), 이미지 base64 없는 항목 방어 렌더(validImages), 공간명 영문키→한글 라벨 매핑(spaceLabel) | F-VERIFY(재검증), 프론트엔드 PRD v2, DESIGN.md |
| 2026-06-03 | 사진 첨부(PhotoManager) | I01 통합 검증 결함 수정: "사진 추가" 클릭 시 파일 선택창 이중 오픈 → 파일 input을 투명 오버레이에서 `hidden`으로 변경(프로그램적 트리거 단일화) | I01(재검증) |
| 2026-06-03 | 리포트 비교(CompareView) | I02 발표 보정: 동일 라벨 리포트 구분을 위해 비교 드롭다운 옵션·검증 요약·좌우 패널 헤더에 `#리포트id` 표기 추가(목록 카드는 미표기 유지) | I02(보정 2차) |
| 2026-06-03 | 전역 토스트·확인 다이얼로그·레이아웃·사용자 선택·점검 작성·비교 (FIX-01) | 사용자 피드백 7건: 토스트 시스템·작성 중단 확인 다이얼로그 신설, fixed footer 동적 패딩(overlap 해소), 데모 사용자 카드 radio/체크+하단네비 제거, 제출/임시저장 후 메인 이동+토스트, 문제항목 위치/증상 검증, 작성중 점검 목록·이어쓰기, 비교 오류 한국어화·인쇄 2열(best-effort) | FIX-01, 프론트엔드 PRD v2, DESIGN.md |

---

## 9. 남은 이슈 / TODO

| 우선순위 | 이슈 | 영역 | 상태 | 비고 |
|---|---|---|---|---|
| 높음 | S00 부트스트랩 필요 | 공통 | 완료 | - |
| 높음 | B01 백엔드 구조 확장 필요 | 백엔드 | 완료 | routes/utils 분리 완료 |
| 높음 | B02 DB Schema/Seed 구현 필요 | 백엔드 | 완료 | SQLite + better-sqlite3 |
| 높음 | B03 데모 사용자 및 권한 API 구현 필요 | 백엔드 | 완료 | GET /api/demo/users, POST /api/session/select-user, GET /api/units |
| 높음 | B04 Inspection CRUD 구현 필요 | 백엔드 | 완료 | draft/submitted/reported |
| 높음 | B05 등급 산출 + Report 자동 생성 필요 | 백엔드 | 완료 | submit API + 규칙 등급 + 불변 스냅샷 |
| 높음 | B06 AI GPT API 연동 필요 | 백엔드 | 완료 | fetch 기반 GPT, JSON 강제, fallback |
| 높음 | B07 Report 조회/확인/공유 필요 | 백엔드 | 완료 | 역할별 접근, 공유 링크, 확인 멱등 |
| 높음 | B08 Report 비교 API 필요 | 백엔드 | 완료 | 같은 호실+유형 2개, 수리 전/후 예외 |
| 높음 | B-VERIFY 백엔드 전체 검증 필요 | 백엔드 | 완료 (통과) | 27/27 통과, 결함 0 |
| 높음 | F01 공통 UI 시스템 필요 | 프론트엔드 | 완료 | 14컴포넌트 + Router + API client + /ui-preview |
| 높음 | F02 사용자 선택/시공업자 시작 필요 | 프론트엔드 | 완료 | demo/users·units 연동, localStorage 세션 |
| 높음 | F03 전체 점검 UI 필요 | 프론트엔드 | 완료 | 공간별 3상태 체크 + 이상 항목 상세 + 저장/복원 |
| 높음 | F04 문제 항목 점검 UI 필요 | 프론트엔드 | 완료 | issue flow: 분야/문제 항목 + 현장 확인 항목 |
| 높음 | F05 AI 도우미/의견/제출 필요 | 프론트엔드 | 완료 | 행동 카드 + finalOpinion + submit |
| 높음 | F06 이미지 첨부 필요 | 프론트엔드 | 완료 | Base64 갤러리, 10MB/20장 제한 |
| 높음 | F07 리포트 목록/상세 필요 | 프론트엔드 | 완료 | 임대인/임차인, 확인 완료, 공유 |
| 높음 | F08 비교/공유/PDF 필요 | 프론트엔드 | 완료 | compare, /share/:token, 인쇄 템플릿 |
| 높음 | F-VERIFY 프론트 전체 검증 필요 | 프론트엔드 | 통과 | 실브라우저 18화면×3 viewport 재검증 완료, 결함 3건 수정 |
| 중간 | (해소) Playwright 실브라우저 재검증 | 프론트엔드 | 완료 | F-VERIFY(재검증)에서 18화면×3 viewport 실행, 결함 3건 수정 |
| 높음 | I01 통합 검증 필요 | 통합 | 통과 | (재검증) 실브라우저 17개 시나리오 전부 성공, 사진 이중 chooser 결함 수정 |
| 높음 | I02 시연 데이터/UX 보정 필요 | 통합 | 완료 | 데모 16단계 성공, 발표용 문구 |
| 높음 | I03 README/제출 정리 필요 | 통합 | 완료 | README 13개 섹션 + 루트 db:reset 스크립트 |
| 중간 | (백엔드 갭) 점검 목록 조회 API 부재 | 백엔드 | 완료 | FIX-01에서 GET /api/inspections 추가 — 시공업자 홈 작성중/제출대기 목록 + 이어서 작성 |
| 낮음 | (백엔드 갭) /api/units 참여자 미포함 | 백엔드 | 보류 | 호실 임대인/임차인 자동표시용. F02에서 placeholder 처리 |
| 낮음 | (데이터) seed report_snapshots 이미지 base64 누락·공간명 영문 | 백엔드(seed) | 보류 | F-VERIFY에서 프론트 방어 처리(validImages/spaceLabel)로 표시 정상화. 근본 해소는 seed 보정 |
| 중간 | (위험) 전체 점검 작성 중 리로드 시 미저장분 유실 | 프론트 | 보류 | whole flow는 제출 시점까지 메모리 보관 → 리로드 시 1단계·전부 정상으로 조용히 복귀. 근본 해소=단계 autosave(범위 외). I01에서 기록만 |

---

## 10. 다음 세션 추천

```text
계획된 전 세션(S00~I03) 완료 — 제출 준비 완료.
발표 전 권장: ① npm run db:reset (클린 시연) ② (선택) FIX-01 변경분 F-VERIFY 재검증 ③ OPENAI_API_KEY 준비(없으면 fallback)
(잔여 보류: 비교 PDF 좌우 완전 보장 / 전체점검 작성 중 autosave / seed snapshot 이미지·공간명 보정)
```

---

## 11. 마지막 업데이트

| 항목 | 내용 |
|---|---|
| 마지막 업데이트 일시 | 2026-06-03T05:00:00Z |
| 마지막 세션 | I03 (README / 제출 정리) |
| 다음 권장 세션 | (전 세션 완료) 제출 준비 완료 — 발표 전 db:reset 권장 |
