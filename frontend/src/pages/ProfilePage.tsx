import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useProfile } from '@/features/profile/hooks/useProfile';
import ProfileForm from '@/features/profile/components/ProfileForm';
import PasswordForm from '@/features/profile/components/PasswordForm';
import AvatarUpload from '@/features/profile/components/AvatarUpload';
import CategoryList from '@/features/categories/components/CategoryList';

/**
 * 프로필 페이지 (보호, `/profile`) — Step 11.
 *
 * 섹션: 프로필 정보(아바타 + 닉네임 + 이메일) / 비밀번호 변경 / 카테고리 관리.
 * GET /profile 마운트 조회 → 로딩(Spinner)/오류(재시도)/성공 분기.
 * 민감 정보(비밀번호 해시·토큰)는 표시하지 않는다.
 */
function ProfilePage() {
  const { data: profile, isLoading, isError, refetch, isFetching } = useProfile();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-charcoal">프로필</h1>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center" role="status">
          <Spinner size={28} className="text-charcoal" />
        </div>
      ) : isError || !profile ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-error">프로필을 불러오지 못했습니다.</p>
          <Button onClick={() => void refetch()} isLoading={isFetching}>
            다시 시도
          </Button>
        </div>
      ) : (
        <>
          <section
            aria-label="프로필 정보"
            className="flex flex-col gap-6 rounded-card border border-soft-border bg-surface-container-low p-6"
          >
            <h2 className="text-sm font-medium text-charcoal">프로필 정보</h2>
            <AvatarUpload avatarUrl={profile.avatarUrl} nickname={profile.nickname} />
            <ProfileForm profile={profile} />
          </section>

          <section
            aria-label="비밀번호 변경"
            className="flex flex-col gap-4 rounded-card border border-soft-border bg-surface-container-low p-6"
          >
            <h2 className="text-sm font-medium text-charcoal">비밀번호 변경</h2>
            <PasswordForm />
          </section>

          <section
            aria-label="카테고리 관리"
            className="rounded-card border border-soft-border bg-surface-container-low p-6"
          >
            <CategoryList />
          </section>
        </>
      )}
    </div>
  );
}

export default ProfilePage;
