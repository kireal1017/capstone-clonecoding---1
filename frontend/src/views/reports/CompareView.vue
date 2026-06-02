<template>
  <AppLayout>
    <template #header>
      <PageHeader
        title="리포트 비교"
        subtitle="같은 호실 · 같은 점검 유형 (수리 전↔후 예외)"
        :hasBack="true"
        @back="router.push('/owner/reports')"
      />
    </template>

    <!-- Loading reports for selects -->
    <div v-if="listLoading" class="space-y-4 py-4">
      <div class="animate-pulse h-10 bg-hair rounded"></div>
      <div class="animate-pulse h-10 bg-hair rounded"></div>
    </div>

    <!-- Error loading report list -->
    <div v-else-if="listError" class="py-4 space-y-3">
      <AlertMessage tone="info" dismissible @close="listError = null">{{ listError }}</AlertMessage>
      <BaseButton variant="secondary" @click="loadList">다시 시도</BaseButton>
    </div>

    <template v-else>
      <!-- Selector form -->
      <div class="py-4 space-y-4">
        <FormField label="이전 리포트">
          <select
            v-model="leftId"
            class="w-full text-sm text-body border border-hair rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand"
            aria-label="이전 리포트 선택"
          >
            <option value="" disabled>리포트를 선택하세요</option>
            <option
              v-for="r in reports"
              :key="r.id"
              :value="r.id"
            >
              {{ reportOptionLabel(r) }}
            </option>
          </select>
        </FormField>

        <FormField label="현재 리포트">
          <select
            v-model="rightId"
            class="w-full text-sm text-body border border-hair rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand"
            aria-label="현재 리포트 선택"
          >
            <option value="" disabled>리포트를 선택하세요</option>
            <option
              v-for="r in reports"
              :key="r.id"
              :value="r.id"
            >
              {{ reportOptionLabel(r) }}
            </option>
          </select>
        </FormField>

        <BaseButton
          variant="primary"
          block
          :disabled="!canCompare || compareLoading"
          @click="doCompare"
        >
          {{ compareLoading ? '비교 중...' : '비교하기' }}
        </BaseButton>
      </div>

      <!-- Compare error (mismatch / 4xx) -->
      <div v-if="compareError" class="mb-4">
        <AlertMessage tone="warning" dismissible @close="compareError = null">
          {{ compareError }}
        </AlertMessage>
      </div>

      <!-- Compare result -->
      <template v-if="compareResult">
        <!-- Validation summary -->
        <div class="mb-4 p-3 bg-surface rounded border border-hair space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-medium text-ink">{{ compareResult.compareMeta.unit.label }}</span>
            <span class="text-xs text-muted">{{ compareResult.compareMeta.unit.building?.name }}</span>
            <BaseBadge
              v-if="compareResult.compareMeta.repairExceptionApplied"
              tone="brand"
            >
              수리 전↔후 예외 비교
            </BaseBadge>
            <BaseBadge
              v-else-if="compareResult.validation.sameType"
              tone="subtle"
            >
              같은 점검 유형
            </BaseBadge>
          </div>
          <div class="flex items-center gap-4 text-xs text-muted">
            <span>
              이전:
              #{{ compareResult.compareMeta.leftReport.id }} ·
              {{ labelOf(compareResult.compareMeta.leftReport.inspectionType) }} ·
              {{ compareResult.compareMeta.leftReport.grade }}등급 ·
              {{ formatDate(compareResult.compareMeta.leftReport.createdAt) }}
            </span>
            <span>→</span>
            <span>
              현재:
              #{{ compareResult.compareMeta.rightReport.id }} ·
              {{ labelOf(compareResult.compareMeta.rightReport.inspectionType) }} ·
              {{ compareResult.compareMeta.rightReport.grade }}등급 ·
              {{ formatDate(compareResult.compareMeta.rightReport.createdAt) }}
            </span>
          </div>
        </div>

        <!-- Side-by-side documents -->
        <div class="compare-grid md:grid md:grid-cols-2 gap-6 space-y-6 md:space-y-0">
          <!-- Left snapshot -->
          <div class="border border-hair rounded overflow-hidden">
            <div class="px-4 py-3 bg-surface border-b border-hair">
              <p class="text-xs font-medium text-ink">
                이전 리포트 #{{ compareResult.compareMeta.leftReport.id }} · {{ labelOf(compareResult.compareMeta.leftReport.inspectionType) }}
              </p>
              <p class="text-xs text-muted">
                {{ compareResult.compareMeta.leftReport.grade }}등급 ·
                {{ formatDate(compareResult.compareMeta.leftReport.createdAt) }}
              </p>
            </div>
            <div class="px-4">
              <ReportDocument
                :snapshot="compareResult.left"
                :confirmations="[]"
              />
            </div>
          </div>

          <!-- Right snapshot -->
          <div class="border border-hair rounded overflow-hidden">
            <div class="px-4 py-3 bg-surface border-b border-hair">
              <p class="text-xs font-medium text-ink">
                현재 리포트 #{{ compareResult.compareMeta.rightReport.id }} · {{ labelOf(compareResult.compareMeta.rightReport.inspectionType) }}
              </p>
              <p class="text-xs text-muted">
                {{ compareResult.compareMeta.rightReport.grade }}등급 ·
                {{ formatDate(compareResult.compareMeta.rightReport.createdAt) }}
              </p>
            </div>
            <div class="px-4">
              <ReportDocument
                :snapshot="compareResult.right"
                :confirmations="[]"
              />
            </div>
          </div>
        </div>

        <!-- Print comparison -->
        <div class="no-print flex justify-end mt-4">
          <PrintButton />
        </div>
      </template>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout      from '../../components/ui/AppLayout.vue'
