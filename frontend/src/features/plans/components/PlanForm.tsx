import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useCreatePlan } from '@/features/plans/hooks/useCreatePlan';
import { useUpdatePlan } from '@/features/plans/hooks/useUpdatePlan';
import {
  planSchema,
  PRIORITY_VALUES,
  type PlanFormValues,
} from '@/features/plans/schemas/plan.schema';
import type { CreatePlanRequest } from '@/features/plans/api/createPlan';
import type { UpdatePlanBody } from '@/features/plans/api/updatePlan';
import { getTodayKst } from '@/lib/date/kst';
import type { ApiErrorDetail } from '@/types/api';
import type { Plan, Priority } from '@/types/domain';

/**
 * 재사용 일정 폼 (등록/수정 공용, wireframe §4).
 *
 * - mode='create': useCreatePlan(POST /plans). 성공 시 onSuccess().
 * - mode='edit': useUpdatePlan(PATCH /plans/:id). initialValues 의 plan 으로 초기화.
 *   (수정 진입 UI 는 Step 11; 폼 자체는 기능적으로 완성/연결됨.)
 *
 * 검증: react-hook-form + zod(planSchema). displayDate ≤ dueDate 교차 검증(클라이언트)
 * + 서버 422 details[display_date] 매핑(방어).
 *
 * display_date 자동 동기화(FE-10): dueDate 변경 시 사용자가 displayDate 를
 * 직접 수정하기 전까지 displayDate 를 dueDate 로 따라가게 한다. 사용자가 한 번
 * 직접 수정하면 동기화를 중단한다.
 */
interface PlanFormProps {
  mode: 'create' | 'edit';
  /** 수정 모드 대상 일정(수정 모드 필수). 등록 모드에서는 무시. */
  initialValues?: Plan;
  /** 저장 성공 콜백(부모가 네비게이션/모달 닫기 수행). */
  onSuccess: (plan: Plan) => void;
  /** 취소 확정 콜백(부모가 네비게이션/모달 닫기 수행). */
  onCancel: () => void;
  /**
   * 취소 요청 트리거를 부모에 등록한다(FE-06: 헤더 ← 가 취소 버튼과 동일하게
   * dirty 여부에 따라 확인 모달/즉시 취소를 수행하도록). 부모가 보관 후 헤더 ←
   * 클릭 시 호출한다.
   */
  registerCancelRequest?: (requestCancel: () => void) => void;
}

const PRIORITY_LABEL: Record<Priority, string> = {
  high: '높음',
  normal: '보통',
  low: '낮음',
};

/** 선택 시 중요도별 배경색(wireframe §4). */
const PRIORITY_SELECTED_BG: Record<Priority, string> = {
  high: '#FEE2E2',
  normal: '#FEF9C3',
  low: '#DCFCE7',
};

function toCreateRequest(values: PlanFormValues): CreatePlanRequest {
  return {
    title: values.title.trim(),
    due_date: values.dueDate,
    due_time: values.dueTime ? values.dueTime : null,
    display_date: values.displayDate,
    category_id: values.categoryId,
    priority: values.priority,
    memo: values.memo ? values.memo : null,
    is_remind: values.isRemind,
  };
}

function toUpdateBody(values: PlanFormValues): UpdatePlanBody {
  return {
    title: values.title.trim(),
    due_date: values.dueDate,
    due_time: values.dueTime ? values.dueTime : null,
    display_date: values.displayDate,
    category_id: values.categoryId,
    priority: values.priority,
    memo: values.memo ? values.memo : null,
    is_remind: values.isRemind,
  };
}

function buildDefaultValues(mode: 'create' | 'edit', initialValues?: Plan): PlanFormValues {
  if (mode === 'edit' && initialValues) {
    return {
      title: initialValues.title,
      dueDate: initialValues.dueDate,
      dueTime: initialValues.dueTime ?? '',
      displayDate: initialValues.displayDate,
      categoryId: initialValues.categoryId,
      priority: initialValues.priority,
      memo: initialValues.memo ?? '',
      isRemind: initialValues.isRemind,
    };
  }
  const today = getTodayKst();
  return {
    title: '',
    dueDate: today,
    dueTime: '',
    displayDate: today,
    categoryId: null,
    priority: 'normal',
    memo: '',
    isRemind: false,
  };
}

