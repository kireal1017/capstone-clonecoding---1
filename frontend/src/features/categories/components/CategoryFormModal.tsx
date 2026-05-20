import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useCreateCategory } from '@/features/categories/hooks/useCreateCategory';
import { useUpdateCategory } from '@/features/categories/hooks/useUpdateCategory';
import {
  categorySchema,
  HEX_COLOR_PATTERN,
  type CategoryFormValues,
} from '@/features/categories/schemas/category.schema';
import type { ApiErrorDetail } from '@/types/api';
import type { Category } from '@/types/domain';

/**
 * 카테고리 생성/수정 모달 (api-spec §5-2/§5-3, wireframe §7).
 *
 * - mode='create': POST /categories (sort_order 미지정 → 서버 max+1).
 * - mode='edit': PUT /categories/:id (전체 교체 — name·color·sort_order 모두 전송).
 * - HEX `#RRGGBB` 검증(zod) + 5색 빠른 선택 스와치 + color picker.
 * - 409 CATEGORY_NAME_ALREADY_EXISTS → name 필드 인라인 오류.
 */
interface CategoryFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** 수정 모드 대상(수정 시 필수). */
  category?: Category;
  /** 신규 생성 시 sort_order 기본값(현재 최대값+1). */
  nextSortOrder: number;
  onClose: () => void;
  onSuccess: () => void;
}

/** design-reference 컬러풀 5색(보라/파랑/빨강/초록/주황). */
const PALETTE = ['#7C3AED', '#2563EB', '#DC2626', '#16A34A', '#EA580C'] as const;

function buildDefaults(
  mode: 'create' | 'edit',
  nextSortOrder: number,
  category?: Category,
): CategoryFormValues {
  if (mode === 'edit' && category) {
    return { name: category.name, color: category.color, sortOrder: category.sortOrder };
  }
  return { name: '', color: PALETTE[0], sortOrder: nextSortOrder };
}

function CategoryFormModal({
  open,
  mode,
  category,
  nextSortOrder,
  onClose,
  onSuccess,
}: CategoryFormModalProps) {
  const { showToast } = useToast();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    mode: 'onBlur',
    defaultValues: buildDefaults(mode, nextSortOrder, category),
  });

  const selectedColor = watch('color');
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleServerError = (error: Error): void => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const body = error.response?.data as
        | { error?: { code?: string; details?: ApiErrorDetail[] } }
        | undefined;
      if (status === 409 && body?.error?.code === 'CATEGORY_NAME_ALREADY_EXISTS') {
        setError('name', { type: 'server', message: '이미 사용 중인 카테고리명입니다.' });
        return;
      }
      if (status === 422 && Array.isArray(body?.error?.details)) {
        let mapped = false;
        for (const detail of body.error.details) {
          if (detail.field === 'name') {
            setError('name', { type: 'server', message: detail.message });
            mapped = true;
          } else if (detail.field === 'color') {
            setError('color', { type: 'server', message: detail.message });
            mapped = true;
          } else if (detail.field === 'sort_order') {
            setError('sortOrder', { type: 'server', message: detail.message });
            mapped = true;
          }
        }
        if (mapped) return;
      }
    }
    showToast('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
  };

  const onValid = (values: CategoryFormValues): void => {
    if (mode === 'create') {
      createMutation.mutate(
        { name: values.name.trim(), color: values.color },
        {
          onSuccess: () => {
            showToast('카테고리를 추가했습니다.', 'success');
            onSuccess();
          },
          onError: handleServerError,
        },
      );
      return;
    }
    if (!category) return;
    updateMutation.mutate(
      {
        id: category.id,
        body: { name: values.name.trim(), color: values.color, sort_order: values.sortOrder },
      },
      {
        onSuccess: () => {
          showToast('카테고리를 수정했습니다.', 'success');
          onSuccess();
        },
        onError: handleServerError,
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} ariaLabel={mode === 'create' ? '카테고리 추가' : '카테고리 수정'} maxWidthClass="max-w-sm">
      <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4" noValidate>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-charcoal">
            {mode === 'create' ? '카테고리 추가' : '카테고리 수정'}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="text-outline hover:text-charcoal"
          >
            ✕
          </button>
        </div>

        <Input
          label="이름 *"
          type="text"
          placeholder="예: 독서"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium tracking-wide text-on-surface">색상 *</span>
          <div className="flex flex-wrap items-center gap-2">
            {PALETTE.map((color) => {
              const selected = selectedColor?.toUpperCase() === color;
              return (
                <button
                  key={color}
                  type="button"
                  aria-label={`색상 ${color}`}
                  aria-pressed={selected}
                  onClick={() =>
                    setValue('color', color, { shouldValidate: true, shouldDirty: true })
                  }
                  className={[
                    'h-7 w-7 rounded-full border transition-transform',
                    selected ? 'border-charcoal ring-1 ring-charcoal' : 'border-soft-border',
                  ].join(' ')}
                  style={{ backgroundColor: color }}
                />
              );
            })}
            <input
              type="color"
              aria-label="사용자 지정 색상"
              value={HEX_COLOR_PATTERN.test(selectedColor ?? '') ? selectedColor : '#000000'}
              onChange={(event) =>
                setValue('color', event.target.value.toUpperCase(), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className="h-7 w-9 cursor-pointer rounded border border-soft-border bg-white"
            />
          </div>
          {errors.color?.message ? (
            <p className="text-sm text-error">{errors.color.message}</p>
          ) : null}
        </div>

        <div className="mt-1 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            저장
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryFormModal;
