import { createBrowserRouter } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/routes/ProtectedRoute';
import PublicOnlyRoute from '@/routes/PublicOnlyRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import MainPage from '@/pages/MainPage';
import PlanCreatePage from '@/pages/PlanCreatePage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * 애플리케이션 라우터 (react-router-dom v6, createBrowserRouter).
 *
 * 경로 명명: 사용자가 `/register`, `/tasks/new`를 선택(frontend-spec.md의
 * `/auth`, `/plans/new`를 의도적으로 대체). 문서 정합화는 후속 과제.
 *
 * - 공개: /login, /register (인증 시 / 로 리다이렉트)
 * - 보호: /, /tasks/new, /profile (미인증 시 /login 으로 리다이렉트, AppShell 하위)
 * - * : NotFound
 */
export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <MainPage /> },
          { path: '/tasks/new', element: <PlanCreatePage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
