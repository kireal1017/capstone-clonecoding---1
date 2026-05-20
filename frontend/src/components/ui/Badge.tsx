import type { DDayBadge } from '@/lib/date/dday';

/**
 * D-Day 배지 — wireframe-spec §10 색상 규칙을 그대로 표시.
 * bgColor 가 null 이면 배경 없는 plain 날짜 텍스트(outline 톤)로 표시한다.
 * 색상은 디자인 토큰에 없는 HEX(연한 파스텔 계열)라 인라인 스타일을 사용한다.
 */
interface BadgeProps {
  badge: DDayBadge;
}

function Badge({ badge }: BadgeProps) {
  const { label, bgColor, textColor } = badge;

  if (bgColor === null) {
    return (
      <span className="text-xs" style={{ color: textColor }}>
        {label}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {label}
    </span>
  );
}

export default Badge;
