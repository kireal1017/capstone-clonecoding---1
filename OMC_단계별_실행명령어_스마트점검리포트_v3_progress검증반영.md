# OMC 단계별 실행 명령어 모음 v3 - 스마트 점검 리포트

> 이 문서는 스마트 점검 리포트 프로젝트를 OMC / Claude Code로 단계별 구현할 때, 각 세션에 그대로 전달할 수 있는 프롬프트 모음입니다.  
> 최신 기준은 다음을 반영합니다.
>
> - 문서 구조: `docs/prd`, `docs/specs`, `docs/harness`, `docs/design`, `docs/wireframes`
> - 세션 진행 기록: `docs/progress.md` 하나로 통합 관리
> - B08 이후: `B-VERIFY 백엔드 전체 검증`
> - F08 이후: `F-VERIFY Playwright MCP 프론트 전체 검증`
> - 프론트 구현 기준: 와이어프레임 + DESIGN.md + 공통 UI 시스템
> - 리포트 정책: 제출 시 자동 생성, Snapshot JSON 저장, 생성 완료 후 수정/삭제 불가

---

# 0. 기본 문서 구조

OMC 세션을 시작하기 전에 프로젝트 문서는 아래 구조로 배치되어 있어야 한다.

```text
smart-inspection-report/
├─ docs/
│  ├─ README_docs.md
│  ├─ progress.md
│  │
│  ├─ prd/
│  │  ├─ PRD_v1.0_스마트점검리포트.md
│  │  ├─ 프론트엔드_PRD_세션별_v2_와이어프레임반영.md
│  │  └─ 백엔드_PRD_세션별.md
│  │
│  ├─ specs/
│  │  ├─ 요구사항분석서_v3.0_스마트점검리포트.md
│  │  └─ 기능명세서_v3.0_스마트점검리포트.md
│  │
│  ├─ harness/
│  │  ├─ OMC_개발세션_분할계획.md
│  │  ├─ OMC_단계별_실행명령어_스마트점검리포트_v3_progress검증반영.md
│  │  ├─ OMC_검증프롬프트_및_progress운영규칙.md
│  │  └─ 개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md
│  │
│  ├─ design/
│  │  └─ DESIGN.md
│  │
│  └─ wireframes/
│     └─ 스마트점검리포트_전체유스케이스_와이어프레임_v6.html
│
├─ frontend/
├─ backend/
├─ README.md
├─ package.json
└─ .gitignore
```

---

# 1. 모든 세션 공통 시작 지시문

각 OMC / Claude Code 세션을 시작할 때 아래 내용을 먼저 붙여 넣는다.

```md
너는 스마트 점검 리포트 프로젝트의 개발 세션을 담당한다.

작업 시작 전 반드시 `docs/progress.md`를 먼저 확인해줘.
현재까지 완료된 세션, 보류된 이슈, 실패한 작업, 다음 세션 인수인계 내용을 확인한 뒤 이번 세션 범위만 작업해줘.

반드시 아래 문서를 먼저 확인하고, 현재 세션의 범위를 벗어나는 구현은 하지 마라.

공통 확인 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/harness/OMC_개발세션_분할계획.md
4. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md
5. docs/specs/요구사항분석서_v3.0_스마트점검리포트.md
6. docs/specs/기능명세서_v3.0_스마트점검리포트.md

핵심 정책:
- 프로젝트는 모노레포 구조로 진행한다.
- frontend는 Vue 3 + Vite + Tailwind CSS로 구현한다.
- backend는 Node.js + Express로 구현한다.
- DB는 SQLite + better-sqlite3를 사용한다.
- 이미지는 Base64로 SQLite에 저장한다.
- AI는 GPT API를 백엔드에서 호출한다.
- AI 응답은 JSON으로 받는다.
- 로그인은 구현하지 않고 데모 사용자 선택 방식으로 진행한다.
- selectedUserId, selectedRole은 localStorage에 저장한다.
- 점검 제출 시 리포트가 자동 생성되어야 한다.
- 생성 완료 리포트는 수정/삭제할 수 없다.
- 수정이 필요한 경우 새 리포트를 생성한다.
- Report는 생성 시점의 Snapshot JSON으로 저장한다.
- PDF는 HTML 템플릿 + window.print() 방식으로 구현한다.
- 공유 링크는 시공업자/임대인/임차인 모두 생성 가능하다.
- 공유 링크는 만료 시간이 없다.
- 임차인 의견 작성 기능은 구현하지 않는다.
- 리포트 비교는 같은 호실 + 같은 점검 유형만 허용하되, 수리 전/후 점검은 예외적으로 비교 허용한다.

작업 종료 후 반드시 `docs/progress.md`를 갱신해줘.
갱신해야 할 내용:
1. 전체 진행 현황 표의 이번 세션 상태
2. 세션 기록 요약 표
3. 상세 세션 기록
4. 수정/생성한 파일
5. 실행한 명령어
6. 검증 결과
7. 실패/보류/TODO
8. 다음 세션에서 이어받을 내용
9. API/DB/UI 계약 변경 여부
10. 다음 권장 세션

주의:
- 기존 progress 기록을 삭제하지 않는다.
- 실패나 보류 사항을 숨기지 않는다.
- 이번 세션 범위를 넘어 대규모 수정하지 않는다.
```

---

# 2. S00 - 공통 부트스트랩

