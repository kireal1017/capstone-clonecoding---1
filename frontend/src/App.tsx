import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';
import { ToastProvider } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';

/**
 * 앱 컴포지션 루트 — Provider(TanStack Query, Toast) + 인증 부트스트랩 + RouterProvider.
 *
 * 부트스트랩(세션 복원)이 끝나기 전(status 'idle'/'loading')에는 짧은 로딩 폴백을
 * 보여주고, 완료되면 라우터를 렌더링한다. 이로써 ProtectedRoute 의 리다이렉트
 * 깜빡임을 방지한다(가드는 부트스트랩 완료 후의 isAuthenticated 만 본다).
 */
function AuthBootstrapGate() {
  const status = useAuthBootstrap();
  const isBootstrapping = status === 'idle' || status === 'loading';

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-charcoal">
        <Spinner size={28} label="세션 확인 중" />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthBootstrapGate />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
