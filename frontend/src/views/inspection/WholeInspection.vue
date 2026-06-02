<template>
  <AppLayout>
    <!-- ── Header ── -->
    <template #header>
      <PageHeader
        title="전체 점검"
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
      <StepIndicator
        :steps="STEPS"
        :current="currentStep"
      />
    </div>

    <!-- ═══════════════════════════════════
         Step 0 — 공간별 빠른 확인
    ════════════════════════════════════ -->
    <div v-if="currentStep === 0" class="flex flex-col gap-4">
      <!-- Running count summary -->
      <div class="flex items-center gap-2 flex-wrap">
        <BaseBadge tone="subtle">정상 {{ stateCounts.normal }}</BaseBadge>
        <BaseBadge tone="neutral">주의 {{ stateCounts.caution }}</BaseBadge>
        <BaseBadge tone="brand">수리 필요 {{ stateCounts.repair_needed }}</BaseBadge>
      </div>

      <!-- One card per space -->
      <BaseCard
        v-for="space in WHOLE_SPACES"
        :key="space.key"
        :title="space.label"
        :bordered="true"
      >
        <div class="flex flex-col divide-y divide-hair">
          <div
            v-for="detailItem in space.items"
            :key="detailItem"
            class="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
          >
            <!-- Item name -->
            <span class="text-sm text-body shrink-0 min-w-0 flex-1">{{ detailItem }}</span>

            <!-- Tri-state segmented control -->
            <div
              class="flex items-stretch border border-hair rounded overflow-hidden shrink-0"
              role="group"
              :aria-label="detailItem + ' 상태 선택'"
            >
              <button
                v-for="s in STATES"
                :key="s.value"
                type="button"
                :disabled="inspection.status === 'reported'"
                :class="[
                  'px-2 h-9 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-offset-0',
                  getItemState(space.label, detailItem) === s.value
                    ? stateActiveClass(s.value)
                    : 'bg-white text-muted hover:bg-surface',
                  inspection.status === 'reported' ? 'cursor-default' : 'cursor-pointer',
                  s.value !== 'normal' ? 'border-l border-hair' : '',
                ]"
                :aria-pressed="getItemState(space.label, detailItem) === s.value"
                @click="setItemState(space.label, detailItem, s.value)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- ═══════════════════════════════════
         Step 1 — 이상 항목 상세
    ════════════════════════════════════ -->
    <div v-else-if="currentStep === 1" class="flex flex-col gap-4">
      <!-- Hint for missing detail -->
      <AlertMessage v-if="hasMissingDetail && inspection.status !== 'reported'" tone="info">
        위치나 설명이 비어 있는 항목이 있습니다. 가능한 한 채워 주세요.
      </AlertMessage>

      <!-- Empty state: all normal -->
      <EmptyState
        v-if="!abnormalItems.length"
        title="주의/수리 필요 항목이 없습니다"
        description="모든 항목이 정상입니다."
      >
        <template #icon>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="14" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 20l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </template>
      </EmptyState>

      <!-- One card per abnormal item -->
      <BaseCard
        v-for="item in abnormalItems"
        :key="item.space + '-' + item.detailItem"
        :bordered="true"
      >
        <!-- Card title row: space · detailItem + state badge -->
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex flex-col min-w-0">
            <span class="text-xs text-muted">{{ item.space }}</span>
            <span class="text-sm font-medium text-ink">{{ item.detailItem }}</span>
          </div>
          <BaseBadge :tone="item.state === 'repair_needed' ? 'brand' : 'neutral'">
            {{ stateLabel(item.state) }}
          </BaseBadge>
        </div>

        <!-- Detail fields -->
        <div class="flex flex-col gap-3">
          <FormField
            label="위치"
            :required="true"
            :hint="item.location ? '' : '예: 북쪽 벽 하단'"
          >
            <input
              v-model="item.location"
              type="text"
              :disabled="inspection.status === 'reported'"
              placeholder="예: 북쪽 벽 하단"
              class="w-full h-10 px-3 rounded border border-hair bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors disabled:bg-surface disabled:text-muted"
              :aria-label="item.detailItem + ' 위치'"
            />
          </FormField>

          <FormField
            label="상태 설명"
            :required="true"
            :hint="item.description ? '' : '이상 상태를 간략히 기술해 주세요'"
          >
            <textarea
              v-model="item.description"
              :disabled="inspection.status === 'reported'"
              rows="2"
              placeholder="이상 상태를 간략히 기술해 주세요"
              class="w-full px-3 py-2 rounded border border-hair bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors resize-none disabled:bg-surface disabled:text-muted"
              :aria-label="item.detailItem + ' 상태 설명'"
            />
          </FormField>
        </div>
      </BaseCard>
    </div>

    <!-- ═══════════════════════════════════
         Step 2 — 검토 + 저장
    ════════════════════════════════════ -->
    <div v-else-if="currentStep === 2" class="flex flex-col gap-4">
      <!-- Summary card -->
      <BaseCard title="점검 요약" :bordered="true">
        <div class="flex flex-col divide-y divide-hair">
          <div class="flex items-center justify-between py-2 first:pt-0">
            <span class="text-xs text-muted">점검 유형</span>
            <span class="text-sm font-medium text-ink">{{ labelOf(inspection.inspectionType) }}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-xs text-muted">진행 방식</span>
            <span class="text-sm text-body">{{ flowLabel(inspection.flow) }}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-xs text-muted">점검 공간</span>
            <span class="text-sm text-body">{{ WHOLE_SPACES.length }}개 공간</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-xs text-muted">정상</span>
            <BaseBadge tone="subtle">{{ stateCounts.normal }}개</BaseBadge>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-xs text-muted">주의</span>
            <BaseBadge tone="neutral">{{ stateCounts.caution }}개</BaseBadge>
          </div>
          <div class="flex items-center justify-between py-2 last:pb-0">
            <span class="text-xs text-muted">수리 필요</span>
            <BaseBadge tone="brand">{{ stateCounts.repair_needed }}개</BaseBadge>
          </div>
        </div>
      </BaseCard>

      <!-- Abnormal items list -->
      <BaseCard
        v-if="abnormalItems.length"
        title="이상 항목 목록"
        :bordered="true"
      >
        <div class="flex flex-col divide-y divide-hair">
          <div
            v-for="item in abnormalItems"
            :key="item.space + '-' + item.detailItem"
            class="py-2 first:pt-0 last:pb-0"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <span class="text-xs text-muted">{{ item.space }}</span>
                <span class="mx-1 text-xs text-ph">·</span>
                <span class="text-xs text-body">{{ item.detailItem }}</span>
              </div>
              <BaseBadge :tone="item.state === 'repair_needed' ? 'brand' : 'neutral'">
                {{ stateLabel(item.state) }}
              </BaseBadge>
            </div>
            <div v-if="item.location || item.description" class="mt-1 flex flex-col gap-0.5">
              <p v-if="item.location" class="text-xs text-muted">위치: {{ item.location }}</p>
              <p v-if="item.description" class="text-xs text-muted truncate">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <EmptyState
        v-else
        title="이상 항목 없음"
        description="모든 항목이 정상으로 기록되었습니다."
      >
        <template #icon>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="14" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 20l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </template>
      </EmptyState>
    </div>

    <!-- ═══════════════════════════════════
         Step 3 — AI 도우미 · 최종 의견 · 제출
    ════════════════════════════════════ -->
    <div v-else-if="currentStep === 3" class="flex flex-col gap-4">
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
        <BaseButton variant="primary" :block="true" @click="currentStep = 1">
          다음
        </BaseButton>
      </div>

      <!-- Step 1 footer -->
      <div v-else-if="currentStep === 1" class="flex flex-col gap-2">
        <BaseButton variant="primary" :block="true" @click="currentStep = 2">
          다음
        </BaseButton>
        <BaseButton variant="secondary" :block="true" @click="currentStep = 0">
          이전
        </BaseButton>
      </div>

      <!-- Step 2 footer -->
      <div v-else-if="currentStep === 2" class="flex flex-col gap-2">
        <BaseButton variant="primary" :block="true" @click="currentStep = 3">
          다음
        </BaseButton>
        <BaseButton variant="secondary" :block="true" @click="currentStep = 1">
          이전
        </BaseButton>
      </div>

      <!-- Step 3 footer -->
      <div v-else-if="currentStep === 3" class="flex flex-col gap-2">
        <!-- 점검 제출 -->
        <BaseButton
          v-if="inspection.status !== 'reported'"
          variant="primary"
          :block="true"
          :disabled="submitting || saving"
          @click="submitInspection"
        >
          {{ submitting ? '제출 중...' : '점검 제출' }}
        </BaseButton>
        <!-- 임시 저장 -->
        <BaseButton
          v-if="inspection.status !== 'reported'"
          variant="secondary"
          :block="true"
          :disabled="submitting || saving"
          @click="saveInspection"
        >
          {{ saving ? '저장 중...' : '임시 저장' }}
        </BaseButton>
        <BaseButton variant="secondary" :block="true" :disabled="submitting || saving" @click="currentStep = 2">
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
import EmptyState     from '../../components/ui/EmptyState.vue'
import AlertMessage   from '../../components/ui/AlertMessage.vue'
import AiOpinionPanel from '../../components/inspection/AiOpinionPanel.vue'
import PhotoManager   from '../../components/inspection/PhotoManager.vue'
import ConfirmDialog  from '../../components/ui/ConfirmDialog.vue'
import { api }        from '../../api/client.js'
import { showToast }  from '../../lib/toast.js'
import { labelOf, flowLabel } from '../../constants/inspectionTypes.js'
import { WHOLE_SPACES, STATES, buildDefaultItems } from '../../constants/inspectionSpaces.js'