```md
이번 세션은 S00 공통 부트스트랩만 진행해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- 현재 프로젝트가 비어 있는 상태인지, 일부 구조가 이미 생성되어 있는지 확인한다.

목표:
- 스마트 점검 리포트 프로젝트의 모노레포 구조를 생성한다.
- frontend, backend, docs 폴더를 기준 구조에 맞게 준비한다.
- Vue 3 + Vite + Tailwind CSS 기본 세팅을 한다.
- Node.js + Express 백엔드 기본 세팅을 한다.
- backend에 `/api/health` 엔드포인트를 만든다.
- backend/prompts 폴더와 시스템 프롬프트 파일 2개를 만든다.
- backend/database 폴더를 만든다.
- 루트 README.md와 .gitignore를 만든다.
- 루트 package.json에서 프론트/백엔드 실행 스크립트를 정리한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
4. docs/prd/백엔드_PRD_세션별.md
5. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md
6. docs/design/DESIGN.md

주의:
- 아직 실제 기능 구현은 하지 않는다.
- DB schema 구현은 B02에서 진행한다.
- 프론트 화면 구현은 F01부터 진행한다.
- 이번 세션은 프로젝트가 정상 실행되는 기본 틀만 만든다.
- docs 폴더 구조는 현재 문서 구조를 유지한다.

완료 조건:
- 루트에서 frontend/backend 실행 스크립트가 정리되어 있어야 한다.
- backend에서 GET /api/health가 정상 응답해야 한다.
- frontend가 npm run dev로 실행되어야 한다.
- 생성한 폴더 구조와 실행 방법을 README에 기록해야 한다.
- 작업 종료 후 docs/progress.md를 갱신해야 한다.
```

---

# 3. B01 - 백엔드 기본 서버 구조

```md
이번 세션은 B01 백엔드 기본 서버 구조 구현만 진행해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- S00 완료 여부와 backend 기본 구조 존재 여부를 확인한다.

목표:
- Node.js + Express 기반 백엔드 서버 구조를 만든다.
- CORS, dotenv, JSON body limit을 설정한다.
- 공통 응답 형식과 공통 에러 핸들러를 만든다.
- `/api/health` 엔드포인트를 확인한다.
- 추후 routes/controllers/services/db/utils 구조로 확장 가능하게 정리한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md
4. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md

구현 범위:
- backend/src/app.js
- backend/src/routes/index.js
- backend/src/utils/response.js
- backend/src/utils/errors.js
- backend/.env.example
- backend/package.json

주의:
- DB schema는 아직 구현하지 않는다.
- AI API는 아직 구현하지 않는다.
- 프론트엔드 파일은 수정하지 않는다.
- Base64 이미지 요청을 고려해 express.json limit은 충분히 크게 설정한다.

완료 조건:
- cd backend && npm run dev 실행 가능
- GET /api/health 정상 응답
- 에러 발생 시 일관된 JSON 응답 반환
- 작업 종료 후 docs/progress.md 갱신
```

---

# 4. B02 - DB Schema 및 Seed 데이터

```md
이번 세션은 B02 SQLite schema 및 seed 데이터 구현만 진행해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B01 완료 여부와 backend 실행 가능 여부를 확인한다.

목표:
- SQLite + better-sqlite3 기반 DB 연결을 구현한다.
- schema 생성 스크립트를 만든다.
- seed 데이터 생성 스크립트를 만든다.
- 데모 사용자, 건물, 호실, 권한, 샘플 리포트, 작성 중 점검, 제출 대기 점검을 생성한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md
4. docs/specs/기능명세서_v3.0_스마트점검리포트.md
5. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md

생성할 주요 테이블:
- users
- buildings
- units
- unit_users
- inspections
- inspection_items
- inspection_observations
- inspection_images
- ai_guides
- reports
- report_snapshots
- report_confirmations
- share_links

Seed 데이터:
- 시공업자 1명: 이시공
- 임대인 1명: 김임대
- 임차인 1명: 박임차
- 건물 2개
- 호실 3개
- 기존 리포트 2~3개
- 작성 중 점검 1개
- 제출 대기 점검 1개

주의:
- 생성 완료 리포트는 report_snapshots에 JSON 형태로 저장한다.
- 초기 seed 리포트도 비교 시연이 가능하도록 같은 호실 + 같은 점검 유형 리포트 2개 이상을 포함한다.
- 이미지 seed는 실제 대용량 이미지가 아니라 placeholder Base64 또는 빈 배열로 처리해도 된다.

완료 조건:
- npm run db:init 또는 이에 준하는 명령으로 DB 초기화 가능
- seed 데이터 생성 가능
- DB 파일이 backend/database에 생성됨
- README 또는 backend 문서에 DB 초기화 방법 기록
- 작업 종료 후 docs/progress.md 갱신
```

---

# 5. B03 - 데모 사용자 및 권한 API

```md
이번 세션은 B03 데모 사용자와 권한 API 구현만 진행해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B02의 schema와 seed 데이터가 정상 생성되었는지 확인한다.

목표:
- 데모 사용자 목록 API를 구현한다.
- 선택된 userId 기준으로 접근 가능한 호실과 리포트를 제한한다.
- 로그인은 구현하지 않고, 요청에서 전달된 userId를 기준으로 권한을 확인한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md
4. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md

구현 API:
- GET /api/demo/users
- POST /api/session/select-user
- GET /api/units

권한 규칙:
- contractor는 본인이 작성한 inspection에 접근 가능
- owner는 본인 소유 호실의 report에 접근 가능
- tenant는 본인 거주 호실의 report에 접근 가능

주의:
- 실제 세션 인증은 구현하지 않는다.
- userId가 없거나 유효하지 않으면 400 또는 401 유사 응답을 반환한다.
- 권한 없는 접근은 403으로 처리한다.

완료 조건:
- 데모 사용자 목록 조회 가능
- userId별 접근 가능한 units가 다르게 반환됨
- 권한 없는 unit/report 접근이 차단됨
- 작업 종료 후 docs/progress.md 갱신
```

