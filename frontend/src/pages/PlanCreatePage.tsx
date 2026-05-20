/**
 * 할 일 등록 페이지 (보호, `/tasks/new`) — Step 7 골격.
 * 일정 입력 폼 영역 자리표시. 실제 폼/제출 로직은 Step 10.
 */
function PlanCreatePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-charcoal">할 일 등록</h1>
      <section
        aria-label="일정 등록 폼"
        className="rounded-card border border-soft-border bg-surface-container-low p-6"
      >
        <p className="text-sm text-outline">
          제목 / 날짜 / 카테고리 / 우선순위 / 메모 입력 영역 (Step 10 구현 예정)
        </p>
      </section>
    </div>
  );
}

export default PlanCreatePage;
