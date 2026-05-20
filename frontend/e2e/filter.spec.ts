// 필터 칩 (validation.md §6 / api-spec §4-1 DB-07). harness Step 12 범위.
//
// 중요도(OR)·완료 여부(단일)·초기화 칩이 메인 3영역(오늘 할 일 등)에 공통 적용됨을
// 확인한다. 필터는 캐시된 전체 세트 위에서 클라이언트로 적용된다(재요청 없음).
//
// 자체 완결성: 신규 사용자 등록 후 UI 로 일정을 생성한다.

import { test, expect, type Page } from '@playwright/test';

function uniqueEmail(): string {
  return `e2e_filter_${Date.now()}_${Math.floor(Math.random() * 1e4)}@planmate.local`;
}

const PASSWORD = 'planmate123';

async function registerAndLogin(page: Page, email: string): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('닉네임').fill('필터테스터');
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 오늘 표시(displayDate=today) 일정 생성. priority 칩 라벨로 우선순위 선택. */
async function createTodayPlan(page: Page, title: string, priorityLabel: string): Promise<void> {
  const today = todayIso();
  await page.goto('/tasks/new');
  await page.getByLabel('할 일 제목 *').fill(title);
  await page.getByLabel('마감 기한 *').fill(today);
  await page.getByLabel('오늘의 할 일에 표시 날짜 *').fill(today);
  // 우선순위 칩(높음/보통/낮음) 선택
  await page.getByRole('button', { name: priorityLabel, exact: true }).first().click();
  await page.getByRole('button', { name: '저장하기' }).click();
  await page.getByRole('button', { name: '확인' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('필터 칩', () => {
  test('중요도 필터(OR)가 오늘 할 일 목록을 좁히고 초기화로 복원된다', async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    await createTodayPlan(page, '높음 과제', '높음');
    await createTodayPlan(page, '낮음 과제', '낮음');

    const todayList = page.getByTestId('today-plan-list');
    await expect(todayList.getByText('높음 과제')).toBeVisible();
    await expect(todayList.getByText('낮음 과제')).toBeVisible();

    // 중요도 "높음" 칩 선택 → 낮음 항목 사라짐
    await page.getByRole('button', { name: '높음', exact: true }).click();
    await expect(todayList.getByText('높음 과제')).toBeVisible();
    await expect(todayList.getByText('낮음 과제')).toHaveCount(0);

    // 초기화 → 둘 다 복원
    await page.getByRole('button', { name: '초기화' }).click();
    await expect(todayList.getByText('높음 과제')).toBeVisible();
    await expect(todayList.getByText('낮음 과제')).toBeVisible();
  });

  test('맞지 않는 필터 조합 시 빈 상태 안내가 표시된다', async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    await createTodayPlan(page, '보통 과제', '보통');

    // "높음" 만 선택 → 보통 항목 제외 → 오늘 할 일 빈 상태
    await page.getByRole('button', { name: '높음', exact: true }).click();

    const todayList = page.getByTestId('today-plan-list');
    await expect(todayList).toContainText('조건에 맞는 일정이 없습니다.');

    // 초기화 후 복원
    await page.getByRole('button', { name: '초기화' }).click();
    await expect(todayList.getByText('보통 과제')).toBeVisible();
  });
});