---

# 6. B04 - Inspection CRUD

```md
이번 세션은 B04 Inspection CRUD 구현만 진행해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B03의 사용자/권한 API 상태를 확인한다.

목표:
- 시공업자가 점검을 생성, 조회, 수정, 삭제할 수 있게 한다.
- draft/submitted 상태에서는 수정/삭제 가능하게 한다.
- reported 상태에서는 수정/삭제 불가하게 한다.
- 점검 유형에 따라 inspectionFlow를 자동 결정한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md
4. docs/specs/기능명세서_v3.0_스마트점검리포트.md

구현 API:
- POST /api/inspections
- GET /api/inspections/:id
- PATCH /api/inspections/:id
- DELETE /api/inspections/:id

점검 흐름:
- 입주 전 점검, 정기 점검 = whole
- 퇴거 전, 퇴거 후, 긴급, 수리 전, 수리 후 = issue

상태:
- draft
- submitted
- reported

주의:
- 점검 제출과 리포트 자동 생성은 B05에서 구현한다.
- 이미지 저장은 F/B 통합 전 최소 구조만 준비해도 된다.
- reported 상태 수정/삭제 시도는 반드시 차단한다.

완료 조건:
- 점검 생성 가능
- 전체 점검/문제 항목 점검 데이터 저장 가능
- 수정/삭제 권한과 상태 검증 동작
- 작업 종료 후 docs/progress.md 갱신
```

---

# 7. B05 - 등급 산출 및 Report Snapshot 자동 생성

```md
이번 세션은 B05 점검 제출, 등급 산출, Report Snapshot 자동 생성을 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B04 Inspection CRUD가 정상 동작하는지 확인한다.

목표:
- 점검 제출 API를 구현한다.
- 제출 시 리포트가 자동 생성되도록 한다.
- 등급을 규칙 기반으로 산출한다.
- 생성 시점의 데이터를 report_snapshots에 JSON으로 고정 저장한다.
- 리포트 생성 후 inspection 상태는 reported가 된다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md
4. docs/specs/기능명세서_v3.0_스마트점검리포트.md

구현 API:
- POST /api/inspections/:id/submit

처리 흐름:
1. 제출 필수값 검증
2. 등급 산출
3. reports row 생성
4. report_snapshots에 JSON 저장
5. inspections.status = reported
6. 생성된 reportId 반환

등급 규칙:
- 전체 점검 A: 모든 항목 정상
- 전체 점검 B: 주의 1~2개, 수리 필요 없음
- 전체 점검 C: 주의 3개 이상 또는 수리 필요 1개
- 전체 점검 D: 수리 필요 2개 이상
- 전체 점검 E: 소방·안전 관련 수리 필요 또는 긴급 조치 필요
- 문제 항목 점검 B/C/D/E는 긴급성, 수리 필요, 안전 위험 여부에 따라 산출
- 소방·안전 분야에서 수리 필요 또는 긴급 조치 필요는 자동 E등급

주의:
- Report Snapshot은 이후 원본 inspection이 바뀌어도 변하지 않아야 한다.
- 생성 완료 리포트는 수정/삭제 불가 정책을 유지한다.

완료 조건:
- submit API 호출 시 reportId 반환
- report_snapshots에 JSON 저장
- reported 상태 수정/삭제 차단
- 등급 산출 결과가 리포트에 포함됨
- 작업 종료 후 docs/progress.md 갱신
```

---

# 8. B06 - AI GPT API 연동

```md
이번 세션은 B06 AI GPT API 연동을 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B05 리포트 생성 구조와 ai_guides 테이블 상태를 확인한다.

목표:
- 백엔드에서 GPT API를 호출한다.
- 시스템 프롬프트 파일 2개를 읽어 하나의 API 호출에서 함께 사용한다.
- AI 응답은 JSON으로 반환한다.
- AI 결과를 ai_guides 테이블에 저장할 수 있게 한다.
- AI 실패 시 점검 작성이 막히지 않도록 한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md
4. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md

프롬프트 파일:
- backend/prompts/inspection-guide.system.md
- backend/prompts/opinion-draft.system.md

구현 API:
- POST /api/ai/inspection-guide

응답 JSON:
{
  "summary": "...",
  "actionCards": [],
  "requiredDocuments": [],
  "cautionPhrases": [],
  "opinionDraft": "..."
}

금지:
- 임차인 책임 단정
- 임대인 책임 단정
- 고의/과실 확정
- 보증금 공제 가능
- 소송에서 유리
- 판례상 확정
- AI 이미지 판독

주의:
- OPENAI_API_KEY는 backend/.env에서만 읽는다.
- OPENAI_API_KEY는 환경변수에 직접 적용되어있으니, 'OPENAI_API_KEY'로 등록하면 된다.
- 프론트엔드에 API Key를 노출하지 않는다.
- JSON 파싱 실패 시 안전한 기본 응답 또는 오류 응답을 제공한다.
- AI 호출 실패가 점검 제출을 막으면 안 된다.

완료 조건:
- AI API 정상 호출
- JSON 응답 반환
- 금지 표현 최소 필터링
- 실패 시 graceful fallback
- 작업 종료 후 docs/progress.md 갱신
```

---

# 9. B07 - Report 조회, 확인 완료, 공유 링크

