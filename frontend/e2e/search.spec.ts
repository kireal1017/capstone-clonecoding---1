// P-05 검색 모드 (validation.md §6). harness Step 12 범위.
//
// 검색바 키워드 입력 → 300ms debounce → 캘린더·주간 바가 조건부 렌더링으로
// 사라지고 SearchResultList 가 표시됨(전체 기간 대상) → 검색어 삭제 시 복귀.
//
// 자체 완결성: 시드 로그인 비밀번호가 placeholder 라 신규 사용자를 등록하고
// 일정을 UI 로 생성한 뒤 검증한다(다른 P-* 스펙과 동일 패턴).

import { test, expect, type Page } from '@playwright/test';

function uniqueEmail(): string {
  return `e2e_search_${Date.now()}_${Math.floor(Math.random() * 1e4)}@planmate.local`;
}

const PASSWORD = 'planmate123';

async function registerAndLogin(page: Page, email: string): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('닉네임').fill('검색테스터');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호', { exact: true }).fill(PASSWORD);
  await page.getByLabel('비밀번호 확인').fill(PASSWORD);
  await page.getByRole('button', { name: '가입하기' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function createPlan(page: Page, title: string, daysFromToday: number): Promise<void> {
  const due = new Date();
  due.setDate(due.getDate() + daysFromToday);
  const dueDate = due.toISOString().slice(0, 10);

  await page.goto('/tasks/new');
  await page.getByLabel('할 일 제목 *').fill(title);
  await page.getByLabel('마감 기한 *').fill(dueDate);
  await page.getByLabel('오늘의 할 일에 표시 날짜 *').fill(dueDate);
  await page.getByRole('button', { name: '저장하기' }).click();
  // 저장 확인 모달 → 확인
  await page.getByRole('button', { name: '확인' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('P-05 검색 모드', () => {
  test('키워드 입력 시 캘린더·주간 바 숨김 + 검색 결과 표시, 삭제 시 복귀', async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    await createPlan(page, '영상처리 과제 제출', 5);
    await createPlan(page, '데이터베이스 복습', 3);

    const calendar = page.getByTestId('monthly-calendar');
    const weeklyBar = page.getByTestId('weekly-plan-bar');
    await expect(calendar).toBeVisible();
    await expect(weeklyBar).toBeVisible();

    // 1. 검색어 입력
    await page.getByLabel('일정 검색').fill('영상처리');
    // 2. 300ms debounce 대기
    await page.waitForTimeout(350);

    // 3~4. 캘린더·주간 바 hidden (조건부 렌더링 — DOM 에서 사라짐)
    await expect(calendar).toHaveCount(0);
    await expect(weeklyBar).toHaveCount(0);

    // 5. 검색 결과 영역 표시
    const results = page.getByRole('region', { name: '검색 결과' });
    await expect(results).toBeVisible();
    await expect(results).toContainText('검색 결과');

    // 6. "영상처리" 포함 항목 존재 + 무관 항목 미노출
    await expect(results.getByText('영상처리 과제 제출')).toBeVisible();
    await expect(results.getByText('데이터베이스 복습')).toHaveCount(0);

    // 7. 검색어 전체 삭제
    await page.getByLabel('검색어 지우기').click();
    await page.waitForTimeout(350);

    // 8. 캘린더·주간 바 재표시
    await expect(page.getByTestId('monthly-calendar')).toBeVisible();
    await expect(page.getByTestId('weekly-plan-bar')).toBeVisible();
  });

  test('검색 결과 없음 시 빈 상태 안내', async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);
    await createPlan(page, '영상처리 과제 제출', 5);

    await page.getByLabel('일정 검색').fill('존재하지않는키워드');
    await page.waitForTimeout(350);

    const results = page.getByRole('region', { name: '검색 결과' });
    await expect(results).toContainText('검색 결과가 없습니다.');
    // 오늘 할 일 섹션은 검색 모드에서도 유지(FE-03)
    await expect(page.getByTestId('today-plan-list')).toBeVisible();
  });
});