// ── Props / emits ──
const props = defineProps({
  inspection: { type: Object, required: true },
})
const emit = defineEmits(['saved'])

const router = useRouter()

// ── Constants ──
const STEPS = ['공간별 확인', '이상 항목', '검토', 'AI · 최종 의견']

// ── State ──
const items        = ref([])
const finalOpinion = ref('')
const images       = ref([])
const currentStep  = ref(0)
const saving       = ref(false)
const submitting   = ref(false)
const saveMsg      = ref('')
const saveMsgTone  = ref('success')
const submittedMsg = ref('')
const submitError  = ref('')
const showLeaveConfirm = ref(false)

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

// ── Computed ──
const headerSubtitle = computed(() => {
  const type = labelOf(props.inspection.inspectionType)
  const unit = props.inspection.unit?.unitLabel ?? ''
  return unit ? `${type} · ${unit}` : type
})

const abnormalItems = computed(() =>
  items.value.filter((i) => i.state === 'caution' || i.state === 'repair_needed')
)

const stateCounts = computed(() => ({
  normal:        items.value.filter((i) => i.state === 'normal').length,
  caution:       items.value.filter((i) => i.state === 'caution').length,
  repair_needed: items.value.filter((i) => i.state === 'repair_needed').length,
}))

const hasMissingDetail = computed(() =>
  abnormalItems.value.some((i) => !i.location || !i.description)
)