```md
이번 세션은 B07 Report 조회, 확인 완료, 공유 링크 기능을 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B05 Report Snapshot과 B03 권한 구조가 정상인지 확인한다.

목표:
- 현재 사용자 기준으로 접근 가능한 리포트 목록을 반환한다.
- 리포트 상세를 반환한다.
- 임대인/임차인 확인 완료를 저장한다.
- 시공업자/임대인/임차인 모두 공유 링크를 생성할 수 있게 한다.
- 공유 링크는 만료 없이 접근 가능하게 한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md

구현 API:
- GET /api/reports
- GET /api/reports/:id
- POST /api/reports/:id/confirm
- POST /api/reports/:id/share
- GET /api/share/:token

정책:
- 공유 링크 만료 없음
- 공유 링크 화면에서 임대인/임차인 이름 마스킹하지 않음
- 공유 링크 접근자는 확인 완료, 수정, 삭제 불가
- 임차인 의견 작성 기능 없음

완료 조건:
- 역할별 리포트 접근 제한
- 확인 완료 이력 저장
- 공유 링크 생성 및 조회 가능
- 권한 없는 리포트 접근 차단
- 작업 종료 후 docs/progress.md 갱신
```

---

# 10. B08 - Report 비교 API

```md
이번 세션은 B08 Report 비교 API를 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B07 리포트 조회와 공유 링크 기능 상태를 확인한다.

목표:
- 리포트 2개를 비교하는 API를 구현한다.
- 같은 호실 + 같은 점검 유형 리포트만 비교 허용한다.
- 수리 전 점검과 수리 후 점검은 예외적으로 비교 허용한다.
- 자동 분석은 하지 않고 두 Snapshot을 반환한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md

구현 API:
- GET /api/reports/compare?leftId=1&rightId=2

비교 조건:
- 같은 호실
- 같은 점검 유형
- 정확히 2개
- 수리 전 ↔ 수리 후 예외 허용
- 자동 책임 판단 없음
- 자동 변경점 분석 없음

반환 데이터:
- left report snapshot
- right report snapshot
- compareMeta
- validation result

완료 조건:
- 조건 충족 시 2개 리포트 Snapshot 반환
- 조건 불일치 시 400 반환
- 수리 전/후 예외 비교 정상 허용
- 작업 종료 후 docs/progress.md 갱신
```

---

# 11. B-VERIFY - 백엔드 전체 검증

```md
이번 세션은 B-VERIFY 백엔드 전체 검증 세션이야.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B01~B08 완료 여부와 보류 이슈를 확인한다.

목표:
- B01~B08에서 구현한 백엔드 전체 구조가 PRD와 백엔드 PRD 기준에 맞는지 실제 실행과 API 호출로 검증한다.
- Express 서버, SQLite DB, seed 데이터, 권한, Inspection CRUD, Report Snapshot, AI API, 공유 링크, 리포트 비교 API를 전체 확인한다.
- 작은 오류는 수정하고, 큰 구조 변경이 필요한 사항은 이슈로 기록한다.

반드시 확인할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md
4. docs/specs/기능명세서_v3.0_스마트점검리포트.md
5. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md
6. docs/harness/OMC_검증프롬프트_및_progress운영규칙.md

검증 대상:
- /api/health
- /api/demo/users
- userId 기반 권한 체크
- /api/units
- Inspection 생성/조회/수정/삭제
- draft/submitted 수정/삭제 가능
- reported 수정/삭제 차단
- 점검 제출 시 report 자동 생성
- report_snapshots JSON 저장
- 등급 산출 규칙
- 소방·안전 수리 필요 시 E등급
- GPT API 연동 구조
- prompts 파일 2개 읽기
- AI JSON 응답 구조
- AI 실패 시 graceful fallback
- 리포트 목록/상세 API
- 임대인/임차인 확인 완료 API
- 공유 링크 생성/조회
- 공유 링크 만료 없음
- 공유 링크 접근자 권한 제한
- 리포트 비교 API
- 같은 호실 + 같은 점검 유형 비교 조건
- 수리 전/후 예외 비교 허용
- 공통 오류 응답 형식

실행 명령:
```bash
cd backend
npm install
npm run dev
```

기본 확인:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/demo/users
```

가능하다면 다음 검증용 스크립트 또는 API 호출을 직접 실행한다.
- DB 초기화 명령
- seed 데이터 생성 명령
- 데모 사용자 목록 조회
- 시공업자 userId로 접근 가능한 점검/호실 조회
- 임대인 userId로 접근 가능한 리포트 조회
- 임차인 userId로 접근 가능한 리포트 조회
- 권한 없는 리포트 접근 시 403 확인
- 새 Inspection 생성
- Inspection 수정
- Inspection 삭제
- Inspection 제출
- Report 자동 생성 확인
- 생성 완료 후 Inspection 수정/삭제 차단 확인
- 공유 링크 생성
- 공유 링크 조회
- 리포트 비교 성공 케이스
- 리포트 비교 실패 케이스

수정 가능 범위:
- import 오류
- 경로 오류
- 라우터 연결 누락
- 응답 구조 불일치
- 간단한 validation 오류
- seed 데이터 누락
- status 조건 누락
- endpoint 명칭 오류

수정 금지 또는 보류:
- 전체 DB 구조 대개편
- API 계약 대규모 변경
- 인증 시스템 추가
- Base64 외 이미지 저장 방식 변경
- 서버 PDF 생성 방식 도입

작업 종료 후:
- `docs/progress.md`에서 B-VERIFY 상태를 갱신한다.
- 성공/실패/보류 항목을 상세 세션 기록에 추가한다.
- 남은 이슈와 다음 권장 세션을 갱신한다.

