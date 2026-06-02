# 스마트 점검 리포트 (Smart Inspection Report)

임대 주택의 시설 상태를 **시공업자**가 점검하고, 그 결과를 **임대인·임차인**이 리포트로 공유·확인할 수 있게 해 주는 **발표용 데모 웹 서비스**입니다.

> ⚠️ **이 서비스는 발표/시연용 데모이며, 법적 판단 서비스가 아닙니다.**
> 임차인/임대인 책임 확정, 고의·과실 판단, 보증금 공제 산정, 소송 유불리 등 어떤 법적 판단도 제공하지 않습니다. AI는 이미지를 직접 판독하지 않으며, 점검 기록을 돕는 보조 도구로만 동작합니다.

---

## 1. 프로젝트 소개

- **목적**: 입주 전/정기/긴급/수리 전후 등 다양한 점검을 작성하고, 제출 시점의 데이터를 **불변 스냅샷 리포트**로 고정해 임대인·임차인과 공유합니다.
- **핵심 개념**
  - **Inspection(점검)**: 작성/제출 중인 데이터. 상태 머신 `draft → submitted → reported`.
  - **Report(리포트)**: 제출 시점에 고정된 **스냅샷**. 생성 후에는 수정·삭제 불가(필요 시 새 리포트 생성).
  - **등급(A~E)은 규칙 기반**으로 산출(AI가 정하지 않음). 소방·안전 분야의 `수리 필요`/`긴급 조치 필요`는 자동 E등급.
- **데모 인증**: 별도 로그인 없이 화면에서 데모 사용자를 선택해 역할(시공업자/임대인/임차인)을 전환합니다.

---

## 2. 기술 스택

| 영역 | 기술 |
|---|---|
| 구조 | 모노레포 (`frontend/`, `backend/`, `docs/`) |
| 프론트엔드 | Vue 3 + Vite + Tailwind CSS + Vue Router |
| 백엔드 | Node.js + Express 5 |
| DB | SQLite + better-sqlite3 |
| AI | OpenAI GPT API (백엔드에서만 호출, JSON 강제, 실패 시 graceful fallback) |
| 이미지 | Base64 문자열로 SQLite 저장 |
| PDF | HTML 템플릿 + 브라우저 `window.print()` (서버 PDF 생성 없음) |
| 인증 | 없음 — `localStorage`의 `selectedUserId` / `selectedRole`로 데모 사용자 구분 |

요구 환경: **Node.js 20+ 권장**(better-sqlite3 빌드 호환), npm.

---

## 3. 폴더 구조

```
smart-inspection-report/
├── package.json            # 루트 실행 스크립트 (install:all / db:reset / dev:backend / dev:frontend)
├── frontend/               # Vue 3 + Vite + Tailwind
│   ├── src/
│   │   ├── views/          # 화면 (Home, ContractorHome, NewInspection, inspection/*, reports/*, ShareView ...)
│   │   ├── components/ui/  # 공통 컴포넌트 (AppLayout, SelectCard, ToastHost, ConfirmDialog ...)
│   │   ├── components/inspection/  # ReportDocument, AiOpinionPanel, PhotoManager ...
│   │   ├── router/         # Vue Router 라우트 정의
│   │   ├── api/            # API client (VITE_API_BASE_URL + X-User-Id 헤더)
│   │   ├── lib/            # session(localStorage), toast
│   │   └── constants/      # 점검 유형/공간/분야/사진 유형
│   └── .env.example        # VITE_API_BASE_URL
├── backend/                # Node.js + Express
│   ├── src/
│   │   ├── app.js          # Express 부트스트랩 (CORS, body limit, 에러 핸들러, dotenv)
│   │   ├── routes/         # /api/* 라우터
│   │   ├── services/       # 등급 산출, 스냅샷 생성, AI 호출
│   │   ├── db/             # better-sqlite3 연결, schema.sql, init/seed, repositories
│   │   └── middleware/     # requireUser (X-User-Id 기반 데모 권한)
│   ├── prompts/            # AI 시스템 프롬프트 2종 (inspection-guide, opinion-draft)
│   ├── database/           # smart-inspection.sqlite (gitignore 대상)
│   └── .env.example        # OPENAI_API_KEY / OPENAI_MODEL / PORT
└── docs/                   # PRD, 기능명세, 디자인 가이드, 와이어프레임, progress.md
```

