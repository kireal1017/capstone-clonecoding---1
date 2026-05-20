import FAB from '@/components/ui/FAB';

/**
 * 일정 등록 FAB — `/tasks/new` 로 이동(라우트는 존재, 폼은 Step 10).
 * 메인 페이지 우하단에 고정 표시한다.
 */
function CreatePlanFAB() {
  return <FAB to="/tasks/new" label="일정 추가" />;
}

export default CreatePlanFAB;