최종 판정:
- 통과
- 부분 통과
- 보류
- 실패
```

---

# 12. F01 - 프론트 기본 세팅 + 공통 UI 시스템

```md
이번 세션은 F01 프론트 기본 세팅과 공통 UI 시스템 구축만 진행해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B-VERIFY 통과 또는 부분 통과 상태를 확인한다.
- 프론트 구현 전 docs/design/DESIGN.md와 와이어프레임을 반드시 확인한다.

목표:
- Vue 3 + Vite + Tailwind CSS 환경을 정리한다.
- Vue Router를 설정한다.
- API client 기본 구조를 만든다.
- DESIGN.md 기반 공통 UI 컴포넌트를 만든다.
- 와이어프레임 기반 모바일 우선 카드형 UX를 위한 공통 스타일을 만든다.
- /ui-preview 또는 이에 준하는 공통 UI 확인 페이지를 만든다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
4. docs/design/DESIGN.md
5. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html
6. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md

필수 공통 UI:
- AppLayout
- PageHeader
- BaseButton
- BaseCard
- BaseBadge
- StatusTag
- FormField
- SelectCard
- StepIndicator
- EmptyState
- AlertMessage 또는 Toast
- PhotoSlot
- ReportSection
- PrintButton

스타일 기준:
- Primary CTA: #3E6AE1
- 기본 배경: #FFFFFF
- 보조 배경: #F4F4F4
- 주요 텍스트: #171A20
- 본문 텍스트: #393C41
- 보조 텍스트: #5C5E62
- 과한 shadow, gradient, pill 형태 버튼 지양
- 카드 UI는 평면적이고 여백 중심으로 구현
- 실제 Universal Sans 폰트 파일은 사용하지 않음

주의:
- 와이어프레임의 휴대폰 외곽 프레임은 구현하지 않는다.
- 내부 카드형 구조와 사용자 흐름만 반영한다.
- 아직 실제 기능 화면을 깊게 구현하지 않는다.

완료 조건:
- npm run dev 정상 실행
- Tailwind CSS 적용
- 라우터 동작
- 공통 UI 컴포넌트 생성
- /ui-preview에서 공통 UI 확인 가능
- 작업 종료 후 docs/progress.md 갱신
```

---

# 13. F02 - 데모 사용자 선택 및 시공업자 시작 화면

```md
이번 세션은 F02 데모 사용자 선택과 시공업자 시작 화면을 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- F01 공통 UI 시스템이 완료되었는지 확인한다.

목표:
- 데모 사용자 선택 화면을 만든다.
- selectedUserId, selectedRole을 localStorage에 저장한다.
- 선택된 역할에 따라 화면을 분기한다.
- 시공업자 홈을 구현한다.
- 새 점검 시작, 점검 목적 선택, 점검 대상 입력 흐름을 구현한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
3. docs/design/DESIGN.md
4. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html
5. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md

참조 와이어프레임:
- 시공업자 홈
- 점검 목적 선택
- 점검 대상 입력

구현 화면:
- /
- /contractor
- /contractor/inspections/new

기능:
- GET /api/demo/users
- 사용자 선택
- localStorage 저장
- 역할별 라우팅
- 작성 중 점검 카드
- 제출 대기 점검 카드
- 점검 유형 카드
- 호실/건물 선택
- 점검일 기본값
- 선택 호실 기준 임대인/임차인 자동 표시

주의:
- 공통 UI 컴포넌트를 반드시 재사용한다.
- 시공업자 홈은 와이어프레임처럼 카드형으로 구성한다.
- 점검 목적 선택은 SelectCard 형태로 구현한다.

완료 조건:
- 사용자 선택 후 새로고침해도 선택 상태 유지
- 시공업자 선택 시 /contractor 이동
- 새 점검 시작 플로우 진입 가능
- 작업 종료 후 docs/progress.md 갱신
```

---

# 14. F03 - 전체 점검 UI

```md
이번 세션은 F03 입주 전/정기 전체 점검 UI를 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- F02 사용자 선택과 점검 시작 플로우가 정상인지 확인한다.

목표:
- 입주 전 점검과 정기 점검은 전체 점검 UI로 진입한다.
- 공간별 빠른 체크를 구현한다.
- 정상/주의/수리 필요 상태값을 선택할 수 있게 한다.
- 주의/수리 필요 항목만 상세 입력 대상으로 표시한다.
- 전체 점검 데이터를 저장 API와 연결한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
3. docs/design/DESIGN.md
4. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html

참조 와이어프레임:
- 공간별 빠른 확인
- 이상 항목 상세 기록
- 전체 점검 검토

공간:
- 현관
- 거실
- 주방
- 방1
- 방2
- 화장실
- 베란다
- 보일러룸

상태값:
- 정상
- 주의
- 수리 필요

주의:
- 정상 항목은 빠르게 넘어갈 수 있어야 한다.
- 주의/수리 필요 항목은 위치와 상태 설명을 입력해야 한다.
- 공통 StatusTag, SelectCard, FormField, BaseCard를 재사용한다.

완료 조건:
- 전체 점검 공간별 상태 입력 가능
- 이상 항목 상세 입력 가능
- 저장 후 다시 열어도 데이터 유지
- 작업 종료 후 docs/progress.md 갱신
```

---

# 15. F04 - 문제 항목 점검 UI

```md
이번 세션은 F04 문제 항목 점검 UI를 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- F03 전체 점검 UI 완료 상태를 확인한다.

목표:
- 퇴거 전, 퇴거 후, 긴급, 수리 전, 수리 후 점검은 문제 항목 점검 UI로 진입한다.
- 분야/문제 항목 선택 UI를 구현한다.
- 위치와 증상 설명을 입력한다.
- 현장 확인 항목을 있음/없음/확인 필요로 선택한다.
- 문제 항목 점검 데이터를 저장 API와 연결한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
3. docs/design/DESIGN.md
4. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html