function PlanForm({
  mode,
  initialValues,
  onSuccess,
  onCancel,
  registerCancelRequest,
}: PlanFormProps) {
  const { showToast } = useToast();
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    getValues,
    formState: { errors, isDirty },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    mode: 'onBlur',
    defaultValues: buildDefaultValues(mode, initialValues),
  });

  // displayDate 를 사용자가 직접 수정했는지 추적(true 면 dueDate 자동 동기화 중단).
  const displayDateTouchedRef = useRef(mode === 'edit');

  const [confirmType, setConfirmType] = useState<'save' | 'cancel' | null>(null);

  const memoValue = watch('memo');
  const selectedCategoryId = watch('categoryId');
  const selectedPriority = watch('priority');

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // 검증 통과 → 저장 확인 모달 오픈.
  const onValid = (): void => {
    setConfirmType('save');
  };

  const handleConfirmSave = (): void => {
    const values = getValues();
    if (mode === 'create') {
      createMutation.mutate(toCreateRequest(values), {
        onSuccess: (plan) => {
          setConfirmType(null);
          onSuccess(plan);
        },
        onError: (error) => handleServerError(error),
      });
      return;
    }
    if (!initialValues) return;
    updateMutation.mutate(
      { id: initialValues.id, body: toUpdateBody(values) },
      {
        onSuccess: (plan) => {
          setConfirmType(null);
          onSuccess(plan);
        },
        onError: (error) => handleServerError(error),
      },
    );
  };

  // 서버 에러 처리: 422 details → 필드 매핑(특히 display_date), 그 외 토스트.
  const handleServerError = (error: Error): void => {
    setConfirmType(null);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const body = error.response?.data as
        | { error?: { code?: string; details?: ApiErrorDetail[] } }
        | undefined;
      if (status === 422 && Array.isArray(body?.error?.details)) {
        let mapped = false;
        for (const detail of body.error.details) {
          if (detail.field === 'display_date') {
            setError('displayDate', { type: 'server', message: detail.message });
            mapped = true;
          } else if (detail.field === 'due_date') {
            setError('dueDate', { type: 'server', message: detail.message });
            mapped = true;
          } else if (detail.field === 'title') {
            setError('title', { type: 'server', message: detail.message });
            mapped = true;
          } else if (detail.field === 'memo') {
            setError('memo', { type: 'server', message: detail.message });
            mapped = true;
          }
        }
        if (mapped) return;
        showToast('입력값을 다시 확인해주세요.', 'error');
        return;
      }
      if (status === 404 && body?.error?.code === 'CATEGORY_NOT_FOUND') {
        setError('categoryId', { type: 'server', message: '카테고리를 다시 선택해주세요.' });
        return;
      }
    }
    showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
  };

  const handleCancelClick = (): void => {
    if (!isDirty) {
      onCancel();
      return;
    }
    setConfirmType('cancel');
  };

  // 최신 취소 핸들러를 ref 에 보관하고, 안정적인 트리거를 부모(헤더 ←)에 1회 등록한다.
  const cancelClickRef = useRef(handleCancelClick);
  cancelClickRef.current = handleCancelClick;
  useEffect(() => {
    registerCancelRequest?.(() => cancelClickRef.current());
  }, [registerCancelRequest]);

  const handleConfirmCancel = (): void => {
    setConfirmType(null);
    onCancel();
  };

  const memoLength = memoValue?.length ?? 0;

  return (
    <>
      <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-5" noValidate>
        <Input
          label="할 일 제목 *"
          type="text"
          placeholder="예: 영상처리 과제 제출"
          error={errors.title?.message}
          {...register('title')}
        />

        <Input
          label="마감 기한 *"
          type="date"
          helperText="캘린더에 표시되는 마감일입니다."
          error={errors.dueDate?.message}
          {...register('dueDate', {
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              if (!displayDateTouchedRef.current) {
                setValue('displayDate', event.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            },
          })}
        />

        <Input
          label="마감 시간"
          type="time"
          helperText="선택 사항"
          error={errors.dueTime?.message}
          {...register('dueTime')}
        />

        <Input
          label="오늘의 할 일에 표시 날짜 *"
          type="date"
          helperText="기본값은 마감 기한과 동일합니다. (오늘 할 일·주간 바 표시 기준)"
          error={errors.displayDate?.message}
          {...register('displayDate', {
            onChange: () => {
              displayDateTouchedRef.current = true;
            },
          })}
        />

        <label className="flex items-center gap-2 text-sm text-on-surface">
          <Controller
            control={control}
            name="isRemind"
            render={({ field }) => (
              <Checkbox
                label="당일날 알려주기"
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
              />
            )}
          />
          당일날 알려주기
        </label>

        <hr className="border-soft-border" />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium tracking-wide text-on-surface">카테고리 *</legend>
          <div className="flex flex-wrap gap-2">
            <CategoryChipButton
              name="미분류"
              color={null}
              selected={selectedCategoryId === null}
              onClick={() =>
                setValue('categoryId', null, { shouldValidate: true, shouldDirty: true })
              }
            />
            {isCategoriesLoading ? (
              <span className="text-sm text-outline">카테고리 불러오는 중...</span>
            ) : (
              (categories ?? []).map((category) => (
                <CategoryChipButton
                  key={category.id}
                  name={category.name}
                  color={category.color}
                  selected={selectedCategoryId === category.id}
                  onClick={() =>
                    setValue('categoryId', category.id, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
              ))
            )}
          </div>
          {errors.categoryId?.message ? (
            <p className="text-sm text-error">{errors.categoryId.message}</p>
          ) : null}
        </fieldset>

        <hr className="border-soft-border" />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium tracking-wide text-on-surface">중요도 *</legend>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_VALUES.map((priority) => {
              const selected = selectedPriority === priority;
              return (
                <button
                  key={priority}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setValue('priority', priority, { shouldValidate: true, shouldDirty: true })
                  }
                  className={[
                    'rounded border px-3 py-1 text-sm transition-colors',
                    selected
                      ? 'border-charcoal text-on-surface'
                      : 'border-soft-border text-outline hover:text-on-surface',
                  ].join(' ')}
                  style={selected ? { backgroundColor: PRIORITY_SELECTED_BG[priority] } : undefined}
                >
                  {PRIORITY_LABEL[priority]}
                </button>
              );
            })}
          </div>
          {errors.priority?.message ? (
            <p className="text-sm text-error">{errors.priority.message}</p>
          ) : null}
        </fieldset>

        <hr className="border-soft-border" />

        <Textarea
          label="메모"
          rows={4}
          placeholder="메모를 입력하세요. (선택 사항)"
          error={errors.memo?.message}
          currentLength={memoLength}
          maxLength={500}
          {...register('memo')}
        />

        <div className="flex flex-col gap-2">
          <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
            저장하기
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={handleCancelClick}
            disabled={isSubmitting}
          >
            취소
          </Button>
        </div>
      </form>

      <ConfirmModal
        open={confirmType === 'save'}
        message={mode === 'create' ? '일정을 등록하시겠습니까?' : '일정을 수정하시겠습니까?'}
        confirmLabel="확인"
        cancelLabel="취소"
        isConfirming={isSubmitting}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmType(null)}
      />

      <ConfirmModal
        open={confirmType === 'cancel'}
        message={
          <span>
            작성 중인 내용이 사라집니다.
            <br />
            취소하시겠습니까?
          </span>
        }
        confirmLabel="확인"
        cancelLabel="취소"
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmType(null)}
      />
    </>
  );
}

interface CategoryChipButtonProps {
  name: string;
  color: string | null;
  selected: boolean;
  onClick: () => void;
}

/** 카테고리 선택 칩 버튼 — 선택 시 해당 색상 border + 옅은 배경. */
function CategoryChipButton({ name, color, selected, onClick }: CategoryChipButtonProps) {
  const dotColor = color ?? '#7a776e';
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1 rounded border px-2.5 py-1 text-sm transition-colors',
        selected ? 'text-on-surface' : 'border-soft-border text-outline hover:text-on-surface',
      ].join(' ')}
      style={
        selected
          ? { borderColor: dotColor, backgroundColor: `${color ?? '#7a776e'}1a` }
          : undefined
      }
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      {name}
    </button>
  );
}

export default PlanForm;
