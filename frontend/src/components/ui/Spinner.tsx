/**
 * 로딩 스피너 — Serene Productivity 토큰 기반의 절제된 회전 표시.
 * 버튼 내부/페이지 부트스트랩 폴백 등에서 재사용한다.
 */
interface SpinnerProps {
  /** 픽셀 단위 지름 (기본 16). */
  size?: number;
  className?: string;
  label?: string;
}

function Spinner({ size = 16, className = '', label = '로딩 중' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export default Spinner;