참조 와이어프레임:
- 문제 정보 + 현장 확인
- 현장 확인 항목

문제 분야:
- 인테리어·마감
- 샷시·창호
- 설비·배관
- 전기
- 소방·안전

현장 확인 선택값:
- 있음
- 없음
- 확인 필요

주의:
- AI가 현장 확인값을 자동 선택하면 안 된다.
- 시공업자가 직접 선택하는 UI여야 한다.
- 문제 정보 입력과 현장 확인 항목이 한 흐름으로 연결되어야 한다.

완료 조건:
- 긴급 점검 선택 시 문제 항목 점검 UI 진입
- 문제 분야/항목/위치/증상 입력 가능
- 현장 확인 항목 저장 가능
- 작업 종료 후 docs/progress.md 갱신
```

---

# 16. F05 - AI 점검 도우미 및 최종 의견

```md
이번 세션은 F05 AI 점검 도우미와 최종 의견 작성 UI를 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- F03/F04 점검 입력 UI와 B06 AI API 상태를 확인한다.

목표:
- POST /api/ai/inspection-guide를 호출한다.
- AI 응답 JSON을 행동형 카드 UI로 표시한다.
- opinionDraft를 시공업자 최종 의견 입력란에 적용할 수 있게 한다.
- 최종 의견은 시공업자가 수정 가능해야 한다.
- AI 호출 실패 시에도 수동 작성 가능해야 한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
3. docs/design/DESIGN.md
4. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html

참조 와이어프레임:
- AI 행동 가이드
- 전문 의견 작성

AI 응답 필드:
- summary
- actionCards
- requiredDocuments
- cautionPhrases
- opinionDraft

UI 기준:
- summary는 요약 카드
- actionCards는 촬영/확인/참고 버튼 카드
- requiredDocuments는 태그 또는 체크리스트
- cautionPhrases는 주의 안내 카드
- opinionDraft는 초안 적용 버튼 제공

주의:
- AI 결과를 긴 문단만으로 표시하지 않는다.
- 법적 판단처럼 보이는 라벨을 사용하지 않는다.
- 리포트에는 AI 초안이 아니라 시공업자 최종 의견만 들어간다.

완료 조건:
- AI JSON 응답 카드 표시
- 초안 적용 가능
- 최종 의견 수정 가능
- AI 실패 시 수동 작성 가능
- 작업 종료 후 docs/progress.md 갱신
```

---

# 17. F06 - 이미지 첨부

```md
이번 세션은 F06 이미지 첨부 UI를 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- F03/F04/F05 입력 흐름과 연결 위치를 확인한다.

목표:
- 이미지 파일을 선택하고 Base64로 변환한다.
- 1장 10MB 제한을 검증한다.
- 항목당 최대 5장 제한을 적용한다.
- 리포트 전체 최대 20장 제한을 고려한다.
- 이미지 미리보기, 사진 유형, 사진 설명을 입력할 수 있게 한다.
- 저장 API와 연결한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
3. docs/design/DESIGN.md
4. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html

정책:
- 이미지 1장 최대 10MB
- 항목당 최대 5장
- 리포트 전체 최대 20장
- AI 이미지 판독 없음

사진 유형:
- 전체 위치
- 근접
- 크기 기준
- 전후 사진
- 임시 조치 전
- 임시 조치 후

주의:
- Base64 변환 후 API로 전송한다.
- 이미지 업로드 UI는 와이어프레임처럼 슬롯/추가 버튼 형태를 참고한다.
- 용량 초과 시 명확한 오류 메시지를 보여준다.

완료 조건:
- 이미지 선택 및 미리보기 가능
- Base64 저장 API 연동 가능
- 제한 초과 시 오류 처리
- 작업 종료 후 docs/progress.md 갱신
```

---

# 18. F07 - 임대인/임차인 리포트 목록 및 상세

```md
이번 세션은 F07 임대인/임차인 리포트 목록 및 상세 화면을 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- F02 사용자 선택 구조와 B07 리포트 API 상태를 확인한다.

목표:
- 임대인 리포트 목록과 상세 화면을 구현한다.
- 임차인 본인 호실 리포트 목록과 상세 화면을 구현한다.
- 확인 완료 기능을 연결한다.
- PDF 저장 버튼과 공유 링크 생성 버튼을 제공한다.
- 임차인 의견 작성 기능은 구현하지 않는다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
3. docs/design/DESIGN.md
4. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html

참조 와이어프레임:
- 임대인 통합 리포트 목록
- 임대인 리포트 상세
- 임차인 내 호실 리포트 목록
- 임차인 리포트 상세

구현 API:
- GET /api/reports
- GET /api/reports/:id
- POST /api/reports/:id/confirm
- POST /api/reports/:id/share

주의:
- 생성 완료 리포트에는 수정/삭제 UI를 표시하지 않는다.
- 임차인은 본인 호실 리포트만 볼 수 있어야 한다.
- 임차인 의견 남기기 UI는 만들지 않는다.
- 공유 링크는 임대인/임차인 모두 생성 가능하다.

완료 조건:
- 임대인/임차인 역할별 리포트 목록 표시
- 리포트 상세 표시
- 확인 완료 가능
- 공유 링크 생성 가능
- 작업 종료 후 docs/progress.md 갱신
```

---

# 19. F08 - 리포트 비교, 공유 링크, PDF

```md
이번 세션은 F08 리포트 비교, 공유 링크 접근, PDF 출력 화면을 구현해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- F07 리포트 목록/상세와 B08 비교 API 상태를 확인한다.

