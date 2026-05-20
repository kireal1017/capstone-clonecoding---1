import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

/**
 * 공통 텍스트에어리어 — 라벨 + 보조 텍스트(helper) + 인라인 오류 + 글자 수 카운터.
 * Input 과 동일한 토큰/구조를 따른다(soft-border, charcoal focus, error 보더).
 * react-hook-form register({ ref, ... }) 와 호환되도록 forwardRef 사용.
 */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  /** 인라인 오류 메시지(있으면 helper 대신 표시). */
  error?: string | undefined;
  /** 입력 보조 안내 텍스트. */
  helperText?: string | undefined;
  /** 우측 하단 글자 수 카운터에 쓸 현재 길이(미지정 시 카운터 숨김). */
  currentLength?: number | undefined;
  /** 글자 수 카운터 최대값. */
  maxLength?: number | undefined;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helperText, currentLength, maxLength, id, className = '', rows = 4, ...rest },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const describedById = `${textareaId}-desc`;
  const hasError = Boolean(error);
  const showCounter = typeof currentLength === 'number' && typeof maxLength === 'number';

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={textareaId} className="text-sm font-medium tracking-wide text-on-surface">
        {label}
      </label>
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        maxLength={maxLength}
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
      <div className="flex items-start justify-between gap-2">
        {hasError ? (
          <p id={describedById} className="text-sm text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={describedById} className="text-sm text-outline">
            {helperText}
          </p>
        ) : (
          <span />
        )}
        {showCounter ? (
          <span className="shrink-0 text-xs text-outline">
            {currentLength}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
});

export default Textarea;