---

## 4. 설치 방법

저장소 루트에서 한 번에 설치합니다.

```bash
npm run install:all
```

> 위 명령은 루트 / `backend` / `frontend`의 의존성을 순서대로 설치합니다.
> 개별 설치가 필요하면 `npm --prefix backend install`, `npm --prefix frontend install`를 사용하세요.

---

## 5. 환경변수 설정

`.env` 파일은 **Git에 포함하지 않습니다**(루트 `.gitignore`가 `.env`를 무시). 각 폴더의 `.env.example`을 복사해 사용하세요. **실제 API Key는 문서/저장소에 절대 커밋하지 마세요.**

### 5.1 backend/.env

```bash
# backend/.env.example → backend/.env 로 복사 후 값 입력
OPENAI_API_KEY=        # 본인 OpenAI 키 (없어도 실행은 됨 — AI는 fallback 동작)
OPENAI_MODEL=gpt-4o-mini
PORT=3000
```

- `OPENAI_API_KEY`는 **백엔드에서만** 사용하며 프론트엔드에 노출되지 않습니다.
- 키가 비어 있어도 서버는 정상 기동하며, AI 점검 도우미는 **기본 안내 카드(fallback)**로 대체됩니다(점검 제출은 막히지 않음).

### 5.2 frontend/.env

```bash
# frontend/.env.example → frontend/.env 로 복사
VITE_API_BASE_URL=http://localhost:3000/api
```

> `VITE_API_BASE_URL`은 끝에 `/api`까지 포함합니다(예: `http://localhost:3000/api`). 백엔드 포트를 바꾸면 이 값도 함께 변경하세요.

---

## 6. DB 초기화 방법

SQLite 파일(`backend/database/smart-inspection.sqlite`)을 초기화하고 데모 seed 데이터를 채웁니다.

```bash
# 루트에서 (권장) — 테이블 재생성 + seed
npm run db:reset
```

또는 backend 폴더 기준 개별 스크립트:

```bash
npm --prefix backend run db:init        # 스키마만 생성(기존 유지)
npm --prefix backend run db:init:force  # 전체 DROP 후 재생성
npm --prefix backend run db:seed        # 데모 seed 데이터 삽입
npm --prefix backend run db:reset       # init:force + seed (전체 초기화)
```

> 📌 **발표/시연 직전에는 `npm run db:reset`을 권장합니다.** 깨끗한 seed(비교 가능한 입주 전 점검 2건 포함)로 시작하고, 시연 중 생성된 리포트 누적으로 비교 드롭다운이 길어지는 것을 방지합니다.

seed에는 데모 사용자 3명, 건물 2동, 호실 3개(1203호/201호/703호), 비교용 리포트 등이 포함됩니다.

---

## 7. 백엔드 실행 방법

```bash
npm run dev:backend      # http://localhost:3000  (node --watch 자동 재시작)
```

헬스 체크:

```bash
curl http://localhost:3000/api/health
# {"ok":true,"data":{"service":"smart-inspection-backend","time":"..."}}
```

운영(비-watch) 실행은 `npm run start:backend`.

---

## 8. 프론트엔드 실행 방법

백엔드를 먼저 띄운 뒤, **다른 터미널**에서:

```bash
npm run dev:frontend     # http://localhost:5173
```

브라우저에서 `http://localhost:5173` 접속.

> 빠른 1회 기동 순서:
> ```bash
> npm run install:all
> npm run db:reset
> npm run dev:backend     # 터미널 A
> npm run dev:frontend    # 터미널 B
> ```

---

## 9. 발표 시연 순서

