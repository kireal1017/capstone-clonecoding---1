# 스마트 점검 리포트 개발 문서

> 대상 프로젝트: 스마트 점검 리포트  
> 개발 방식: OMC + Claude Code 세션 분할 개발  
> 기술 스택: Vue 3 + Vite + Tailwind CSS / Node.js + Express / SQLite + better-sqlite3 / GPT API  
> 목적: 발표용 데모이지만 DB, API, AI, 리포트 생성, PDF, 공유 링크, 비교 기능까지 실제 동작하는 수준으로 구현

---

# 백엔드 PRD - 세션별 개발 문서

## 1. 백엔드 목표

Node.js + Express + SQLite + better-sqlite3 기반 API 서버를 구현한다.

백엔드는 점검 데이터 저장, 권한 검사, AI GPT API 호출, 이미지 Base64 저장, 리포트 스냅샷 생성, 공유 링크, 비교 기능을 담당한다.

---

## 2. 기술 기준

| 항목 | 내용 |
|---|---|
| Runtime | Node.js |
| Server | Express |
| DB | SQLite |
| SQLite Library | better-sqlite3 |
| AI | GPT API |
| Env | `.env` |
| Prompt | `backend/prompts/*.md` |
| Image | Base64 text 저장 |
| Auth | 로그인 없음, `userId` 기반 데모 권한 체크 |

---

## 3. B01 - Express 서버 기본 구조

### 목표

백엔드 기본 서버와 공통 구조를 만든다.

### 작업 범위

- `backend/` package 생성
- Express 서버 세팅
- CORS 설정
- JSON body limit 설정
- 공통 응답 포맷
- 공통 에러 핸들러
- health check API

### 주의

Base64 이미지가 포함될 수 있으므로 body size limit을 충분히 설정해야 한다.  
단, 이미지 1장 최대 10MB, 리포트 전체 최대 20장 제한은 별도 검증 로직으로 처리한다.

### 완료 기준

- `npm run dev` 실행 가능
- `GET /api/health` 정상 응답
- 프론트엔드에서 API 호출 가능

---

## 4. B02 - SQLite schema 및 seed 데이터

### 목표

DB 스키마와 seed 데이터를 구현한다.

### 주요 테이블

| 테이블 | 설명 |
|---|---|
| users | 데모 사용자 |
| buildings | 건물 |
| units | 호실 |
| unit_users | 호실-사용자 권한 연결 |
| inspections | 작성 중/제출 전 점검 |
| inspection_items | 전체 점검 또는 문제 항목 |
| inspection_observations | 현장 확인 항목 |
| inspection_images | Base64 이미지 |
| ai_guides | AI 가이드 결과 |
| reports | 생성 완료 리포트 메타 |
| report_snapshots | 리포트 고정 JSON |
| report_confirmations | 임대인/임차인 확인 이력 |
| share_links | 공유 링크 |

### Seed 데이터

| 데이터 | 수량 |
|---|---:|
| 시공업자 | 1 |
| 임대인 | 1 |
| 임차인 | 1 |
| 건물 | 2 |
| 호실 | 3 |
| 기존 리포트 | 2~3 |
| 작성 중 점검 | 1 |
| 제출 대기 점검 | 1 |

### 완료 기준

- DB 초기화 스크립트 실행 가능
- seed 데이터 생성 가능
- 사용자별 접근 가능한 호실 조회 가능

---

## 5. B03 - 데모 사용자와 권한 API

### 목표

데모 사용자 선택과 역할 기반 데이터 접근을 구현한다.

### API

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/demo/users` | 데모 사용자 목록 |
| POST | `/api/session/select-user` | 선택 사용자 확인 |
| GET | `/api/units` | 사용자 접근 가능 호실 |

### 권한 규칙

| 역할 | 권한 |
|---|---|
| contractor | 본인이 작성한 inspection 수정/삭제 |
| owner | 본인 소유 호실 report 조회 |
| tenant | 본인 거주 호실 report 조회 |

### 완료 기준

- userId에 따라 다른 호실 목록 반환
- 권한 없는 리포트 접근 시 403 반환

---

## 6. B04 - Inspection CRUD

### 목표

시공업자의 점검 생성, 조회, 수정, 삭제 기능을 구현한다.

### API

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/inspections` | 점검 생성 |
| GET | `/api/inspections/:id` | 점검 상세 |
| PATCH | `/api/inspections/:id` | 점검 수정 |
| DELETE | `/api/inspections/:id` | 점검 삭제 |

### 상태

| 상태 | 설명 |
|---|---|
| draft | 작성 중 |
| submitted | 제출 완료 |
| reported | 리포트 생성 완료 |

### 규칙

- draft/submitted 상태는 시공업자가 수정/삭제 가능
- reported 상태는 수정/삭제 불가
- 점검 유형에 따라 `inspectionFlow` 자동 결정
- 입주 전/정기: whole
- 퇴거 전/퇴거 후/긴급/수리 전/수리 후: issue

