# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 현재 저장소 상태

이 저장소는 **스마트 점검 리포트** 프로젝트의 사전 기획/명세 단계입니다. 실제 코드(`frontend/`, `backend/`)는 아직 생성되지 않았고, `docs/`에 PRD·기능명세서·하네스 프롬프트·디자인 가이드·와이어프레임만 존재합니다. 첫 구현 세션은 항상 `S00 공통 부트스트랩`이어야 합니다.

## 모든 세션의 필수 워크플로우

이 프로젝트는 OMC / Claude Code의 **세션 분할 개발 방식**으로 진행됩니다. 어떤 작업이든 다음 절차를 따릅니다.

1. **세션 시작 전:** `docs/progress.md`를 먼저 읽어 완료 세션, 보류 이슈, 다음 인수인계 내용을 확인한다.
2. **현재 세션의 범위만** 구현한다(다른 세션 영역으로 침범 금지).
3. **세션 종료 후:** `docs/progress.md`를 갱신한다(기존 기록 삭제 금지, 실패/보류 숨김 금지).

세션별 실행 프롬프트의 원본은 `OMC_단계별_실행명령어_스마트점검리포트_v3_progress검증반영.md`(루트)에 있습니다. 세션 운영 규칙은 `docs/harness/OMC_검증프롬프트_및_progress운영규칙.md`를 참고하세요.

## 세션 실행 순서 (고정)

```
S00 → B01 → B02 → B03 → B04 → B05 → B06 → B07 → B08 → B-VERIFY
    → F01 → F02 → F03 → F04 → F05 → F06 → F07 → F08 → F-VERIFY
    → I01 → I02 → I03
```

- B 세션은 백엔드, F 세션은 프론트엔드입니다. **B-VERIFY 통과 전에는 F01을 시작하지 않습니다.**
- 세션 기록은 별도 로그 파일로 나누지 않고 `docs/progress.md` **하나에 누적**합니다.

## 확정 기술 스택 (변경 금지)

| 영역 | 기술 |
|---|---|
| 구조 | 모노레포 (`frontend/`, `backend/`, `docs/`) |
| 프론트엔드 | Vue 3 + Vite + Tailwind CSS + Vue Router |
| 백엔드 | Node.js + Express |
| DB | SQLite + better-sqlite3 |
| AI | GPT API (백엔드에서만 호출) |
| AI 응답 | JSON 강제 |
| 이미지 | Base64 문자열로 SQLite에 저장 |
| PDF | HTML 템플릿 + `window.print()` (서버 생성 금지) |
| 인증 | 없음 — `localStorage`의 `selectedUserId` / `selectedRole`로 데모 사용자 구분 |

Express는 Base64 이미지 페이로드를 받기 위해 `express.json` body limit을 충분히 크게 설정하되, 이미지 1장 10MB / 항목당 5장 / 리포트 전체 20장 제한은 별도 검증 로직으로 처리합니다.

## 도메인 핵심 정책

이 정책은 모든 세션에서 변경 없이 유지되어야 합니다. 위반 시 다른 세션의 구현이 깨집니다.

- **Inspection vs Report 분리.** Inspection은 작성/제출 중인 데이터, Report는 제출 시점에 고정된 스냅샷.
- **상태 머신:** `draft` → `submitted` → `reported`. `reported` 상태의 Inspection은 수정/삭제 불가, 수정이 필요하면 새 리포트 생성.
- **Report Snapshot.** 점검 제출 시 그 시점의 데이터를 JSON으로 `report_snapshots`에 저장. 이후 원본 Inspection이 바뀌어도 스냅샷은 불변.
- **등급 산출은 규칙 기반.** AI가 등급을 정하지 않습니다. 소방·안전 분야의 `수리 필요` 또는 `긴급 조치 필요`는 자동 E등급.
- **점검 흐름 자동 결정.** 입주 전/정기 = `whole`(공간별 전체 점검), 그 외(퇴거 전/후, 긴급, 수리 전/후) = `issue`(문제 항목 점검).
- **리포트 비교:** 같은 호실 + 같은 점검 유형 2개만 허용. **예외:** 수리 전 ↔ 수리 후 비교는 허용.
- **공유 링크:** 만료 없음, 비밀번호 없음, 이름 마스킹 없음. 접근자는 조회/PDF 저장만 가능(확인 완료/수정/삭제 불가).
- **AI 응답 금지 표현:** "임차인 책임", "임대인 책임", "고의", "과실 확정", "보증금 공제 가능", "소송에서 유리", "판례상 확정". AI는 이미지를 직접 판독하지 않음.
- **AI 실패는 점검 제출을 막지 않습니다** — graceful fallback으로 수동 작성이 가능해야 합니다.
- **1차 구현 제외:** 로그인/회원가입, 임차인 의견 작성, AI 이미지 판독, 서버 PDF 생성, 보증금/법률 판단.