import PageHeader     from '../../components/ui/PageHeader.vue'
import BaseButton     from '../../components/ui/BaseButton.vue'
import BaseBadge      from '../../components/ui/BaseBadge.vue'
import AlertMessage   from '../../components/ui/AlertMessage.vue'
import FormField      from '../../components/ui/FormField.vue'
import PrintButton    from '../../components/ui/PrintButton.vue'
import ReportDocument from '../../components/inspection/ReportDocument.vue'

import { api }     from '../../api/client.js'
import { getRole } from '../../lib/session.js'
import { labelOf } from '../../constants/inspectionTypes.js'

const router = useRouter()

const reports        = ref([])
const listLoading    = ref(true)
const listError      = ref(null)
const leftId         = ref('')
const rightId        = ref('')
const compareLoading = ref(false)
const compareError   = ref(null)
const compareResult  = ref(null)

const canCompare = computed(
  () => leftId.value && rightId.value && leftId.value !== rightId.value
)

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function reportOptionLabel(r) {
  // Include #id so same-호실·유형·등급·날짜 리포트(데모 시 흔함)를 구분할 수 있게 한다.
  return `#${r.id} · ${r.unit.label} · ${labelOf(r.inspectionType)} · ${r.grade}등급 · ${formatDate(r.createdAt)}`
}

// 백엔드가 영어 메시지를 반환해도 화면에는 한국어로 표시한다 (issue 7).
function translateCompareError(msg) {
  const m = (msg || '').toLowerCase()
  if (m.includes('same unit') || m.includes('belong to the same unit')) {
    return '같은 호실의 리포트만 비교할 수 있습니다.'
  }
  if (m.includes('inspection type')) {
    return '같은 점검 유형의 리포트만 비교할 수 있습니다. (수리 전 ↔ 수리 후는 예외)'
  }
  if (m.includes('itself') || m.includes('required') || m.includes('selection')) {
    return '서로 다른 리포트 2개를 선택해 주세요.'
  }
  if (m.includes('not found')) {
    return '선택한 리포트를 찾을 수 없습니다.'
  }
  if (m.includes('access') || m.includes('forbidden') || m.includes('permission')) {
    return '해당 리포트에 접근할 수 없습니다.'
  }
  return '비교할 수 없는 조합입니다. 같은 호실·같은 점검 유형 리포트 2개를 선택해 주세요.'
}

async function loadList() {
  listLoading.value = true
  listError.value   = null
  try {
    const data = await api.get('/reports')
    reports.value = data.reports ?? data ?? []
  } catch (e) {
    listError.value = e.message || '리포트 목록을 불러오지 못했습니다.'
  } finally {
    listLoading.value = false
  }
}

async function doCompare() {
  if (!canCompare.value || compareLoading.value) return
  compareLoading.value = true
  compareError.value   = null
  compareResult.value  = null
  try {
    const data = await api.get(`/reports/compare?leftId=${leftId.value}&rightId=${rightId.value}`)
    compareResult.value = data
  } catch (e) {
    compareError.value = translateCompareError(e.message)
  } finally {
    compareLoading.value = false
  }
}

onMounted(() => {
  const r = getRole()
  if (r !== 'owner') {
    router.replace('/')
    return
  }
  loadList()
})
</script>

<style scoped>
/*
 * 인쇄/PDF 저장 시 두 리포트를 화면처럼 좌우 2열로 유지한다 (issue 7).
 * 인쇄 미디어 폭이 좁아 md: 브레이크포인트가 적용되지 않는 환경에서도
 * 강제로 2열을 유지한다. 두 리포트 전체가 한 페이지에 다 들어가지 않으면
 * 페이지가 넘어갈 수 있으나, 좌우 배치(요약·기본정보)는 유지된다.
 */
@media print {
  .compare-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }
  .compare-grid > * {
    break-inside: avoid;
  }
}
</style>
