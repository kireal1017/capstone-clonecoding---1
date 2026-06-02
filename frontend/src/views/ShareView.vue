<template>
  <AppLayout>
    <template #header>
      <PageHeader
        title="점검 리포트"
        subtitle="공유 링크"
        :hasBack="true"
        @back="router.push('/')"
      />
    </template>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6 py-4">
      <div v-for="n in 4" :key="n" class="animate-pulse">
        <div class="h-3 bg-hair rounded w-1/4 mb-3"></div>
        <div class="h-3 bg-hair rounded w-full mb-2"></div>
        <div class="h-3 bg-hair rounded w-3/4"></div>
      </div>
    </div>

    <!-- Error / not found -->
    <EmptyState
      v-else-if="loadError"
      title="공유 링크를 찾을 수 없습니다"
      description="링크가 잘못되었거나 만료되었을 수 있습니다."
    />

    <!-- Document -->
    <template v-else-if="report">
      <ReportDocument
        :snapshot="report.snapshot"
        :confirmations="report.confirmations"
      />
    </template>

    <!-- Footer: view + print only — NO confirm / edit / delete / opinion -->
    <template #footer>
      <div v-if="report && !loading && !loadError" class="no-print flex flex-col gap-2">
        <PrintButton />
        <p class="text-xs text-muted text-center">공유 링크는 조회와 PDF 저장만 가능합니다.</p>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout      from '../components/ui/AppLayout.vue'
import PageHeader     from '../components/ui/PageHeader.vue'
import EmptyState     from '../components/ui/EmptyState.vue'
import PrintButton    from '../components/ui/PrintButton.vue'
import ReportDocument from '../components/inspection/ReportDocument.vue'

import { api } from '../api/client.js'

const route  = useRoute()
const router = useRouter()

const report    = ref(null)
const loading   = ref(true)
const loadError = ref(null)

onMounted(async () => {
  loading.value   = true
  loadError.value = null
  try {
    const data = await api.get(`/share/${route.params.token}`)
    report.value = data.report ?? data
  } catch (e) {
    loadError.value = e.message || '공유 링크를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>