## 데모 사용자 (Seed)

| 사용자 | 역할 | 접근 범위 |
|---|---|---|
| 이시공 | contractor | 본인이 작성한 Inspection |
| 김임대 | owner | 본인 소유 호실의 Report |
| 박임차 | tenant | 본인 거주 호실의 Report |

권한은 백엔드가 요청의 `userId`를 기준으로 DB(`unit_users`)에서 확인합니다. 권한 없는 접근은 403.

## 백엔드 구조 (B01 이후 생성될 모습)

```
backend/
├─ src/
│  ├─ app.js               # Express 부트스트랩, CORS, body limit, 공통 에러 핸들러
│  ├─ routes/              # /api/* 라우터
│  ├─ controllers/
│  ├─ services/            # 등급 산출, Snapshot 생성, AI 호출 등
│  ├─ db/                  # better-sqlite3 연결, schema, seed
│  └─ utils/               # response, errors
├─ prompts/
│  ├─ inspection-guide.system.md   # 행동 카드/요약/주의 표현 생성
│  └─ opinion-draft.system.md      # 시공업자 의견 초안 생성
├─ database/
│  └─ smart-inspection.sqlite
└─ .env                    # OPENAI_API_KEY (프론트엔드에 노출 금지)
```

AI 호출은 **한 번의 GPT 호출에서 두 시스템 프롬프트를 함께 사용**해 다음 JSON을 반환합니다.

```json
{ "summary": "", "actionCards": [], "requiredDocuments": [], "cautionPhrases": [], "opinionDraft": "" }
```

## 백엔드 DB 스키마 (B02에서 생성)

`users`, `buildings`, `units`, `unit_users`, `inspections`, `inspection_items`, `inspection_observations`, `inspection_images`, `ai_guides`, `reports`, `report_snapshots`, `report_confirmations`, `share_links`.

전체 관계는 `docs/prd/PRD_v1.0_스마트점검리포트.md` §20 참고. Inspection 계열과 Report 계열을 분리해 스냅샷의 불변성을 유지하는 것이 핵심입니다.

## 백엔드 API (PRD 계약)

| Method | Endpoint | 도입 세션 |
|---|---|---|
| GET | `/api/health` | B01 |
| GET | `/api/demo/users` | B03 |
| POST | `/api/session/select-user` | B03 |
| GET | `/api/units` | B03 |
| POST · GET · PATCH · DELETE | `/api/inspections[/:id]` | B04 |
| POST | `/api/inspections/:id/submit` | B05 (리포트 자동 생성) |
| POST | `/api/ai/inspection-guide` | B06 |
| GET | `/api/reports` · `/api/reports/:id` | B07 |
| POST | `/api/reports/:id/confirm` · `/api/reports/:id/share` | B07 |
| GET | `/api/share/:token` | B07 |
| GET | `/api/reports/compare?leftId=&rightId=` | B08 |

## 프론트엔드 구조 (F01 이후)

- 라우트: `/`, `/contractor`, `/contractor/inspections/new`, `/contractor/inspections/:id`, `/owner/reports[/:id]`, `/owner/compare`, `/tenant/reports[/:id]`, `/share/:token`, `/reports/:id/print`.
- API base URL은 `VITE_API_BASE_URL` 환경변수로 주입.
- `selectedUserId`, `selectedRole`은 `localStorage`에 저장하고 API 호출 시 함께 전달.

### 와이어프레임 / 디자인 규칙

