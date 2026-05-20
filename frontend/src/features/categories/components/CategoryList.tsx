import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { usePlans } from '@/features/plans/hooks/usePlans';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useDeleteCategory } from '@/features/categories/hooks/useDeleteCategory';
import CategoryChip from '@/features/categories/components/CategoryChip';
import CategoryFormModal from '@/features/categories/components/CategoryFormModal';
import type { Category } from '@/types/domain';

/**
 * 카테고리 관리 목록 (ProfilePage 내, wireframe §7).
 *
 * - sortOrder 오름차순으로 색상 점 + 이름 표시 + 수정/삭제 버튼.
 * - 추가/수정: CategoryFormModal(생성 시 sort_order 는 max+1 기본값 전달).
 * - 삭제: ConfirmModal 에 연결 일정 N개가 '미분류'로 바뀜을 명시 → 삭제 후
 *   affectedPlans 토스트. 진행 중 더블클릭 방지.
 */
function CategoryList() {
  const { showToast } = useToast();
  const { data: categories, isLoading, isError, refetch, isFetching } = useCategories();
  const { data: plansData } = usePlans();
  const deleteMutation = useDeleteCategory();

  const [formState, setFormState] = useState<{ mode: 'create' | 'edit'; category?: Category } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const nextSortOrder = useMemo(() => {
    const max = (categories ?? []).reduce((acc, c) => Math.max(acc, c.sortOrder), 0);
    return max + 1;
  }, [categories]);

  // 삭제 대상에 연결된(미삭제) 일정 수 — 확인 모달 메시지에 사용.
  const linkedPlanCount = useMemo(() => {
    if (!deleteTarget || !plansData) return 0;
    return plansData.plans.filter((p) => p.categoryId === deleteTarget.id).length;
  }, [deleteTarget, plansData]);

  const handleConfirmDelete = (): void => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: (data) => {
        setDeleteTarget(null);
        showToast(`일정 ${data.affectedPlans}개가 미분류로 이동했습니다.`, 'success');
      },
      onError: () => {
        setDeleteTarget(null);
        showToast('카테고리 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-charcoal">카테고리 관리</h2>
        <Button variant="ghost" onClick={() => setFormState({ mode: 'create' })}>
          + 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6" role="status">
          <Spinner size={22} className="text-charcoal" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-sm text-error">카테고리를 불러오지 못했습니다.</p>
          <Button variant="ghost" onClick={() => void refetch()} isLoading={isFetching}>
            다시 시도
          </Button>
        </div>
      ) : (categories ?? []).length === 0 ? (
        <p className="rounded-card border border-soft-border bg-white px-4 py-6 text-center text-sm text-outline">
          등록된 카테고리가 없습니다. 추가 버튼으로 만들어보세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(categories ?? []).map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-card border border-soft-border bg-white px-4 py-3"
            >
              <CategoryChip category={category} />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormState({ mode: 'edit', category })}
                  className="text-sm text-outline hover:text-charcoal"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(category)}
                  className="text-sm text-error hover:underline"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formState !== null ? (
        <CategoryFormModal
          open
          mode={formState.mode}
          {...(formState.category ? { category: formState.category } : {})}
          nextSortOrder={nextSortOrder}
          onClose={() => setFormState(null)}
          onSuccess={() => setFormState(null)}
        />
      ) : null}

      <ConfirmModal
        open={deleteTarget !== null}
        message={
          <span>
            카테고리 &quot;{deleteTarget?.name}&quot;을(를) 삭제하면 연결된 일정 {linkedPlanCount}
            개가 &apos;미분류&apos;로 변경됩니다.
            <br />
            삭제하시겠습니까?
          </span>
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        isConfirming={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default CategoryList;
