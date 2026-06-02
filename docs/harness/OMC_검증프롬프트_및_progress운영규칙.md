# OMC 검증 프롬프트 및 progress.md 운영 규칙 - 스마트 점검 리포트

> 이 문서는 백엔드 전체 검증, 프론트엔드 Playwright MCP 검증, 그리고 `docs/progress.md` 운영 규칙을 정리한 문서입니다.  
> 세션별 작업 기록은 개별 로그 파일로 나누지 않고 **`docs/progress.md` 하나에 누적 기록**합니다.

---

## 1. progress.md 운영 원칙

### 1.1 저장 위치

```text
docs/progress.md
```

### 1.2 세션 시작 시 지시

```md
작업을 시작하기 전에 반드시 `docs/progress.md`를 먼저 확인해서 현재까지 완료된 작업, 남은 작업, 이전 세션의 주의사항을 파악해줘.
이번 세션에서는 progress.md의 현재 상태를 기준으로 중복 구현을 피하고, 필요한 부분만 이어서 작업해줘.
```

### 1.3 세션 종료 시 지시

```md
작업이 끝나면 반드시 `docs/progress.md`를 갱신해줘.

갱신해야 할 내용:
1. 현재 전체 진행 상태
2. 이번 세션 작업 요약
3. 수정/생성한 파일
4. 실행한 명령어
5. 검증 결과
6. 실패/보류/TODO
7. 다음 세션에서 이어받을 내용
8. API/DB/UI 계약 변경 여부

주의:
- 기존 진행 기록을 삭제하지 않는다.
- 최신 세션 기록은 "세션 기록 요약" 표와 "상세 세션 기록" 영역에 추가한다.
- 완료된 항목은 상태값에 반영한다.
- 다음 세션이 바로 이어서 작업할 수 있도록 구체적으로 작성한다.
```

---

## 2. B-VERIFY 백엔드 전체 검증 프롬프트

```md
이번 세션은 B-VERIFY 백엔드 전체 검증 세션이야.

목표:
- 백엔드 전체 구조, DB schema, seed 데이터, 권한, Inspection CRUD, Report Snapshot, AI API, 공유 링크, 리포트 비교 API가 PRD와 백엔드 PRD 기준에 맞게 동작하는지 검증한다.
- 실제 실행과 API 호출을 통해 검증한다.
- 오류가 있으면 원인을 분석하고, 작은 수정으로 해결 가능한 경우 수정한다.
- 큰 구조 변경이 필요하면 임의로 대수정하지 말고 이슈로 기록한다.

반드시 먼저 확인할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/백엔드_PRD_세션별.md
4. docs/specs/기능명세서_v3.0_스마트점검리포트.md
5. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md

검증 대상:
1. Express 서버 실행
2. SQLite DB 연결
3. schema 생성 여부
4. seed 데이터 생성 여부
5. 데모 사용자 API
6. userId 기반 권한 체크
7. units 조회
8. Inspection 생성/조회/수정/삭제
9. draft/submitted 상태 수정/삭제 가능 여부
10. reported 상태 수정/삭제 차단 여부
11. 점검 제출 시 report 자동 생성
12. report_snapshots JSON 저장
13. 등급 산출 규칙
14. 소방·안전 수리 필요 시 E등급 처리
15. GPT API 연동 구조
16. prompts 파일 2개 읽기
17. AI 응답 JSON 구조
18. AI 실패 시 graceful fallback
19. 리포트 목록/상세 API
20. 임대인/임차인 확인 완료 API
21. 공유 링크 생성/조회
22. 공유 링크 만료 없음
23. 공유 링크 접근자 권한 제한
24. 리포트 비교 API
25. 같은 호실 + 같은 점검 유형 비교 조건
26. 수리 전/후 예외 비교 허용
27. 공통 오류 응답 형식

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

가능하다면 다음 검증용 스크립트 또는 API 호출을 직접 실행해줘:
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
- 명백한 import 오류
- 경로 오류
- 라우터 연결 누락
- 응답 구조 불일치
- 간단한 validation 오류
- seed 데이터 누락
- status 조건 누락
- 문서와 다른 endpoint 명칭 오류

수정 금지 또는 보류해야 할 범위:
- 전체 DB 구조 대개편
- API 계약 대규모 변경
- 프론트엔드 연쇄 수정이 필요한 변경
- 인증 시스템 추가
- 이미지 저장 방식을 Base64 외 방식으로 변경
- PDF 서버 생성 방식 추가

작업 종료 후:
- `docs/progress.md`에서 B-VERIFY 상태를 갱신한다.
- 성공/실패/보류 항목을 "상세 세션 기록"에 추가한다.
- 남은 이슈와 다음 권장 세션을 갱신한다.

최종 판정은 아래 중 하나로 작성한다.
- 통과
- 부분 통과
- 보류
- 실패
```