const aiContext = computed(() => ({
  inspectionType: props.inspection.inspectionType,
  flow: 'whole',
  items: abnormalItems.value.map((i) => ({
    space:       i.space,
    detailItem:  i.detailItem,
    state:       i.state,
    location:    i.location,
    description: i.description,
  })),
  photoCount: images.value.length,
}))

// ── Helpers ──
function stateLabel(value) {
  return STATES.find((s) => s.value === value)?.label ?? value
}

function stateActiveClass(value) {
  switch (value) {
    case 'repair_needed': return 'bg-brand text-white'
    case 'caution':       return 'bg-brand/80 text-white'
    default:              return 'bg-brand text-white'
  }
}

/**
 * Hydrate items from the inspection prop.
 * Strategy:
 *   1. Start from buildDefaultItems() (all 32 template slots, all normal).
 *   2. For each saved item returned by the API, find the matching template slot
 *      by (space, detailItem) and overwrite its state/location/description.
 *   3. Saved items that don't match any template slot are appended so nothing is lost.
 */
function hydrateItems(savedItems) {
  const defaults = buildDefaultItems()

  const keyMap = new Map()
  defaults.forEach((d, idx) => {
    keyMap.set(`${d.space}::${d.detailItem}`, idx)
  })

  const unmatched = []
  for (const saved of (savedItems || [])) {
    const key = `${saved.space}::${saved.detailItem}`
    if (keyMap.has(key)) {
      const idx = keyMap.get(key)
      defaults[idx].state       = saved.state       ?? defaults[idx].state
      defaults[idx].location    = saved.location     ?? ''
      defaults[idx].description = saved.description  ?? ''
      defaults[idx].category    = saved.category     ?? null
      defaults[idx].problemItem = saved.problemItem  ?? null
    } else {
      unmatched.push({
        space:       saved.space,
        detailItem:  saved.detailItem,
        state:       saved.state       ?? 'normal',
        location:    saved.location    ?? '',
        description: saved.description ?? '',
        category:    saved.category    ?? null,
        problemItem: saved.problemItem ?? null,
      })
    }
  }

  items.value = [...defaults, ...unmatched]
}

