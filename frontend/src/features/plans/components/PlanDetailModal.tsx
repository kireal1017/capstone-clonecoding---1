import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/ui/Checkbox';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import PlanForm from '@/features/plans/components/PlanForm';
import { usePlans } from '@/features/plans/hooks/usePlans';
import { usePlan } from '@/features/plans/hooks/usePlan';
import { useDeletePlan } from '@/features/plans/hooks/useDeletePlan';
import { useCompletePlan } from '@/features/plans/hooks/useCompletePlan';
import { getDDayBadge } from '@/lib/date/dday';
import { getTodayKst } from '@/lib/date/kst';
import type { Plan, Priority } from '@/types/domain';

/**
 * 일정 상세 모달 (K-08, wireframe §5) — URL `?planId=` 진입.
 *
 * - 읽기 전용 기본 뷰: 제목·D-Day·마감일·마감시간·표시날짜·카테고리·중요도·알림·메모·완료.
 * - 데이터 출처: `['plans']` 캐시 우선, 없으면 GET /plans/:id 폴백(usePlan).
 * - 수정: PlanForm(mode="edit") 인라인 전환 → 저장 성공 시 읽기 뷰로 복귀.
 * - 삭제: ConfirmModal → DELETE(204) → 닫기. 진행 중 더블클릭 방지.
 * - 완료 토글: 읽기 뷰 체크박스(PATCH /complete).
 * - 닫기: X 버튼 / 오버레이 / ESC (Modal 셸 처리) → onClose(부모가 ?planId 제거).
 */
interface PlanDetailModalProps {
  planId: number;
  onClose: () => void;
}

const PRIORITY_LABEL: Record<Priority, string> = {
  high: '높음',
  normal: '보통',
  low: '낮음',
};

/** `YYYY-MM-DD` → "YYYY년 M월 D일". */
function formatKoreanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

function PlanDetailModal({ planId, onClose }: PlanDetailModalProps) {
  const todayKst = useMemo(() => getTodayKst(), []);
  const { showToast } = useToast();

  const { data: plansData } = usePlans();
  const cachedPlan = plansData?.plans.find((p) => p.id === planId) ?? null;

  // 캐시에 없을 때만 단건 폴백 조회.
  const {
    data: fetchedPlan,
    isLoading: isPlanLoading,
    isError: isPlanError,
  } = usePlan(planId, cachedPlan === null);

  const plan: Plan | null = cachedPlan ?? fetchedPlan ?? null;

  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useDeletePlan();
  const completeMutation = useCompletePlan();

  const handleConfirmDelete = (): void => {
    deleteMutation.mutate(planId, {
      onSuccess: () => {
        showToast('일정을 삭제했습니다.', 'success');
        setConfirmDelete(false);
        onClose();
      },
      onError: () => {
        setConfirmDelete(false);
        showToast('일정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
      },
    });
  };

  const handleToggleComplete = (): void => {
    if (completeMutation.isPending) return;
    completeMutation.mutate(planId, {
      onError: () => showToast('완료 상태 변경에 실패했습니다.', 'error'),
    });
  };

  return (
    <>
      <Modal open onClose={onClose} ariaLabel="일정 상세">
        {plan === null ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center">
            {isPlanLoading ? (
              <Spinner size={24} className="text-charcoal" />
            ) : isPlanError ? (
              <>
                <p className="text-sm text-error">일정을 불러오지 못했습니다.</p>
                <Button variant="ghost" onClick={onClose}>
                  닫기
                </Button>
              </>
            ) : (
              <p className="text-sm text-outline">일정을 찾을 수 없습니다.</p>
            )}
          </div>
        ) : isEditing ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-charcoal">일정 수정</h2>
              <button
                type="button"
                aria-label="닫기"
                onClick={onClose}
                className="text-outline hover:text-charcoal"
              >
                ✕
              </button>
            </div>
            <hr className="border-soft-border" />
            <PlanForm
              mode="edit"
              initialValues={plan}
              onSuccess={() => {
                showToast('일정을 수정했습니다.', 'success');
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <ReadOnlyView
            plan={plan}
            todayKst={todayKst}
            isToggling={completeMutation.isPending}
            onToggleComplete={handleToggleComplete}
            onEdit={() => setIsEditing(true)}
            onDeleteClick={() => setConfirmDelete(true)}
            onClose={onClose}
          />
        )}
      </Modal>

      <ConfirmModal
        open={confirmDelete}
        message={
          <span>
            이 일정을 삭제하시겠습니까?
            <br />이 작업은 되돌릴 수 없습니다.
          </span>
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        isConfirming={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

interface ReadOnlyViewProps {
  plan: Plan;
  todayKst: string;
  isToggling: boolean;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDeleteClick: () => void;
  onClose: () => void;
}

function ReadOnlyView({
  plan,
  todayKst,
  isToggling,
  onToggleComplete,
  onEdit,
  onDeleteClick,
  onClose,
}: ReadOnlyViewProps) {
  const badge = getDDayBadge(plan.dueDate, todayKst);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h2
          className={[
            'text-base font-semibold',
            plan.isCompleted ? 'text-outline line-through' : 'text-charcoal',
          ].join(' ')}
        >
          {plan.title}
        </h2>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="shrink-0 text-outline hover:text-charcoal"
        >
          ✕
        </button>
      </div>

      <hr className="border-soft-border" />

      {!plan.isCompleted ? (
        <div>
          <Badge badge={badge} />
        </div>
      ) : null}

      <dl className="flex flex-col gap-2 text-sm">
        <DetailRow label="📅 마감일" value={formatKoreanDate(plan.dueDate)} />
        {plan.dueTime ? <DetailRow label="🕐 마감 시간" value={plan.dueTime} /> : null}
        <DetailRow label="📌 표시 날짜" value={formatKoreanDate(plan.displayDate)} />
        <div className="flex items-center gap-3">
          <dt className="w-24 shrink-0 text-outline">• 카테고리</dt>
          <dd>
            <Chip name={plan.category?.name ?? null} color={plan.category?.color ?? null} />
          </dd>
        </div>
        <DetailRow label="‼ 중요도" value={PRIORITY_LABEL[plan.priority]} />
        <DetailRow label="🔔 알림" value={plan.isRemind ? '당일 알림 설정됨' : '알림 없음'} />
      </dl>

      {plan.memo ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-outline">메모</p>
          <p className="whitespace-pre-wrap rounded-card border border-soft-border bg-surface-container-low p-3 text-sm text-on-surface">
            {plan.memo}
          </p>
        </div>
      ) : null}

      <hr className="border-soft-border" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-on-surface">
          <Checkbox
            label="완료로 표시"
            checked={plan.isCompleted}
            disabled={isToggling}
            onChange={onToggleComplete}
          />
          완료로 표시
        </label>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onEdit}>
            수정
          </Button>
          <Button
            variant="ghost"
            onClick={onDeleteClick}
            className="border-error text-error hover:bg-error/5"
          >
            삭제
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3">
      <dt className="w-24 shrink-0 text-outline">{label}</dt>
      <dd className="text-on-surface">{value}</dd>
    </div>
  );
}

export default PlanDetailModal;