---

## 3. F-VERIFY Playwright MCP 프론트엔드 전체 검증 프롬프트

```md
이번 세션은 F-VERIFY 프론트엔드 Playwright MCP 전체 검증 세션이야.

목표:
- Playwright MCP를 사용해 프론트엔드 화면이 실제 브라우저에서 정상 동작하는지 검증한다.
- 와이어프레임, DESIGN.md, 프론트엔드 PRD 기준으로 UI 구조와 스타일이 맞는지 확인한다.
- 콘솔 오류, 네트워크 오류, 라우팅 오류, 버튼 동작 오류, 반응형 깨짐을 확인한다.
- 오류가 있으면 원인을 분석하고, 작은 수정으로 해결 가능한 경우 수정한다.
- 큰 구조 변경이 필요하면 임의로 대수정하지 말고 이슈로 기록한다.

반드시 먼저 확인할 문서:
1. docs/progress.md
2. docs/prd/PRD_v1.0_스마트점검리포트.md
3. docs/prd/프론트엔드_PRD_세션별_v2_와이어프레임반영.md
4. docs/design/DESIGN.md
5. docs/wireframes/스마트점검리포트_전체유스케이스_와이어프레임_v6.html
6. docs/harness/개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md

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
12. `/owner/reports` 임대인 리포트 목록
13. `/owner/reports/:id` 임대인 리포트 상세
14. `/tenant/reports` 임차인 리포트 목록
15. `/tenant/reports/:id` 임차인 리포트 상세
16. 공유 링크 화면 `/share/:token`
17. 리포트 비교 화면
18. 인쇄용 리포트 화면 `/reports/:id/print`

디자인 검증 기준:
- DESIGN.md의 색상 체계를 따른다.
  - Primary CTA: `#3E6AE1`
  - 기본 배경: `#FFFFFF`
  - 보조 배경: `#F4F4F4`
  - 주요 텍스트: `#171A20`
  - 본문 텍스트: `#393C41`
  - 보조 텍스트: `#5C5E62`
- 과한 shadow, gradient, pill 버튼을 남용하지 않는다.
- 카드 UI가 평면적이고 여백 중심으로 구성되어 있다.
- UI가 와이어프레임의 모바일 우선 카드형 흐름을 따른다.
- 휴대폰 외곽 프레임을 실제 앱 UI에 구현하지 않는다.
- AI 점검 도우미가 긴 문단이 아니라 행동형 카드로 표시된다.
- 리포트 화면이 문서형 레이아웃으로 읽기 쉽게 구성되어 있다.
- 생성 완료 리포트에 수정/삭제 버튼이 표시되지 않는다.
- 공유 링크 화면에서 확인 완료/수정/삭제 기능이 표시되지 않는다.
- 임차인 의견 작성 UI가 표시되지 않는다.

반응형 검증 viewport:
- Mobile: 390x844
- Tablet: 768x1024
- Desktop: 1440x900

각 viewport에서 확인할 것:
- 가로 스크롤이 생기지 않는지
- 주요 버튼이 화면 아래에 가려지지 않는지
- 카드 간격이 과도하거나 너무 붙어 있지 않은지
- 리포트 비교 화면이 모바일에서는 상하, 데스크톱에서는 좌우 비교로 보이는지
- PDF 인쇄용 화면에서 불필요한 버튼이 숨겨지는지

수정 가능 범위:
- 잘못된 Tailwind class
- 버튼 색상/간격/텍스트 오류
- 라우팅 누락
- 컴포넌트 import 오류
- 콘솔 오류
- API client 경로 오류
- 조건부 렌더링 오류
- print CSS 누락
- 모바일 레이아웃 깨짐

수정 금지 또는 보류해야 할 범위:
- 전체 화면 플로우 재설계
- API 계약 대규모 변경
- 백엔드 DB 구조 변경
- 기능 요구사항 변경
- 임차인 의견 작성 기능 추가
- 생성 완료 리포트 수정/삭제 기능 추가
- 서버 PDF 생성 방식 도입

작업 종료 후:
- `docs/progress.md`에서 F-VERIFY 상태를 갱신한다.
- 방문한 URL 목록, viewport별 검증 결과, 콘솔 오류, 네트워크 오류, 디자인 기준 통과/미통과 항목을 기록한다.
- 남은 이슈와 다음 권장 세션을 갱신한다.

최종 판정은 아래 중 하나로 작성한다.
- 통과
- 부분 통과
- 보류
- 실패
```