### 완료 기준

- 전체 점검과 문제 항목 점검 모두 저장 가능
- reported 상태 수정/삭제 시 400 또는 403 반환

---

## 7. B05 - 등급 산출 및 Report Snapshot 생성

### 목표

점검 제출 시 리포트를 자동 생성한다.

### API

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/inspections/:id/submit` | 점검 제출 및 리포트 자동 생성 |

### 처리 흐름

```text
검증
→ 등급 산출
→ inspections.status = reported
→ reports 생성
→ report_snapshots에 JSON 저장
→ 임대인/임차인 접근 가능 상태
```

### 등급 규칙

전체 점검:

| 등급 | 조건 |
|---|---|
| A | 모든 항목 정상 |
| B | 주의 1~2개, 수리 필요 없음 |
| C | 주의 3개 이상 또는 수리 필요 1개 |
| D | 수리 필요 2개 이상 |
| E | 소방·안전 관련 수리 필요 또는 긴급 조치 필요 |

문제 항목 점검:

| 등급 | 조건 |
|---|---|
| B | 경미한 기록 필요 |
| C | 추가 확인 필요 |
| D | 수리 필요 |
| E | 긴급 조치 필요 또는 안전 위험 |

### Snapshot 포함 데이터

- 점검 기본 정보
- 건물/호실 정보
- 시공업자/임대인/임차인 정보
- 등급
- 점검 항목
- 현장 확인 항목
- 사진 Base64
- AI 가이드
- 최종 의견
- 주의 문구

### 완료 기준

- submit 호출 시 reportId 반환
- 생성된 report snapshot은 이후 inspection이 바뀌어도 변경되지 않음
- report 생성 후 inspection 수정/삭제 불가

---

## 8. B06 - AI GPT API 연동

### 목표

GPT API를 호출하여 AI 점검 도우미 JSON을 생성한다.

### API

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/ai/inspection-guide` | AI 점검 도우미 생성 |

### 프롬프트 파일

| 파일 | 역할 |
|---|---|
| `inspection-guide.system.md` | 사진 기준, 추가 확인 질문, 필요 자료, 표현 주의 생성 |
| `opinion-draft.system.md` | 시공업자 전문 의견 초안 생성 |

### 응답 JSON

```json
{
  "summary": "현재 점검 상황 요약",
  "actionCards": [],
  "requiredDocuments": [],
  "cautionPhrases": [],
  "opinionDraft": ""
}
```

### 안전 규칙

- 법적 책임 판단 금지
- 임차인/임대인 책임 단정 금지
- 보증금 공제 판단 금지
- 소송/판례 확정 표현 금지
- 이미지 판독 금지

### 실패 처리

AI 호출 실패 시 기본 템플릿 응답을 반환하거나 프론트엔드가 수동 입력 가능하도록 에러를 반환한다.  
AI 실패로 점검 제출을 막지 않는다.

### 완료 기준

- GPT API 정상 호출
- JSON parse 가능
- 금지 표현 최소 필터링
- ai_guides 테이블 저장 가능

---

## 9. B07 - Report 조회, 확인 완료, 공유 링크

### 목표

생성 완료 리포트의 조회, 확인 완료, 공유 링크 생성을 구현한다.

### API

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/reports` | 사용자 기준 리포트 목록 |
| GET | `/api/reports/:id` | 리포트 상세 |
| POST | `/api/reports/:id/confirm` | 임대인/임차인 확인 완료 |
| POST | `/api/reports/:id/share` | 공유 링크 생성 |
| GET | `/api/share/:token` | 공유 링크 리포트 조회 |

### 규칙

- 시공업자/임대인/임차인 모두 공유 링크 생성 가능
- 공유 링크 만료 없음
- 공유 링크 화면에서 이름 마스킹하지 않음
- 공유 링크 접근자는 확인 완료, 수정, 삭제 불가

### 완료 기준

- 역할별 리포트 목록 접근 제한
- 확인 완료 기록 저장
- 공유 token 생성 및 조회 가능

---

## 10. B08 - Report 비교 API

### 목표

같은 호실 + 같은 점검 유형 리포트 2개를 비교한다.

### API

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/reports/compare?leftId=1&rightId=2` | 리포트 비교 |

### 비교 조건

| 조건 | 정책 |
|---|---|
| 호실 | 같아야 함 |
| 점검 유형 | 같아야 함 |
| 개수 | 정확히 2개 |
| 예외 | 수리 전 ↔ 수리 후 비교 허용 |
| 자동 판단 | 없음 |

### 반환 데이터

- left report snapshot
- right report snapshot
- compareMeta
- validation result

### 완료 기준

- 조건 불일치 시 400 반환
- 수리 전/후 예외 비교 정상 허용
- 자동 분석 없이 두 snapshot 반환
