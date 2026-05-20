import { forwardRef, useId, type InputHTMLAttributes } from 'react';

/**
 * 공통 인풋 — 라벨 + 보조 텍스트(helper) + 인라인 오류 표시.
 * react-hook-form register({ ref, ... }) 와 호환되도록 forwardRef 사용.
 * 오류가 있으면 error 색 보더 + aria-invalid + 보조 텍스트 대신 오류 메시지 노출.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** 인라인 오류 메시지(있으면 helper 대신 표시). */
  error?: string | undefined;
  /** 입력 보조 안내 텍스트. */
  helperText?: string | undefined;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, id, className = '', ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedById = `${inputId}-desc`;
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium tracking-wide text-on-surface">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        aria-invalid={hasError}
        aria-describedby={error || helperText ? describedById : undefined}
        className={[
          'rounded border bg-white px-3 py-2 text-sm text-on-surface outline-none transition-colors',
          'placeholder:text-outline focus:border-charcoal',
          hasError ? 'border-error' : 'border-soft-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {hasError ? (
        <p id={describedById} className="text-sm text-error">
          {error}
        </p>
      ) : helperText ? (
        <p id={describedById} className="text-sm text-outline">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
