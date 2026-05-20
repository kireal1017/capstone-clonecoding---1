import type { InputHTMLAttributes } from 'react';

/**
 * 완료 체크박스 — 오늘 할 일 카드의 완료 토글용.
 * 네이티브 input[type=checkbox] 위에 charcoal 토큰 스타일을 적용.
 * disabled(예: 토글 mutation 진행 중)이면 비활성 + 커서 차단.
 */
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

function Checkbox({ label, className = '', disabled = false, ...rest }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      disabled={disabled}
      className={[
        'h-4 w-4 cursor-pointer rounded border-soft-border text-charcoal accent-charcoal',
        'focus:ring-1 focus:ring-charcoal disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}

export default Checkbox;