목표:
- 리포트 비교 화면을 구현한다.
- 공유 링크 접근 화면을 구현한다.
- 인쇄용 리포트 템플릿을 구현한다.
- window.print() 기반 PDF 저장을 구현한다.

반드시 참고할 문서:
1. docs/progress.md
2. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
3. docs/design/DESIGN.md
4. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html

참조 와이어프레임:
- 임대인 리포트 비교
- 공유 링크 접근
- 리포트 표지
- 점검 요약
- 사진 증빙
- 확인 및 이력 정보

비교 조건:
- 같은 호실
- 같은 점검 유형
- 정확히 2개
- 수리 전/후 예외 허용
- 자동 판단 없음

구현 API:
- GET /api/reports/compare?leftId=1&rightId=2
- GET /api/share/:token

PDF:
- HTML 리포트 템플릿
- @media print
- window.print()
- 버튼/내비게이션/입력폼 제외

주의:
- 공유 링크 접근자는 확인 완료, 수정, 삭제를 할 수 없다.
- 공유 링크 화면에서 임대인/임차인 이름은 마스킹하지 않는다.
- PDF는 서버 생성이 아니라 브라우저 인쇄 방식이다.

완료 조건:
- 비교 조건 불일치 시 오류 표시
- 공유 링크로 리포트 조회 가능
- 인쇄하기 버튼 클릭 시 브라우저 인쇄창 호출
- 출력 화면은 리포트 양식 구조를 따른다
- 작업 종료 후 docs/progress.md 갱신
```

---

# 20. F-VERIFY - Playwright MCP 프론트엔드 전체 검증

```md
이번 세션은 F-VERIFY 프론트엔드 Playwright MCP 전체 검증 세션이야.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- F01~F08 완료 여부와 보류 이슈를 확인한다.

목표:
- Playwright MCP를 사용해 프론트엔드 화면이 실제 브라우저에서 정상 동작하는지 검증한다.
- 와이어프레임, DESIGN.md, 프론트엔드 PRD 기준으로 UI 구조와 스타일이 맞는지 확인한다.
- 콘솔 오류, 네트워크 오류, 라우팅 오류, 버튼 동작 오류, 반응형 깨짐을 확인한다.
- 작은 오류는 수정하고, 큰 구조 변경이 필요한 사항은 이슈로 기록한다.

반드시 확인할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
4. docs/design/DESIGN.md
5. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html
6. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md
7. docs/harness/OMC_검증프롬프트_및_progress운영규칙.md

실행 전 준비:
```bash
cd backend
npm install
npm run dev
```

다른 터미널:
```bash
cd frontend
npm install
npm run dev
```

기본 URL:
```text
frontend: http://localhost:5173
backend: http://localhost:3000
```

Playwright MCP로 검증할 화면:
1. `/` 데모 사용자 선택
2. `/contractor` 시공업자 홈
3. `/contractor/inspections/new` 새 점검 시작
4. 점검 목적 선택 화면
5. 점검 대상 입력 화면
6. 전체 점검 화면
7. 문제 항목 점검 화면
8. AI 점검 도우미 화면
9. 사진 첨부 UI
10. 전문 의견 작성 UI
11. 점검 제출 후 리포트 상세
12. `/owner/reports`
13. `/owner/reports/:id`
14. `/tenant/reports`
15. `/tenant/reports/:id`
16. `/share/:token`
17. 리포트 비교 화면
18. `/reports/:id/print`

디자인 검증 기준:
- Primary CTA는 #3E6AE1 사용
- 기본 배경은 #FFFFFF 사용
- 보조 배경은 #F4F4F4 사용
- 주요 텍스트는 #171A20 사용
- 본문 텍스트는 #393C41 사용
- 보조 텍스트는 #5C5E62 사용
- 과한 shadow, gradient, pill 버튼 남용 금지
- 와이어프레임의 모바일 우선 카드형 흐름 유지
- 실제 앱 UI에 휴대폰 외곽 프레임 구현 금지
- AI 점검 도우미는 행동형 카드로 표시
- 생성 완료 리포트에 수정/삭제 버튼 표시 금지
- 공유 링크 화면에서 확인 완료/수정/삭제 기능 표시 금지
- 임차인 의견 작성 UI 표시 금지

반응형 검증 viewport:
- Mobile: 390x844
- Tablet: 768x1024
- Desktop: 1440x900

수정 가능 범위:
- Tailwind class 오류
- 버튼 색상/간격/텍스트 오류
- 라우팅 누락
- 컴포넌트 import 오류
- 콘솔 오류
- API client 경로 오류
- 조건부 렌더링 오류
- print CSS 누락
- 모바일 레이아웃 깨짐

수정 금지 또는 보류:
- 전체 화면 플로우 재설계
- API 계약 대규모 변경
- 백엔드 DB 구조 변경
- 기능 요구사항 변경
- 임차인 의견 작성 기능 추가
- 생성 완료 리포트 수정/삭제 기능 추가
- 서버 PDF 생성 방식 도입

작업 종료 후:
- `docs/progress.md`에서 F-VERIFY 상태를 갱신한다.
- 방문 URL, viewport별 결과, 콘솔 오류, 네트워크 오류, 디자인 기준 통과/미통과 항목을 기록한다.
- 남은 이슈와 다음 권장 세션을 갱신한다.

최종 판정:
- 통과
- 부분 통과
- 보류
- 실패
```

---

# 21. I01 - 프론트/백엔드 통합 검증

```md
이번 세션은 I01 프론트/백엔드 통합 검증을 진행해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- B-VERIFY와 F-VERIFY 결과를 확인한다.

