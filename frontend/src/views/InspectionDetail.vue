<template>
  <div>
    <!-- ── Loading skeleton ── -->
    <AppLayout v-if="loading">
      <template #header>
        <PageHeader title="점검 상세" :has-back="true" @back="router.push('/contractor')" />
      </template>
      <div class="mt-4 flex flex-col gap-3">
        <div class="h-8 rounded bg-surface animate-pulse" />
        <div class="h-24 rounded-card bg-surface animate-pulse" />
        <div class="h-24 rounded-card bg-surface animate-pulse" />
      </div>
    </AppLayout>

    <!-- ── Load error (404/403) ── -->
    <AppLayout v-else-if="loadError">
      <template #header>
        <PageHeader title="점검 상세" :has-back="true" @back="router.push('/contractor')" />
      </template>
      <div class="mt-4">
        <AlertMessage tone="warning">{{ loadError }}</AlertMessage>
      </div>
      <div class="mt-4">
        <BaseButton variant="secondary" @click="router.push('/contractor')">
          목록으로 돌아가기
        </BaseButton>
      </div>
    </AppLayout>

    <!-- ── Whole flow ── -->
    <WholeInspection
      v-else-if="inspection && inspection.flow === 'whole'"
      :inspection="inspection"
      @saved="reload"
    />

    <!-- ── Issue flow ── -->
    <IssueInspection
      v-else-if="inspection && inspection.flow === 'issue'"
      :inspection="inspection"
      @saved="reload"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout       from '../components/ui/AppLayout.vue'
import PageHeader      from '../components/ui/PageHeader.vue'
import BaseButton      from '../components/ui/BaseButton.vue'
import AlertMessage    from '../components/ui/AlertMessage.vue'
import WholeInspection from './inspection/WholeInspection.vue'
import IssueInspection from './inspection/IssueInspection.vue'
import { api }         from '../api/client.js'
import { getRole }     from '../lib/session.js'

const route  = useRoute()
const router = useRouter()

const loading    = ref(true)
const loadError  = ref('')
const inspection = ref(null)

async function loadInspection() {
  loading.value   = true
  loadError.value = ''
  try {
    const data = await api.get('/inspections/' + route.params.id)
    inspection.value = data?.inspection ?? data
  } catch (err) {
    loadError.value = err.message || '점검 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function reload() {
  await loadInspection()
}

onMounted(async () => {
  if (getRole() !== 'contractor') {
    router.replace('/')
    return
  }
  await loadInspection()
})
</script>
