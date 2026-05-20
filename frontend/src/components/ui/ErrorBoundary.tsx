import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * 앱 전역 에러 바운더리 — 렌더 단계의 예기치 못한 예외를 잡아
 * 조용한 폴백 화면(재시도/새로고침)으로 대체한다(design-reference: calm).
 *
 * 클래스 컴포넌트가 필요한 이유: getDerivedStateFromError/componentDidCatch 는
 * 함수형 훅으로 대체 불가(React 18 기준).
 * "재시도"는 바운더리 상태를 리셋해 children 재마운트를 시도하고,
 * "새로고침"은 전체 리로드를 수행한다.
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // 운영 로깅 훅 자리(현재는 no-op). 임시 console 출력은 두지 않는다.
    void error;
    void info;
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-gutter text-center text-on-surface"
        >
          <p className="text-sm text-on-surface">
            일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded bg-charcoal px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-charcoal/90"
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded border border-charcoal px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-surface-container-low"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