목표:
- 프론트엔드와 백엔드 API 연결을 전체적으로 검증한다.
- 주요 시나리오가 끊기지 않고 동작하는지 확인한다.
- API 응답 구조와 프론트 사용 구조가 맞지 않는 부분을 수정한다.

검증 시나리오:
1. 데모 사용자 선택
2. 시공업자 홈 진입
3. 새 점검 생성
4. 입주 전 점검 작성
5. 전체 점검 저장
6. AI 점검 도우미 호출
7. 이미지 첨부
8. 최종 의견 작성
9. 점검 제출
10. 리포트 자동 생성
11. 임대인 리포트 목록 확인
12. 임차인 리포트 목록 확인
13. 확인 완료
14. 공유 링크 생성
15. 공유 링크 접근
16. PDF 인쇄창 호출
17. 리포트 비교

주의:
- 새로운 기능을 추가하지 말고 통합 오류 수정에 집중한다.
- API 계약이 변경되면 백엔드/프론트 문서도 함께 수정한다.
- 임시 우회 처리한 부분은 반드시 기록한다.

완료 조건:
- 주요 시나리오 1회 이상 성공
- 실패 항목과 수정 항목 기록
- 남은 이슈 목록 작성
- 작업 종료 후 docs/progress.md 갱신
```

---

# 22. I02 - 발표 시연 데이터 및 UX 보정

```md
이번 세션은 I02 발표 시연 데이터 및 UX 보정을 진행해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- I01 통합 검증 결과와 남은 이슈를 확인한다.

목표:
- 발표 시연에 필요한 seed 데이터를 보정한다.
- 시연 흐름이 자연스럽게 보이도록 화면 문구와 빈 상태를 정리한다.
- 버튼명, 안내 문구, 오류 메시지를 발표용으로 다듬는다.

발표 시연 플로우:
1. 이시공 선택
2. 새 점검 시작
3. 입주 전 점검 선택
4. 노원 ○○아파트 1203호 선택
5. 공간별 전체 점검 작성
6. 거실 창호 주의 선택
7. AI 점검 도우미 호출
8. 사진 첨부
9. 최종 의견 작성
10. 점검 제출
11. 리포트 자동 생성
12. 김임대 선택 후 리포트 확인
13. 공유 링크 생성
14. 박임차 선택 후 리포트 확인
15. 리포트 비교
16. PDF 저장 버튼 시연

주의:
- 구조적 대수정은 하지 않는다.
- 시연에 방해되는 오류나 UX 혼란만 보정한다.
- seed 데이터는 비교 시연이 가능하도록 유지한다.

완료 조건:
- 발표 시연 플로우가 1회 이상 성공
- 발표자가 설명하기 쉬운 화면 문구로 정리
- 남은 위험 요소 기록
- 작업 종료 후 docs/progress.md 갱신
```

---

# 23. I03 - 최종 README 및 제출 정리

```md
이번 세션은 I03 최종 README 및 제출 정리를 진행해줘.

작업 시작 전:
- 반드시 `docs/progress.md`를 먼저 확인한다.
- I02 시연 보정 결과와 남은 이슈를 확인한다.

목표:
- 프로젝트 실행 방법을 README에 정리한다.
- 프론트/백엔드 실행 명령을 정리한다.
- DB 초기화 방법을 정리한다.
- .env.example을 점검한다.
- 발표 시연 순서를 문서화한다.
- 제외 기능과 한계점을 명확히 정리한다.

README에 포함할 내용:
1. 프로젝트 소개
2. 기술 스택
3. 폴더 구조
4. 설치 방법
5. 환경변수 설정
6. DB 초기화 방법
7. 백엔드 실행 방법
8. 프론트엔드 실행 방법
9. 발표 시연 순서
10. 주요 기능
11. 제외 기능
12. 알려진 한계
13. 문제 발생 시 확인 방법

주의:
- 실제 API Key는 README에 쓰지 않는다.
- .env는 Git에 포함하지 않는다.
- 발표용 데모라는 점과 법적 판단 서비스가 아니라는 점을 명시한다.

완료 조건:
- 신규 사용자가 README만 보고 실행 가능
- 발표 시연 순서가 명확함
- 제외 기능과 한계가 숨겨지지 않음
- 작업 종료 후 docs/progress.md 갱신
```

---

# 24. 추천 실행 순서 요약

```text
S00
→ B01
→ B02
→ B03
→ B04
→ B05
→ B06
→ B07
→ B08
→ B-VERIFY
→ F01
→ F02
→ F03
→ F04
→ F05
→ F06
→ F07
→ F08
→ F-VERIFY
→ I01
→ I02
→ I03
```

---

# 25. progress.md 갱신 규칙

각 세션이 끝나면 별도 session-logs 파일을 만들지 않고 `docs/progress.md`를 갱신한다.

```md
작업 종료 후 반드시 `docs/progress.md`를 갱신해줘.

갱신해야 할 내용:
1. 전체 진행 현황 표의 이번 세션 상태
2. 세션 기록 요약 표
3. 상세 세션 기록
4. 수정/생성한 파일
5. 실행한 명령어
6. 검증 결과
7. 실패/보류/TODO
8. 다음 세션에서 이어받을 내용
9. API/DB/UI 계약 변경 여부
10. 다음 권장 세션

주의:
- 기존 기록을 삭제하지 않는다.
- 실패나 보류 사항을 숨기지 않는다.
- 다음 세션이 바로 이어서 작업할 수 있도록 구체적으로 작성한다.
```
