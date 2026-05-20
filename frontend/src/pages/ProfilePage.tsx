/**
 * 프로필 페이지 (보호, `/profile`) — Step 7 골격.
 * 프로필 / 비밀번호 변경 / 카테고리 관리 영역 자리표시. 실제 로직은 Step 11.
 */
function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-charcoal">프로필</h1>
      <section
        aria-label="프로필 정보"
        className="rounded-card border border-soft-border bg-surface-container-low p-6"
      >
        <h2 className="text-sm font-medium text-charcoal">프로필 정보</h2>
        <p className="mt-2 text-sm text-outline">닉네임 / 아바타 영역 (Step 11 구현 예정)</p>
      </section>
      <section
        aria-label="비밀번호 변경"
        className="rounded-card border border-soft-border bg-surface-container-low p-6"
      >
        <h2 className="text-sm font-medium text-charcoal">비밀번호 변경</h2>
        <p className="mt-2 text-sm text-outline">비밀번호 변경 영역 (Step 11 구현 예정)</p>
      </section>
      <section
        aria-label="카테고리 관리"
        className="rounded-card border border-soft-border bg-surface-container-low p-6"
      >
        <h2 className="text-sm font-medium text-charcoal">카테고리 관리</h2>
        <p className="mt-2 text-sm text-outline">카테고리 목록/관리 영역 (Step 11 구현 예정)</p>
      </section>
    </div>
  );
}

export default ProfilePage;