> 시연 전 `npm run db:reset` 권장. 인터넷/`OPENAI_API_KEY`가 있으면 AI 도우미가 실제 GPT 결과를, 없으면 기본 안내 카드를 표시합니다(어느 경우든 시연은 끊기지 않음).

1. `/` 에서 **이시공(시공업자)** 카드 선택 → 시공업자 홈으로 이동
2. **+ 새 점검 시작** 클릭
3. **입주 전 점검** 선택 → 다음
4. **노원 햇살아파트 1203호** 선택 → 점검 시작
5. 공간별 전체 점검 작성(기본은 모두 정상)
6. **거실 · 창호**를 `주의`로 변경 → 이상 항목 단계에서 위치·설명 입력
7. 검토 단계 확인 → **AI 점검 도우미 실행**(행동형 카드)
8. **사진 첨부**(선택)
9. **시공업자 최종 의견** 작성(원하면 AI 초안 적용 후 수정)
10. **점검 제출** → 자동으로 시공업자 홈(`/contractor`)으로 이동하고 **"정상적으로 제출되었습니다" 토스트** 표시(리포트 자동 생성, 등급 산출)
11. `/` 로 가서 **김임대(임대인)** 선택 → 리포트 목록·상세 확인
12. 리포트 상세에서 **확인 완료** / **공유 링크 생성**
13. 공유 링크(`/share/:token`) 무인증 공개 조회 시연(조회·PDF만 가능)
14. `/` 로 가서 **박임차(임차인)** 선택 → 본인 호실 리포트 확인
15. 임대인으로 **리포트 비교**(같은 호실·같은 점검 유형 2개; 드롭다운에 `#리포트id` 표기로 구분)
16. 리포트 상세/인쇄 화면에서 **인쇄 / PDF 저장** 버튼 → 브라우저 인쇄창

> 임시 저장 시연: 점검 작성 중 **임시 저장**을 누르면 홈으로 이동하며 "임시 저장되었습니다" 토스트가 뜨고, **작성 중 점검** 목록에 표시됩니다. 카드를 다시 클릭하면 이어서 작성할 수 있습니다.

---

## 10. 주요 기능

- **점검 작성 2종 흐름**
  - `whole`(입주 전/정기): 8개 공간 32항목 빠른 3상태 체크(정상/주의/수리 필요) + 이상 항목 위치·설명.
  - `issue`(퇴거 전후/긴급/수리 전후): 분야→문제 항목→상태→위치→증상 + 현장 확인 항목. 위치(2자↑)·증상(5자↑) 필수 검증.
- **AI 점검 도우미**: 점검 내용을 바탕으로 요약·행동 가이드 카드·확인 자료·주의 표현·의견 초안을 JSON으로 생성(금지 표현 자동 중립화). 실패 시 fallback.
- **사진 첨부**: 파일 → Base64 변환, 유형/설명, 1장 10MB·전체 20장 제한.
- **규칙 기반 등급(A~E)** + 소방·안전 자동 E등급.
- **제출 → 리포트 자동 생성** + 제출 시점 **불변 스냅샷** 저장.
- **리포트 확인 완료**(임대인/임차인 독립·멱등), **공유 링크**(만료/비밀번호/마스킹 없음, 조회·PDF만), **리포트 비교**(같은 호실+유형, 수리 전↔후 예외).
- **인쇄/PDF 저장**: `window.print()` 기반.
- **임시 저장 / 이어서 작성**: draft로 저장 후 홈에서 재개.
- **데모 사용자/역할 기반 접근 제어**(백엔드가 `unit_users`로 권한 확인, 권한 없으면 403).

### 데모 사용자

| 사용자 | 역할 | 접근 범위 |
|---|---|---|
| 이시공 | 시공업자(contractor) | 본인이 작성한 Inspection |
| 김임대 | 임대인(owner) | 본인 소유 호실의 Report |
| 박임차 | 임차인(tenant) | 본인 거주 호실의 Report |

---

## 11. 제외 기능 (1차 범위 밖 — 의도적으로 미구현)

