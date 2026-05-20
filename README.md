# PlanMate

대학생을 위한 일정 관리 웹 애플리케이션.

## 워크스페이스 구조

```
planmate/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Express + TypeScript + Prisma
├── docs/              # 설계 문서
├── package.json       # 루트 워크스페이스 설정
├── .prettierrc        # Prettier 설정
├── .gitignore
└── .env.example       # 환경 변수 템플릿
```

## 부트스트랩 명령

```bash
# 의존성 설치 (모든 워크스페이스)
npm install

# 타입 검사 (frontend + backend 동시)
npm run typecheck

# 린트 (frontend + backend 동시)
npm run lint

# 포맷팅
npm run format

# 개발 서버 실행
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:4000
```

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS (스타일링)
- React Router v6 (라우팅)
- TanStack Query v5 (서버 상태 관리)
- Zustand (클라이언트 상태 관리)
- React Hook Form + Zod (폼 검증)
- Axios (HTTP 클라이언트)

### Backend
- Node.js + Express + TypeScript
- Prisma + SQLite (ORM + DB)
- JWT (인증: Access 1h + Refresh 7d httpOnly 쿠키)
- bcrypt (비밀번호 해싱)
- Zod (요청 검증)
- Vitest + supertest (테스트)

## 환경 변수 설정

루트와 각 워크스페이스의 `.env.example`을 `.env`로 복사 후 값을 채웁니다.

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```
