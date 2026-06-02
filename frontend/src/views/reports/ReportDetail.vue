<template>
  <AppLayout>
    <template #header>
      <PageHeader
        title="점검 리포트"
        :subtitle="headerSubtitle"
        :hasBack="true"
        @back="goBack"
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

    <!-- Load error -->
    <div v-else-if="loadError" class="py-4 space-y-3">
      <AlertMessage tone="info" dismissible @close="loadError = null">
        {{ loadError }}
      </AlertMessage>
      <BaseButton variant="secondary" @click="goBack">목록으로</BaseButton>
    </div>

    <!-- Report content -->
    <template v-else-if="report">

      <!-- Success / action alerts -->
      <div v-if="actionAlert" class="mb-4">
        <AlertMessage :tone="actionAlert.tone" dismissible @close="actionAlert = null">
          {{ actionAlert.message }}
        </AlertMessage>
      </div>

      <!-- Shared read-only document renderer -->
      <ReportDocument
        :snapshot="snap"
        :confirmations="report.confirmations"
      />

      <!-- Share URL panel -->
      <div v-if="shareUrl" class="no-print mt-4 p-4 bg-surface rounded border border-hair space-y-2">
        <p class="text-xs font-medium text-ink">공유 링크가 생성되었습니다</p>
        <div class="flex items-center gap-2">
          <input
            type="text"
            readonly
            :value="shareUrl"
            class="flex-1 text-xs text-body bg-white border border-hair rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand"
            @click="($event.target).select()"
          />
          <BaseButton variant="secondary" @click="copyShareUrl">복사</BaseButton>
        </div>
      </div>

    </template>

    <!-- Footer action bar -->
    <template #footer>
      <div v-if="report && !loading && !loadError" class="no-print flex items-center gap-2 flex-wrap">
        <!-- 확인 완료 -->
        <BaseButton
          v-if="canConfirm"
          variant="primary"
          :disabled="alreadyConfirmed || confirmLoading"
          class="flex-1"
          @click="doConfirm"
        >
          {{ alreadyConfirmed ? '확인 완료됨' : (confirmLoading ? '처리 중...' : '확인 완료') }}
        </BaseButton>

        <!-- 공유 링크 생성 -->
        <BaseButton
          variant="secondary"
          :disabled="shareLoading"
          class="flex-1"
          @click="doShare"
        >
          {{ shareLoading ? '생성 중...' : '공유 링크 생성' }}
        </BaseButton>

        <!-- 인쇄 / PDF 저장 — navigates to dedicated print template -->
        <BaseButton
          variant="secondary"
          class="flex-1"
          @click="goPrint"
        >
          인쇄 / PDF 저장
        </BaseButton>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import AppLayout     from '../../components/ui/AppLayout.vue'
import PageHeader    from '../../components/ui/PageHeader.vue'
import BaseButton    from '../../components/ui/BaseButton.vue'
import AlertMessage  from '../../components/ui/AlertMessage.vue'
import ReportDocument from '../../components/inspection/ReportDocument.vue'

import { api }          from '../../api/client.js'
import { getRole, getUserId } from '../../lib/session.js'
import { labelOf }      from '../../constants/inspectionTypes.js'

const router = useRouter()
const route  = useRoute()

const role           = ref(null)
const report         = ref(null)
const loading        = ref(true)
const loadError      = ref(null)
const actionAlert    = ref(null)
const confirmLoading = ref(false)
const shareLoading   = ref(false)
const shareUrl       = ref(null)

const snap = computed(() => report.value?.snapshot ?? null)

const headerSubtitle = computed(() => {
  if (!snap.value) return ''
  return `${snap.value.unit.label} · ${labelOf(report.value.inspectionType)}`
})

const canConfirm = computed(() => {
  const r = role.value
  return r === 'owner' || r === 'tenant'
})

const alreadyConfirmed = computed(() => {
  if (!report.value?.confirmations) return false
  const uid = getUserId()
  const roleInUnit = report.value.roleInUnit
  return report.value.confirmations.some(
    (c) => String(c.userId) === String(uid) && c.confirmedRole === roleInUnit
  )
})

function goBack() {
  const base = role.value === 'owner' ? '/owner' : '/tenant'
  router.push(`${base}/reports`)
}

function goPrint() {
  router.push(`/reports/${route.params.id}/print`)
}

async function load() {
  loading.value  = true
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
}

async function doConfirm() {
  if (alreadyConfirmed.value || confirmLoading.value) return
  confirmLoading.value = true
  actionAlert.value = null
  try {
    await api.post(`/reports/${route.params.id}/confirm`, {})
    actionAlert.value = { tone: 'success', message: '확인 완료 처리되었습니다.' }
    await load()
  } catch (e) {
    actionAlert.value = { tone: 'info', message: e.message || '확인 완료 처리에 실패했습니다.' }
  } finally {
    confirmLoading.value = false
  }
}

async function doShare() {
  if (shareLoading.value) return
  shareLoading.value = true
  actionAlert.value = null
  try {
    const res = await api.post(`/reports/${route.params.id}/share`, {})
    const token = res.token ?? res.sharePath?.split('/share/')[1]
    shareUrl.value = `${window.location.origin}/share/${token}`
    actionAlert.value = { tone: 'success', message: '공유 링크가 생성되었습니다.' }
    await load()
  } catch (e) {
    actionAlert.value = { tone: 'info', message: e.message || '공유 링크 생성에 실패했습니다.' }
  } finally {
    shareLoading.value = false
  }
}

async function copyShareUrl() {
  if (!shareUrl.value) return
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    actionAlert.value = { tone: 'success', message: '링크가 클립보드에 복사되었습니다.' }
  } catch {
    actionAlert.value = { tone: 'info', message: '복사에 실패했습니다. 직접 링크를 선택해 복사해 주세요.' }
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
