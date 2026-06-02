<template>
  <AppLayout>
    <template #header>
      <PageHeader
        :title="'리포트'"
        :subtitle="role === 'owner' ? '임대인 · 보유 호실 리포트' : '임차인 · 내 호실 리포트'"
      >
        <template #actions>
          <BaseButton
            v-if="role === 'owner'"
            variant="secondary"
            @click="router.push('/owner/compare')"
          >리포트 비교</BaseButton>
          <BaseButton variant="ghost" @click="router.push('/')">사용자 전환</BaseButton>
        </template>
      </PageHeader>
    </template>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3 py-2">
      <div
        v-for="n in 3"
        :key="n"
        class="bg-surface rounded-card p-4 border border-hair animate-pulse"
      >
        <div class="h-4 bg-hair rounded w-1/3 mb-2"></div>
        <div class="h-3 bg-hair rounded w-1/2 mb-3"></div>
        <div class="h-3 bg-hair rounded w-1/4"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-4 space-y-3">
      <AlertMessage tone="info" dismissible @close="error = null">
        {{ error }}
      </AlertMessage>
      <BaseButton variant="secondary" @click="load">다시 시도</BaseButton>
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="reports.length === 0"
      title="표시할 리포트가 없습니다"
      description="점검이 제출되면 리포트가 자동으로 생성됩니다."
    />

    <!-- List -->
    <div v-else class="space-y-3 py-2">
      <div
        v-for="report in reports"
        :key="report.id"
        class="bg-white border border-hair rounded-card p-4 cursor-pointer hover:border-ph transition-colors duration-200"
        role="button"
        tabindex="0"
        :aria-label="`${report.unit?.label} 리포트 상세 보기`"
        @click="goDetail(report.id)"
        @keydown.enter="goDetail(report.id)"
        @keydown.space.prevent="goDetail(report.id)"
      >
        <!-- Top row: unit label + grade badge -->
        <div class="flex items-start justify-between gap-2 mb-1">
          <div class="min-w-0">
            <p class="text-sm font-medium text-ink truncate">{{ report.unit?.label }}</p>
            <p class="text-xs text-muted truncate">{{ report.unit?.building?.name }}</p>
          </div>
          <StatusTag :status="report.grade" class="shrink-0 mt-0.5" />
        </div>

        <!-- Bottom row: inspection type + date -->
        <div class="flex items-center justify-between gap-2 mt-2">
          <span class="text-xs text-body">{{ labelOf(report.inspectionType) }}</span>
          <span class="text-xs text-muted">{{ formatDate(report.createdAt) }}</span>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout   from '../../components/ui/AppLayout.vue'
import PageHeader  from '../../components/ui/PageHeader.vue'
import BaseButton  from '../../components/ui/BaseButton.vue'
import BaseCard    from '../../components/ui/BaseCard.vue'
import StatusTag   from '../../components/ui/StatusTag.vue'
import EmptyState  from '../../components/ui/EmptyState.vue'
import AlertMessage from '../../components/ui/AlertMessage.vue'

import { api } from '../../api/client.js'
import { getRole } from '../../lib/session.js'
import { labelOf } from '../../constants/inspectionTypes.js'

const router = useRouter()

const role    = ref(null)
const reports = ref([])
const loading = ref(true)
const error   = ref(null)

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function goDetail(id) {
  const base = role.value === 'owner' ? '/owner' : '/tenant'
  router.push(`${base}/reports/${id}`)
}

async function load() {
  loading.value = true
  error.value   = null
  try {
    const data = await api.get('/reports')
    reports.value = data.reports ?? data ?? []
  } catch (e) {
    error.value = e.message || '리포트를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const r = getRole()
  if (r !== 'owner' && r !== 'tenant') {
    router.replace('/')
    return
  }
  role.value = r
  load()
})
</script>