프론트엔드는 반드시 `docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html`의 화면 흐름과 `docs/design/DESIGN.md`(Tesla 스타일 미니멀 가이드)를 함께 따릅니다.

- **휴대폰 외곽 프레임은 구현하지 않습니다.** 와이어프레임의 휴대폰 모형은 설명용이며 실제 앱은 일반 반응형 웹입니다.
- **컬러 팔레트(엄수):** Primary CTA `#3E6AE1`, 배경 `#FFFFFF`, 보조 배경 `#F4F4F4`, 주요 텍스트 `#171A20`, 본문 `#393C41`, 보조 텍스트 `#5C5E62`.
- 과한 shadow / gradient / pill 버튼 금지. 평면적 카드 + 여백 중심.
- **Universal Sans 폰트 파일은 실제로 포함하지 않습니다** — 시스템 폰트 폴백을 사용합니다.
- **AI 점검 도우미는 긴 문단이 아니라 행동형 카드 UI**로 표시해야 합니다.
- **생성 완료 리포트 화면에는 수정/삭제 버튼을 절대 표시하지 않습니다.**
- **공유 링크 화면(`/share/:token`)에는 확인 완료/수정/삭제 UI를 표시하지 않습니다.**
- **임차인에게 의견 작성 UI를 노출하지 않습니다** (1차 범위 제외).
- 리포트에는 AI 초안이 아닌 **시공업자가 수정한 최종 의견만** 포함합니다.

## 검증 세션 (B-VERIFY / F-VERIFY)

- **B-VERIFY:** 실제 서버 기동과 API 호출로 B01~B08의 27개 항목을 점검. 작은 오류만 수정하고, 큰 구조 변경은 보류 이슈로 기록. 최종 판정은 `통과 / 부분 통과 / 보류 / 실패` 중 하나.
- **F-VERIFY:** Playwright MCP로 18개 화면을 Mobile(390×844) / Tablet(768×1024) / Desktop(1440×900) 3개 viewport에서 검증. 콘솔/네트워크 오류, 라우팅, 인쇄 CSS, 디자인 기준 준수 여부 확인.
- 두 세션 모두에서 **수정 금지 범위:** DB 구조 대개편, API 계약 대규모 변경, 인증 시스템 추가, Base64 외 이미지 저장, 서버 PDF 생성, 1차 범위 제외 기능(임차인 의견, 완료 리포트 수정/삭제) 추가.

## 실행 명령 (각 세션에서 도입 후 사용)

```bash
# 백엔드 (B01 이후)
cd backend
npm install
npm run dev          # http://localhost:3000
# health check
curl http://localhost:3000/api/health

# 프론트엔드 (F01 이후)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

DB 초기화·seed 명령(예: `npm run db:init`)은 B02에서 정의되며, 실제 명령명은 그때 확정합니다. 정의된 후에는 README와 `docs/progress.md`에 반드시 기록됩니다.

## 문서 맵

| 문서 | 용도 |
|---|---|
| `docs/progress.md` | 단일 진행 기록 — 모든 세션이 읽고 갱신 |
| `OMC_단계별_실행명령어_스마트점검리포트_v3_progress검증반영.md`(루트) | 세션별 실행 프롬프트 원본 |
| `docs/prd/PRD_v1.0_스마트점검리포트.md` | 제품 요구사항 마스터 |
| `docs/prd/백엔드_PRD_세션별.md` | 백엔드 세션 명세 |
| `docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md` | 프론트엔드 세션 명세 |
| `docs/specs/요구사항분석서_v3.0_스마트점검리포트.md` | 요구사항 분석 |
| `docs/specs/기능명세서_v3.0_스마트점검리포트.md` | 기능 명세 |
| `docs/design/DESIGN.md` | 디자인 시스템 (Tesla 스타일) |
| `docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html` | 와이어프레임 — 화면 흐름 기준 |
| `docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md` | 개발 하네스 (DESIGN 반영판) |
| `docs/harness/OMC_검증프롬프트_및_progress운영규칙.md` | progress.md 운영 규칙 + B/F VERIFY 프롬프트 |
| `docs/harness/OMC_개발세션_분할계획.md` | 세션 분할 계획 |
