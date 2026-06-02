<template>
  <AppLayout>
    <!-- ── Header ── -->
    <template #header>
      <PageHeader
        title="문제 항목 점검"
        :subtitle="headerSubtitle"
        :has-back="true"
        @back="onBack"
      />
    </template>

    <!-- Reported read-only notice -->
    <div v-if="inspection.status === 'reported'" class="mt-4 mb-4">
      <AlertMessage tone="info">
        생성 완료된 리포트입니다 — 수정할 수 없습니다.
      </AlertMessage>
    </div>

    <!-- Save feedback -->
    <div v-if="saveMsg" class="mt-4 mb-2">
      <AlertMessage :tone="saveMsgTone" :dismissible="true" @close="saveMsg = ''">
        {{ saveMsg }}
      </AlertMessage>
    </div>

    <!-- Step indicator -->
    <div class="mt-4 mb-6">
      <StepIndicator :steps="STEPS" :current="currentStep" />
    </div>

    <!-- ═══════════════════════════════════
         Step 0 — 문제 정보 + 현장 확인
    ════════════════════════════════════ -->
    <div v-if="currentStep === 0" class="flex flex-col gap-4">

      <!-- 문제 정보 섹션 -->
      <BaseCard title="문제 정보" :bordered="true">
        <div class="flex flex-col gap-4">

          <!-- 분야 (category) -->
          <FormField label="분야" :required="true" :error="categoryError">
            <div
              class="flex flex-wrap gap-2"
              role="group"
              aria-label="분야 선택"
            >
              <button
                v-for="field in PROBLEM_FIELDS"
                :key="field.category"
                type="button"
                :disabled="inspection.status === 'reported'"
                :class="[
                  'px-3 h-8 text-xs font-medium rounded border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand',
                  category === field.category
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-body border-hair hover:border-ph',
                  inspection.status === 'reported' ? 'cursor-default' : 'cursor-pointer',
                ]"
                :aria-pressed="category === field.category"
                @click="selectCategory(field.category)"
              >
                {{ field.label }}
              </button>
            </div>
          </FormField>

          <!-- 문제 항목 (problemItem) -->
          <FormField label="문제 항목" :required="true" :error="problemItemError" :hint="!category ? '분야를 먼저 선택하세요' : ''">
            <select
              v-if="!useCustomItem"
              v-model="problemItem"
              :disabled="!category || inspection.status === 'reported'"
              class="w-full h-10 px-3 rounded border border-hair bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors disabled:bg-surface disabled:text-muted appearance-none"
              aria-label="문제 항목 선택"
            >
              <option value="" disabled>항목 선택</option>
              <option
                v-for="item in currentCategoryItems"
                :key="item"
                :value="item"
              >{{ item }}</option>
              <option value="__custom__">직접 입력...</option>
            </select>
            <!-- custom text input revealed when "직접 입력" is selected -->
            <div v-else class="flex gap-2">
              <input
                v-model="customItemText"
                type="text"
                :disabled="inspection.status === 'reported'"
                placeholder="문제 항목을 직접 입력하세요"
                class="flex-1 h-10 px-3 rounded border border-hair bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors disabled:bg-surface disabled:text-muted"
                aria-label="문제 항목 직접 입력"
              />
              <button
                type="button"
                class="h-10 px-3 text-xs text-muted hover:text-body border border-hair rounded transition-colors"
                @click="cancelCustomItem"
              >취소</button>
            </div>
          </FormField>

          <!-- 문제 상태 (state) -->
          <FormField label="문제 상태">
            <div
              class="flex items-stretch border border-hair rounded overflow-hidden w-fit"
              role="group"
              aria-label="문제 상태 선택"
            >
              <button
                v-for="(s, idx) in ISSUE_STATES"
                :key="s.value"
                type="button"
                :disabled="inspection.status === 'reported'"
                :class="[
                  'px-4 h-9 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-offset-0',
                  state === s.value
                    ? 'bg-brand text-white'
                    : 'bg-white text-muted hover:bg-surface',
                  inspection.status === 'reported' ? 'cursor-default' : 'cursor-pointer',
                  idx > 0 ? 'border-l border-hair' : '',
                ]"
                :aria-pressed="state === s.value"
                @click="state = s.value"
              >
                {{ s.label }}
              </button>
            </div>
          </FormField>

          <!-- 위치 (location) -->
          <FormField label="위치" :required="true" :error="locationError" hint="예: 거실 북쪽 벽, 화장실 바닥">
            <input
              v-model="location"
              type="text"
              :disabled="inspection.status === 'reported'"
              placeholder="예: 거실 북쪽 벽"
              class="w-full h-10 px-3 rounded border bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors disabled:bg-surface disabled:text-muted"
              :class="locationError ? 'border-ink' : 'border-hair'"
              aria-label="위치"
              :aria-invalid="!!locationError"
              aria-describedby="issue-location-error"
              @input="locationError = ''"
            />
          </FormField>

          <!-- 증상 설명 (description) -->
          <FormField label="증상 설명" :required="true" :error="descriptionError" hint="이상 증상을 구체적으로 기술해 주세요">
            <textarea
              v-model="description"
              :disabled="inspection.status === 'reported'"
              rows="3"
              placeholder="이상 증상을 구체적으로 기술해 주세요"
              class="w-full px-3 py-2 rounded border bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors resize-none disabled:bg-surface disabled:text-muted"
              :class="descriptionError ? 'border-ink' : 'border-hair'"
              aria-label="증상 설명"
              :aria-invalid="!!descriptionError"
              aria-describedby="issue-description-error"
              @input="descriptionError = ''"
            />
          </FormField>
        </div>
      </BaseCard>

      <!-- 현장 확인 항목 섹션 -->
      <BaseCard title="현장 확인 항목" :bordered="true">
        <div class="flex flex-col divide-y divide-hair">
          <div
            v-for="(obs, idx) in observationRows"
            :key="idx"
            class="flex items-center justify-between gap-3 py-2 first:pt-0"
          >
            <!-- Observation key label or editable input for custom rows -->
            <span
              v-if="!obs.isCustom"
              class="text-sm text-body shrink-0 min-w-0 flex-1"
            >{{ obs.observationKey }}</span>
            <input
              v-else
              v-model="obs.observationKey"
              type="text"
              :disabled="inspection.status === 'reported'"
              placeholder="확인 항목 이름"
              class="flex-1 h-8 px-2 rounded border border-hair bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors min-w-0 disabled:bg-surface disabled:text-muted"
              aria-label="확인 항목 이름"
            />

            <!-- Tri-state segmented control: 있음 / 없음 / 확인 필요 -->
            <div
              class="flex items-stretch border border-hair rounded overflow-hidden shrink-0"
              role="group"
              :aria-label="obs.observationKey + ' 확인'"
            >
              <button
                v-for="(ov, oidx) in OBSERVATION_VALUES"
                :key="ov.value"
                type="button"
                :disabled="inspection.status === 'reported'"
                :class="[
                  'px-2 h-9 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-offset-0',
                  obs.value === ov.value
                    ? 'bg-brand text-white'
                    : 'bg-white text-muted hover:bg-surface',
                  inspection.status === 'reported' ? 'cursor-default' : 'cursor-pointer',
                  oidx > 0 ? 'border-l border-hair' : '',
                ]"
                :aria-pressed="obs.value === ov.value"
                @click="obs.value = ov.value"
              >
                {{ ov.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- + 확인 항목 추가 -->
        <div v-if="inspection.status !== 'reported'" class="mt-3 pt-3 border-t border-hair">
          <BaseButton
            variant="ghost"
            type="button"
            @click="addCustomObservation"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            확인 항목 추가
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <!-- ═══════════════════════════════════
         Step 1 — 검토 + 저장
    ════════════════════════════════════ -->
    <div v-else-if="currentStep === 1" class="flex flex-col gap-4">

      <!-- Problem summary card -->
      <BaseCard title="문제 정보 요약" :bordered="true">
        <div class="flex flex-col divide-y divide-hair">
          <div class="flex items-center justify-between py-2 first:pt-0">
            <span class="text-xs text-muted">점검 유형</span>
            <span class="text-sm font-medium text-ink">{{ labelOf(inspection.inspectionType) }}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-xs text-muted">분야</span>
            <span class="text-sm text-body">{{ category ? categoryLabel(category) : '—' }}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-xs text-muted">문제 항목</span>
            <span class="text-sm text-body">{{ effectiveProblemItem || '—' }}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-xs text-muted">문제 상태</span>
            <BaseBadge :tone="state === 'repair_needed' ? 'brand' : 'neutral'">
              {{ stateLabel(state) }}
            </BaseBadge>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-xs text-muted">위치</span>
            <span class="text-sm text-body">{{ location || '—' }}</span>
          </div>
          <div class="py-2 last:pb-0">
            <span class="text-xs text-muted block mb-1">증상 설명</span>
            <p class="text-sm text-body whitespace-pre-wrap">{{ description || '—' }}</p>
          </div>
        </div>
      </BaseCard>

      <!-- Observation summary card -->
      <BaseCard title="현장 확인 항목" :bordered="true">
        <div class="flex flex-col divide-y divide-hair">
          <div
            v-for="(obs, idx) in observationRows"
            :key="idx"
            class="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
          >
            <span class="text-sm text-body flex-1 min-w-0">{{ obs.observationKey || '(이름 없음)' }}</span>
            <BaseBadge :tone="obsBadgeTone(obs.value)">
              {{ obsValueLabel(obs.value) }}
            </BaseBadge>
          </div>
        </div>
      </BaseCard>

      <!-- Validation hint -->
      <AlertMessage v-if="validationHint" tone="info">
        {{ validationHint }}
      </AlertMessage>
    </div>

    <!-- ═══════════════════════════════════
         Step 2 — AI 도우미 · 최종 의견 · 제출
    ════════════════════════════════════ -->
    <div v-else-if="currentStep === 2" class="flex flex-col gap-4">
      <!-- Submit success message -->
      <AlertMessage v-if="submittedMsg" tone="success">
        {{ submittedMsg }}
      </AlertMessage>
      <!-- Submit error -->
      <AlertMessage v-if="submitError" tone="warning" :dismissible="true" @close="submitError = ''">
        {{ submitError }}
      </AlertMessage>

      <!-- 사진 첨부 (above AI panel per 사진 첨부 → 의견 → 제출 order) -->
      <BaseCard title="사진 첨부" :bordered="true">
        <PhotoManager
          v-model="images"
          :max="20"
          :readonly="inspection.status === 'reported'"
        />
      </BaseCard>

      <AiOpinionPanel
        :inspection-id="inspection.id"
        :context="aiContext"
        v-model="finalOpinion"
        :readonly="inspection.status === 'reported'"
      />
    </div>

    <!-- 작성 중단 확인 -->
    <ConfirmDialog
      :open="showLeaveConfirm"
      title="리포트 작성을 중단하고 메인페이지로 돌아가시겠습니까?"
      :lines="[
        '리포트 작성 내용은 저장되지 않습니다.',
        '저장을 원하신다면 임시 저장을 해주세요.',
      ]"
      confirm-label="작성 중단"
      cancel-label="취소"
      @confirm="confirmLeave"
      @cancel="showLeaveConfirm = false"
    />

    <!-- ── Footer actions ── -->
    <template #footer>
      <!-- Step 0 footer -->
      <div v-if="currentStep === 0">
        <BaseButton variant="primary" :block="true" @click="goToReview">
          다음
        </BaseButton>
      </div>

      <!-- Step 1 footer -->
      <div v-else-if="currentStep === 1" class="flex flex-col gap-2">
        <BaseButton variant="primary" :block="true" @click="currentStep = 2">
          다음
        </BaseButton>
        <BaseButton variant="secondary" :block="true" :disabled="saving" @click="currentStep = 0">
          이전
        </BaseButton>
      </div>

      <!-- Step 2 footer -->
      <div v-else-if="currentStep === 2" class="flex flex-col gap-2">
        <!-- 점검 제출 -->
        <BaseButton
          v-if="inspection.status !== 'reported'"
          variant="primary"
          :block="true"
          :disabled="submitting || saving || !canSave"
          @click="submitInspection"
        >
          {{ submitting ? '제출 중...' : '점검 제출' }}
        </BaseButton>
        <!-- 임시 저장 -->
        <BaseButton
          v-if="inspection.status !== 'reported'"
          variant="secondary"
          :block="true"
          :disabled="submitting || saving || !canSave"
          @click="saveIssue"
        >
          {{ saving ? '저장 중...' : '임시 저장' }}
        </BaseButton>
        <BaseButton variant="secondary" :block="true" :disabled="submitting || saving" @click="currentStep = 1">
          이전
        </BaseButton>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout      from '../../components/ui/AppLayout.vue'
import PageHeader     from '../../components/ui/PageHeader.vue'
import BaseButton     from '../../components/ui/BaseButton.vue'
import BaseCard       from '../../components/ui/BaseCard.vue'
import BaseBadge      from '../../components/ui/BaseBadge.vue'
import FormField      from '../../components/ui/FormField.vue'
import StepIndicator  from '../../components/ui/StepIndicator.vue'
import AlertMessage   from '../../components/ui/AlertMessage.vue'
import AiOpinionPanel from '../../components/inspection/AiOpinionPanel.vue'
import PhotoManager   from '../../components/inspection/PhotoManager.vue'
import ConfirmDialog  from '../../components/ui/ConfirmDialog.vue'
import { api }        from '../../api/client.js'
import { showToast }  from '../../lib/toast.js'
import { labelOf }    from '../../constants/inspectionTypes.js'
import {
  PROBLEM_FIELDS,
  DEFAULT_OBSERVATIONS,
  OBSERVATION_VALUES,
  ISSUE_STATES,
  categoryLabel,
  problemItemsFor,
} from '../../constants/inspectionFields.js'

// ── Props / emits ──
const props = defineProps({
  inspection: { type: Object, required: true },
})
const emit = defineEmits(['saved'])

const router = useRouter()

// ── Constants ──
const STEPS = ['문제 정보 + 현장 확인', '검토', 'AI · 최종 의견']

// ── Problem info state ──
const category       = ref('')
const problemItem    = ref('')
const useCustomItem  = ref(false)
const customItemText = ref('')
const state          = ref('caution')
const location       = ref('')
const description    = ref('')
const finalOpinion   = ref('')
const images         = ref([])

// ── Observation rows ──
// Each row: { observationKey: string, value: 'present'|'absent'|'need_check', isCustom: boolean }
const observationRows = ref([])

// ── UI state ──
const currentStep  = ref(0)
const saving       = ref(false)
const submitting   = ref(false)
const saveMsg      = ref('')
const saveMsgTone  = ref('success')
const submittedMsg = ref('')
const submitError  = ref('')
const showLeaveConfirm = ref(false)

// ── Per-field validation errors (issue 4) ──
const categoryError    = ref('')
const problemItemError = ref('')
const locationError    = ref('')
const descriptionError = ref('')

// ── Back navigation with unsaved-changes guard (issue 6) ──
function onBack() {
  if (props.inspection.status === 'reported') {
    router.push('/contractor')
    return
  }
  showLeaveConfirm.value = true
}
function confirmLeave() {
  showLeaveConfirm.value = false
  router.push('/contractor')
}

// ── Step 0 → 1 validation (issue 4): 위치/증상 필수 + 최소 글자수 ──
function goToReview() {
  categoryError.value    = ''
  problemItemError.value = ''
  locationError.value    = ''
  descriptionError.value = ''

  let ok = true
  if (!category.value) {
    categoryError.value = '분야를 선택해 주세요.'
    ok = false
  }
  if (!effectiveProblemItem.value || !effectiveProblemItem.value.trim()) {
    problemItemError.value = '문제 항목을 선택하거나 입력해 주세요.'
    ok = false
  }
  if (location.value.trim().length < 2) {
    locationError.value = '위치를 입력해 주세요.'
    ok = false
  }
  if (description.value.trim().length < 5) {
    descriptionError.value = '증상 설명을 5자 이상 입력해 주세요.'
    ok = false
  }
  if (ok) currentStep.value = 1
}

// ── Computed ──
const headerSubtitle = computed(() => {
  const type = labelOf(props.inspection.inspectionType)
  const unit = props.inspection.unit?.unitLabel ?? ''
  return unit ? `${type} · ${unit}` : type
})

const currentCategoryItems = computed(() => problemItemsFor(category.value))

// Effective problemItem value (custom or select)
const effectiveProblemItem = computed(() => {
  if (useCustomItem.value) return customItemText.value
  if (problemItem.value === '__custom__') return customItemText.value
  return problemItem.value
})

const canSave = computed(() => !!category.value && !!effectiveProblemItem.value)

const validationHint = computed(() => {
  if (!category.value) return '분야를 선택해 주세요.'
  if (!effectiveProblemItem.value) return '문제 항목을 선택하거나 입력해 주세요.'
  if (!location.value) return '위치를 입력해 주세요.'
  if (!description.value) return '증상 설명을 입력해 주세요.'
  return ''
})

const aiContext = computed(() => ({
  inspectionType: props.inspection.inspectionType,
  flow:           'issue',
  category:       category.value,
  problemItem:    effectiveProblemItem.value,
  location:       location.value,
  description:    description.value,
  observations:   observationRows.value.map((o) => ({
    observationKey: o.observationKey,
    value:          o.value,
  })),
  photoCount: images.value.length,
}))

// ── Helpers ──
function stateLabel(value) {
  return ISSUE_STATES.find((s) => s.value === value)?.label ?? value
}

function obsValueLabel(value) {
  return OBSERVATION_VALUES.find((v) => v.value === value)?.label ?? value
}

function obsBadgeTone(value) {
  if (value === 'present') return 'brand'
  if (value === 'absent') return 'subtle'
  return 'neutral'
}

// ── Category selection ──
function selectCategory(cat) {
  if (props.inspection.status === 'reported') return
  category.value    = cat
  problemItem.value = ''
  useCustomItem.value  = false
  customItemText.value = ''
}

// ── Custom item handling ──
watch(problemItem, (val) => {
  if (val === '__custom__') {
    useCustomItem.value = true
    customItemText.value = ''
  }
})

function cancelCustomItem() {
  useCustomItem.value  = false
  customItemText.value = ''
  problemItem.value    = ''
}

// ── Add custom observation row ──
function addCustomObservation() {
  observationRows.value.push({ observationKey: '', value: 'need_check', isCustom: true })
}

// ── Hydration from inspection prop ──
function hydrateFromInspection(insp) {
  // Hydrate problem info from first item
  const firstItem = insp.items?.[0]
  if (firstItem) {
    category.value    = firstItem.category    ?? ''
    problemItem.value = firstItem.problemItem ?? ''
    state.value       = firstItem.state       ?? 'caution'
    location.value    = firstItem.location    ?? ''
    description.value = firstItem.description ?? ''
    useCustomItem.value  = false
    customItemText.value = ''
  } else {
    category.value       = ''
    problemItem.value    = ''
    state.value          = 'caution'
    location.value       = ''
    description.value    = ''
    useCustomItem.value  = false
    customItemText.value = ''
  }

  // Hydrate observation rows:
  // 1. Start from DEFAULT_OBSERVATIONS, each with need_check
  // 2. Overlay with saved observations by matching observationKey
  // 3. Append saved observations whose key isn't in defaults
  const rows = DEFAULT_OBSERVATIONS.map((key) => ({
    observationKey: key,
    value: 'need_check',
    isCustom: false,
  }))

  const savedObs = insp.observations ?? []
  const defaultKeySet = new Set(DEFAULT_OBSERVATIONS)

  for (const saved of savedObs) {
    const existing = rows.find((r) => r.observationKey === saved.observationKey)
    if (existing) {
      existing.value = saved.value ?? 'need_check'
    } else {
      // Saved obs whose key isn't in defaults — append as custom
      rows.push({
        observationKey: saved.observationKey,
        value: saved.value ?? 'need_check',
        isCustom: !defaultKeySet.has(saved.observationKey),
      })
    }
  }

  observationRows.value = rows
}

// ── Build PATCH payload (shared between save and submit) ──
function buildPatchPayload() {
  const itemPayload = {
    category:    category.value              || null,
    problemItem: effectiveProblemItem.value  || null,
    state:       state.value                 || null,
    location:    location.value              || null,
    description: description.value           || null,
    space:       null,
    detailItem:  null,
  }

  const obsPayload = observationRows.value
    .filter((o) => o.observationKey.trim() !== '')
    .map((o) => ({
      observationKey:   o.observationKey,
      value:            o.value,
      note:             null,
      // CRITICAL: set to null — PATCH re-creates items with new IDs;
      // any old item id reference would violate the FK and cause 500.
      inspectionItemId: null,
    }))

  return {
    items:        [itemPayload],
    observations: obsPayload,
    finalOpinion: finalOpinion.value,
    images: images.value.map((im) => ({
      base64Data:        im.base64Data,
      mimeType:          im.mimeType,
      photoType:         im.photoType,
      caption:           im.caption,
      sizeBytes:         im.sizeBytes,
      inspectionItemId:  null,
    })),
  }
}

// ── Save (임시 저장) ──
async function saveIssue() {
  saving.value  = true
  saveMsg.value = ''
  try {
    await api.patch('/inspections/' + props.inspection.id, buildPatchPayload())
    // 임시 저장 → 메인 복귀 + toast (issue 5)
    showToast('점검 내용이 임시 저장되었습니다.')
    router.push('/contractor')
  } catch (err) {
    saveMsgTone.value = 'warning'
    saveMsg.value     = err.message || '저장에 실패했습니다. 다시 시도해 주세요.'
  } finally {
    saving.value = false
  }
}

// ── Submit: save-then-submit ──
async function submitInspection() {
  submitting.value   = true
  submitError.value  = ''
  submittedMsg.value = ''
  try {
    // 1. Persist items + observations + finalOpinion so snapshot is current
    await api.patch('/inspections/' + props.inspection.id, buildPatchPayload())
    // 2. Submit — server generates report snapshot from current DB state
    const r = await api.post('/inspections/' + props.inspection.id + '/submit', {})
    // 제출 성공 → 메인 복귀 + toast (issue 3)
    showToast('점검 리포트가 정상적으로 제출되었습니다. (등급 ' + r.grade + ')')
    router.push('/contractor')
  } catch (err) {
    submitError.value = err.message || '제출에 실패했습니다. 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}

// ── Re-hydrate when inspection prop changes (after parent reload) ──
watch(
  () => props.inspection,
  (insp) => {
    if (insp) {
      hydrateFromInspection(insp)
      finalOpinion.value = insp.finalOpinion ?? ''
      images.value = (insp.images ?? []).map((img) => ({
        base64Data: img.base64Data ?? '',
        mimeType:   img.mimeType   ?? 'image/jpeg',
        photoType:  img.photoType  ?? 'overview',
        caption:    img.caption    ?? '',
        sizeBytes:  img.sizeBytes  ?? 0,
      }))
    }
  },
  { immediate: true },
)
</script>
