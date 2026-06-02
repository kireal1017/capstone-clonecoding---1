# 스마트 점검 리포트 docs 패키지

이 패키지는 OMC / Claude Code 기반 개발을 위한 최종 정리 문서입니다.

## 권장 문서 구조

```text
docs/
├─ README_docs.md
├─ progress.md
├─ prd/
│  ├─ PRD_v1.0_스마트점검리포트.md
│  ├─ 프론트엔드_PRD_세션별_v2_와이어프레임반영.md
│  └─ 백엔드_PRD_세션별.md
├─ specs/
│  ├─ 요구사항분석서_v3.0_스마트점검리포트.md
│  └─ 기능명세서_v3.0_스마트점검리포트.md
├─ harness/
│  ├─ OMC_개발세션_분할계획.md
│  ├─ 개발_하네스_OMC_ClaudeCode_v3_progress_DESIGN반영.md
│  ├─ OMC_단계별_실행명령어_스마트점검리포트_v2_progress검증반영.md
│  └─ OMC_검증프롬프트_및_progress운영규칙.md
├─ design/
│  └─ DESIGN.md
└─ wireframes/
   └─ 스마트점검리포트_전체유스케이스_와이어프레임_v6.html
```

## 사용 순서

1. `docs/progress.md` 확인
2. `docs/harness/OMC_단계별_실행명령어_스마트점검리포트_v2_progress검증반영.md`에서 현재 단계 프롬프트 복사
3. OMC / Claude Code 세션에 붙여넣기
4. 작업 완료 후 `docs/progress.md` 갱신 여부 확인
5. 다음 단계 진행

## 핵심 변경 사항

- 세션 기록은 `docs/session-logs/`가 아니라 `docs/progress.md` 하나로 통합 관리합니다.
- B08 이후 `B-VERIFY 백엔드 전체 검증`을 수행합니다.
- F08 이후 `F-VERIFY Playwright MCP 프론트 전체 검증`을 수행합니다.
- 프론트엔드는 `DESIGN.md`와 와이어프레임을 모두 기준으로 구현합니다.

## 누락된 원본 파일

없음
