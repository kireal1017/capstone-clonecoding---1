/**
 * 메인 대시보드 페이지 (보호, `/`) — Step 7 골격.
 * 캘린더 / 주간 막대 / 오늘 일정 영역 자리표시(라벨만). 실제 데이터/로직은 Step 9.
 */
function MainPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-charcoal">오늘의 일정</h1>
      <section
        aria-label="월간 캘린더"
        className="rounded-card border border-soft-border bg-surface-container-low p-6"
      >
        <h2 className="text-sm font-medium text-charcoal">캘린더</h2>
        <p className="mt-2 text-sm text-outline">월간 캘린더 영역 (Step 9 구현 예정)</p>
      </section>
      <section
        aria-label="주간 진행"
        className="rounded-card border border-soft-border bg-surface-container-low p-6"
      >
        <h2 className="text-sm font-medium text-charcoal">주간</h2>
        <p className="mt-2 text-sm text-outline">주간 진행 막대 영역 (Step 9 구현 예정)</p>
      </section>
      <section
        aria-label="오늘 일정 목록"
        className="rounded-card border border-soft-border bg-surface-container-low p-6"
      >
        <h2 className="text-sm font-medium text-charcoal">오늘 일정</h2>
        <p className="mt-2 text-sm text-outline">오늘 일정 목록 영역 (Step 9 구현 예정)</p>
      </section>
    </div>
  );
}

export default MainPage;
