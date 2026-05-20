import { useEffect, useRef, useState } from 'react';

/**
 * 검색 입력바 — 돋보기 아이콘 + 입력 + 지우기(×) (wireframe §3).
 *
 * 내부에서 로컬 입력값을 즉시 반영하고, 300ms debounce 후 onDebouncedChange 를
 * 호출해 상위(스토어)에 확정 검색어를 전달한다. × 버튼은 즉시 초기화한다.
 * design-reference: 소프트 보더, charcoal 포커스, 절제된 톤.
 */
interface SearchBarProps {
  /** 외부 확정 검색어(스토어 동기화용). 입력 중 로컬값과 분리. */
  value: string;
  /** debounce(300ms) 후 확정 검색어 콜백. */
  onDebouncedChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const DEBOUNCE_MS = 300;

function SearchBar({
  value,
  onDebouncedChange,
  placeholder = '일정명 또는 메모 검색...',
  className = '',
}: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onDebouncedChange);
  onChangeRef.current = onDebouncedChange;

  // 외부에서 value 가 바뀌면(예: 다른 경로 진입/초기화) 로컬도 동기화.
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // 300ms debounce — 입력 멈춤 후에만 상위로 확정.
  useEffect(() => {
    if (local === value) return;
    const timer = window.setTimeout(() => {
      onChangeRef.current(local);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [local, value]);

  const handleClear = (): void => {
    setLocal('');
    onChangeRef.current('');
  };

  return (
    <div
      className={[
        'flex items-center gap-2 rounded border border-soft-border bg-white px-3 py-2',
        'focus-within:border-charcoal transition-colors',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden className="text-outline">
        🔍
      </span>
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label="일정 검색"
        className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
      />
      {local !== '' ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="검색어 지우기"
          className="text-outline transition-colors hover:text-charcoal"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export default SearchBar;