// ── Item state accessors ──
function findItem(space, detailItem) {
  return items.value.find((i) => i.space === space && i.detailItem === detailItem)
}

function getItemState(space, detailItem) {
  return findItem(space, detailItem)?.state ?? 'normal'
}

function setItemState(space, detailItem, newState) {
  const item = findItem(space, detailItem)
  if (item) item.state = newState
}

// ── Save (also persists finalOpinion) ──
async function saveInspection() {
  saving.value  = true
  saveMsg.value = ''
  try {
    await api.patch('/inspections/' + props.inspection.id, {
      items: items.value.map((i) => ({
        space:       i.space,
        detailItem:  i.detailItem,
        state:       i.state,
        location:    i.location,
        description: i.description,
        category:    i.category,
        problemItem: i.problemItem,
      })),
      finalOpinion: finalOpinion.value,
      images: images.value.map((im) => ({
        base64Data:        im.base64Data,
        mimeType:          im.mimeType,
        photoType:         im.photoType,
        caption:           im.caption,
        sizeBytes:         im.sizeBytes,
        inspectionItemId:  null,
      })),
    })
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
  submitting.value = true
  submitError.value = ''
  submittedMsg.value = ''
  try {
    // 1. Persist items + finalOpinion + images first so snapshot captures the latest data
    await api.patch('/inspections/' + props.inspection.id, {
      items: items.value.map((i) => ({
        space:       i.space,
        detailItem:  i.detailItem,
        state:       i.state,
        location:    i.location,
        description: i.description,
        category:    i.category,
        problemItem: i.problemItem,
      })),
      finalOpinion: finalOpinion.value,
      images: images.value.map((im) => ({
        base64Data:        im.base64Data,
        mimeType:          im.mimeType,
        photoType:         im.photoType,
        caption:           im.caption,
        sizeBytes:         im.sizeBytes,
        inspectionItemId:  null,
      })),
    })
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

// ── Hydrate on prop change (parent reloads after save) ──
watch(
  () => props.inspection,
  (insp) => {
    if (insp) {
      hydrateItems(insp.items)
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
