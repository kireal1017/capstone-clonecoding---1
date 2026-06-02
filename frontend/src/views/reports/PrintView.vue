<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto w-full max-w-3xl px-6 py-4">

      <!-- Action bar (hidden in print) -->
      <div class="no-print flex items-center gap-3 py-4 border-b border-hair mb-2">
        <button
          type="button"
          class="flex items-center justify-center w-8 h-8 rounded text-muted hover:text-ink transition-colors duration-200"
          aria-label="닫기"
          @click="router.back()"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-[20px] font-medium text-ink leading-tight truncate">인쇄 / PDF 저장</h1>
          <p v-if="report" class="text-sm text-muted mt-0.5 truncate">
            {{ snap.unit.label }} · {{ labelOf(report.inspectionType) }}
          </p>
        </div>
        <BaseButton variant="primary" @click="handlePrint">인쇄 / PDF 저장</BaseButton>
        <BaseButton variant="secondary" @click="router.back()">닫기</BaseButton>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-6 py-4">
        <div v-for="n in 4" :key="n" class="animate-pulse">
          <div class="h-3 bg-hair rounded w-1/4 mb-3"></div>
          <div class="h-3 bg-hair rounded w-full mb-2"></div>
          <div class="h-3 bg-hair rounded w-3/4"></div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="py-4 space-y-3">
        <AlertMessage tone="info">{{ loadError }}</AlertMessage>
        <BaseButton variant="secondary" @click="router.back()">뒤로</BaseButton>
      </div>

      <!-- Print document -->
      <div v-else-if="report" class="print-document">
        <!-- Cover line (visible in print) -->
        <div class="print-cover hidden print:block mb-6 pb-4 border-b border-hair">
          <h1 class="text-2xl font-medium text-ink">점검 리포트</h1>
          <p class="text-sm text-muted mt-1">{{ snap.unit.label }} · {{ snap.unit.building.name }}</p>
        </div>

        <ReportDocument
          :snapshot="snap"
          :confirmations="report.confirmations"
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import BaseButton     from '../../components/ui/BaseButton.vue'
import AlertMessage   from '../../components/ui/AlertMessage.vue'
import ReportDocument from '../../components/inspection/ReportDocument.vue'

import { api }     from '../../api/client.js'
import { getRole } from '../../lib/session.js'
import { labelOf } from '../../constants/inspectionTypes.js'

const router = useRouter()
const route  = useRoute()

const report    = ref(null)
const loading   = ref(true)
const loadError = ref(null)

const snap = computed(() => report.value?.snapshot ?? null)

function handlePrint() {
  window.print()
}

onMounted(async () => {
  const r = getRole()
  if (r !== 'owner' && r !== 'tenant') {
    router.replace('/')
    return
  }
  loading.value   = true
  loadError.value = null
  try {
    const data = await api.get(`/reports/${route.params.id}`)
    report.value = data.report ?? data
  } catch (e) {
    if (e.status === 403) {
      loadError.value = '이 리포트에 접근할 권한이 없습니다.'
    } else if (e.status === 404) {
      loadError.value = '리포트를 찾을 수 없습니다.'
    } else {
      loadError.value = e.message || '리포트를 불러오지 못했습니다.'
    }
  } finally {
    loading.value = false
  }
})
</script>

<style>
/* Override the global @page { margin: 0 } for this print view */
@media print {
  @page {
    margin: 16mm;
  }

  /* Ensure the print document container doesn't get clipped */
  .print-document {
    padding: 0;
  }

  /* Show the cover block in print */
  .print-cover {
    display: block !important;
  }
}
</style>