- 로그인 / 회원가입 (실제 인증)
- 임차인 의견 작성 기능
- AI의 **이미지 직접 판독**
- **서버 기반 PDF 생성** (브라우저 인쇄로 대체)
- 보증금 공제 / 법률 책임 판단 / 과실 확정

---

## 12. 알려진 한계

- **발표용 데모**입니다. 운영 환경용 인증·보안·확장성은 범위 밖입니다.
- **인증 없음**: 사용자 구분은 `localStorage` + 요청 헤더(`X-User-Id`) 기반의 데모 방식입니다. 실제 신뢰 경계가 아닙니다.
- **AI는 OpenAI API에 의존**: 키/네트워크가 없으면 기본 안내 카드(fallback)로 동작합니다(시연 비차단).
- **전체 점검 작성 중 페이지 새로고침 시 미저장분 유실**: 작성 내용은 제출/임시 저장 시점에만 서버에 저장됩니다. 작성 도중 새로고침하면 마지막 저장 상태로 되돌아갑니다. → 작성 중 새로고침 금지, 필요 시 **임시 저장** 사용.
- **리포트 비교 PDF의 좌우 2열 인쇄는 best-effort**: 화면은 좌우로 표시되고 인쇄 시에도 2열 규칙을 적용하지만, 두 리포트 전체(사진 포함)를 좁은 용지 한 페이지에 좌우로 완벽히 담는 것은 보장하지 않습니다.
- **일부 seed 리포트의 사진/공간명**: 초기 seed 스냅샷 일부는 이미지 base64가 비어 있거나 공간명이 영문 키일 수 있습니다(프론트에서 방어 처리하여 표시는 정상). 직접 작성한 리포트에는 영향 없음.
- **경로/플랫폼**: Windows + 한글 폴더 경로에서 개발/검증되었습니다. better-sqlite3는 Node 버전에 따라 네이티브 재빌드가 필요할 수 있습니다.

---

## 13. 문제 발생 시 확인 방법

| 증상 | 확인 / 조치 |
|---|---|
| 화면이 데이터 없이 비어 보임 | 백엔드가 떠 있는지(`curl http://localhost:3000/api/health`), `frontend/.env`의 `VITE_API_BASE_URL`이 `http://localhost:3000/api`인지 확인 |
| 포트 충돌(3000/5173 already in use) | 기존 프로세스 종료 후 재시작. 포트를 바꾸면 `backend/.env`의 `PORT`와 `frontend/.env`의 `VITE_API_BASE_URL`을 함께 변경 |
| 데이터가 꼬이거나 비교 드롭다운이 길어짐 | `npm run db:reset`으로 깨끗한 seed로 초기화 |
| AI 도우미가 기본 안내 카드만 표시 | `backend/.env`의 `OPENAI_API_KEY` 설정 여부·네트워크 확인(키 없으면 의도된 fallback) |
| 시공업자 홈 콘솔에 일부 404/네트워크 로그 | 정상 동작 범위(없는 데이터에 대한 graceful 처리). 화면 동작에는 영향 없음 |
| 점검 작성 내용이 사라짐 | 작성 중 새로고침을 했는지 확인. 저장은 **임시 저장/제출** 시점에만 이루어짐 |
| better-sqlite3 설치/로드 오류 | Node LTS(20+)에서 `npm --prefix backend install` 재실행(네이티브 모듈 재빌드) |
| 토스트/팝업이 안 뜸(개발 중) | dev 서버 장시간 사용 시 HMR 캐시 영향일 수 있음 → Vite dev 서버 재시작(프로덕션 빌드/정상 로드에서는 정상) |

추가로, 진행 이력·세션별 검증 결과·남은 이슈는 `docs/progress.md`에서 확인할 수 있습니다.

---

> 본 구현은 캡스톤 발표용 데모입니다. 법적 판단, 임차인·임대인 책임 확정, 보증금 공제 산정, 소송 유불리 등은 제공하지 않습니다.
