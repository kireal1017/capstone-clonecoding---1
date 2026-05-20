/**
 * D-Day 배지 계산 — wireframe-spec §10 / PRD §32.
 *
 * 기준: dueDate − today(KST) 의 캘린더 일수 차(diff).
 * - diff === 0  → "D-Day"     (bg #FEE2E2 / text #DC2626)
 * - diff === 1  → "D-1"       (bg #FEF3C7 / text #D97706)
 * - diff === 3  → "D-3"       (bg #FEF9C3 / text #B45309)
 * - diff <  0   → "마감 지남"  (bg #F3F4F6 / text #6B7280)
 * - diff === 2 또는 diff >= 4 → "YYYY.MM.DD" (배경 없음, text outline)
 */
import { diffInDays } from '@/lib/date/kst';

export interface DDayBadge {
  /** 표시 텍스트. */
  label: string;
  /** 배지 배경 색(HEX). null 이면 배경 없음(plain 날짜 표시). */
  bgColor: string | null;
  /** 텍스트 색(HEX). plain 표시는 outline 토큰(#7a776e) 사용. */
  textColor: string;
}

const OUTLINE = '#7a776e';

/** `YYYY-MM-DD` → "YYYY.MM.DD". */
function toDotDate(dateStr: string): string {
  return dateStr.replaceAll('-', '.');
}

/**
 * dueDate 와 today(KST `YYYY-MM-DD`) 로 D-Day 배지 정보를 계산한다.
 */
export function getDDayBadge(dueDate: string, todayKst: string): DDayBadge {
  const diff = diffInDays(todayKst, dueDate);

  if (diff === 0) {
    return { label: 'D-Day', bgColor: '#FEE2E2', textColor: '#DC2626' };
  }
  if (diff === 1) {
    return { label: 'D-1', bgColor: '#FEF3C7', textColor: '#D97706' };
  }
  if (diff === 3) {
    return { label: 'D-3', bgColor: '#FEF9C3', textColor: '#B45309' };
  }
  if (diff < 0) {
    return { label: '마감 지남', bgColor: '#F3F4F6', textColor: '#6B7280' };
  }
  // diff === 2 또는 diff >= 4
  return { label: toDotDate(dueDate), bgColor: null, textColor: OUTLINE };
}
