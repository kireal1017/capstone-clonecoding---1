import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from '@/components/ui/Spinner';

/**
 * 공통 버튼 — Primary(charcoal) / Ghost(outline) 변형.
 * design-reference.md "Serene Productivity": 무거운 그림자/라운드 지양.
 * isLoading=true 이면 자동으로 disabled + 스피너 표시.
 */
type ButtonVariant = 'primary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-charcoal text-white hover:bg-charcoal/90 disabled:bg-outline',
  ghost:
    'border border-charcoal bg-transparent text-charcoal hover:bg-surface-container-low disabled:border-soft-border disabled:text-outline',
};

function Button({
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors',
        'disabled:cursor-not-allowed',
        fullWidth ? 'w-full' : '',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {isLoading ? <Spinner size={16} /> : null}
      {children}
    </button>
  );
}

export default Button;
