/**
 * KST(Asia/Seoul, 고정 +09:00) 기준 날짜 유틸 — Step 9.
 *
 * 앱 전체가 KST 기준이므로 "오늘"·요일·주간 범위 계산을 브라우저 로컬 TZ에
 * 의존하지 않고 항상 +09:00 으로 고정한다. 날짜는 `YYYY-MM-DD` 문자열로 다룬다
 * (Plan.dueDate / displayDate 와 동일한 형식).
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 현재 시각을 KST로 환산한 Date(내부 표현). UTC getter 로 KST 필드를 읽는다. */
function nowInKst(): Date {
  return new Date(Date.now() + KST_OFFSET_MS);
}

/** `YYYY-MM-DD` 문자열 → 자정(UTC) Date. 비교/일수 계산용 정규화. */
export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

/** Date 의 UTC 필드를 `YYYY-MM-DD` 로 포맷. */
export function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** KST 기준 오늘 날짜(`YYYY-MM-DD`). */
export function getTodayKst(): string {
  return formatDateOnly(nowInKst());
}

/** KST 기준 현재 연/월(`YYYY-MM`). */
export function getCurrentMonthKst(): string {
  const now = nowInKst();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** 두 `YYYY-MM-DD` 의 캘린더 일수 차(toDate - fromDate). */
export function diffInDays(fromDateStr: string, toDateStr: string): number {
  const from = parseDateOnly(fromDateStr);
  const to = parseDateOnly(toDateStr);
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

/** `YYYY-MM-DD` 의 요일 인덱스(0=일 ~ 6=토). */
export function getWeekdayIndex(dateStr: string): number {
  return parseDateOnly(dateStr).getUTCDay();
}

/**
 * 기준 날짜가 속한 주(월요일~일요일, ISO 주)의 7개 날짜를 반환.
 * 인덱스 0=월 ... 6=일.
 */
export function getIsoWeekDates(baseDateStr: string): string[] {
  const base = parseDateOnly(baseDateStr);
  const dow = base.getUTCDay(); // 0=일 ... 6=토
  // 월요일까지의 오프셋: 일(0)은 -6, 그 외는 1-dow.
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(base.getTime() + mondayOffset * 24 * 60 * 60 * 1000);
  return Array.from({ length: 7 }, (_, i) =>
    formatDateOnly(new Date(monday.getTime() + i * 24 * 60 * 60 * 1000)),
  );
}

/**
 * 월(`YYYY-MM`)의 6×7 캘린더 격자 날짜(`YYYY-MM-DD`) 42개.
 * 그 달 1일이 속한 주의 일요일부터 시작한다(일~토 헤더 기준).
 */
export function getMonthGridDates(monthStr: string): string[] {
  const [y, m] = monthStr.split('-').map(Number);
  const first = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, 1));
  const firstDow = first.getUTCDay(); // 0=일
  const gridStart = new Date(first.getTime() - firstDow * 24 * 60 * 60 * 1000);
  return Array.from({ length: 42 }, (_, i) =>
    formatDateOnly(new Date(gridStart.getTime() + i * 24 * 60 * 60 * 1000)),
  );
}

/** 월(`YYYY-MM`) 이동. delta 만큼 가감한 `YYYY-MM` 반환. */
export function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split('-').map(Number);
  const base = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1 + delta, 1));
  const ny = base.getUTCFullYear();
  const nm = String(base.getUTCMonth() + 1).padStart(2, '0');
  return `${ny}-${nm}`;
}

/** `YYYY-MM` → "YYYY년 M월" 라벨. */
export function formatMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  return `${y}년 ${m}월`;
}
