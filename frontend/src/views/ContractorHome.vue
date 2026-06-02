<template>
  <AppLayout>
    <template #header>
      <PageHeader title="현장 점검" subtitle="시공업자" :has-back="false">
        <template #actions>
          <BaseButton variant="ghost" @click="router.push('/')">사용자 전환</BaseButton>
        </template>
      </PageHeader>
    </template>

    <!-- new inspection CTA -->
    <div class="mt-4 mb-6">
      <BaseButton variant="primary" :block="true" @click="router.push('/contractor/inspections/new')">
        + 새 점검 시작
      </BaseButton>
    </div>

    <!-- today summary -->
    <BaseCard title="오늘 할 일" :bordered="true" class="mb-6">
      <div class="flex flex-col divide-y divide-hair">
        <div class="flex items-center justify-between py-2">
          <span class="text-sm text-body">작성 중</span>
          <span class="text-sm font-medium text-ink">{{ draftCount }}</span>
        </div>
        <div class="flex items-center justify-between py-2">
          <span class="text-sm text-body">제출 대기</span>
          <span class="text-sm font-medium text-ink">{{ submittedCount }}</span>
        </div>
      </div>
    </BaseCard>

    <!-- draft inspections -->
    <section class="mb-6">
      <p class="text-sm font-medium text-ink mb-3">작성 중 점검</p>
      <template v-if="listLoading">
        <div v-for="n in 2" :key="n" class="h-16 rounded-card bg-surface animate-pulse mb-2" />
      </template>
      <template v-else-if="draftItems.length">
        <BaseCard
          v-for="item in draftItems"
          :key="item.id"
          :bordered="true"
          class="mb-2 cursor-pointer hover:border-ph transition-colors duration-200"
          role="button"
          tabindex="0"
          :aria-label="`${item.unit?.unitLabel ?? item.unitId} 점검 이어서 작성`"
          @click="openInspection(item.id)"
          @keydown.enter="openInspection(item.id)"
          @keydown.space.prevent="openInspection(item.id)"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink truncate">
                {{ item.unit?.unitLabel ?? item.unitId }}
              </p>
              <p class="text-xs text-muted mt-0.5">{{ labelOf(item.inspectionType) }}</p>
            </div>
            <StatusTag :status="item.status" />
          </div>
        </BaseCard>
      </template>
      <EmptyState
        v-else
        title="작성 중인 점검이 없습니다"
        description="새 점검을 시작하면 여기에 표시됩니다."
      />
    </section>

    <!-- submitted inspections -->
    <section class="mb-6">
      <p class="text-sm font-medium text-ink mb-3">제출 대기 점검</p>
      <template v-if="listLoading">
        <div v-for="n in 1" :key="n" class="h-16 rounded-card bg-surface animate-pulse mb-2" />
      </template>
      <template v-else-if="submittedItems.length">
        <BaseCard
          v-for="item in submittedItems"
          :key="item.id"
          :bordered="true"
          class="mb-2 cursor-pointer hover:border-ph transition-colors duration-200"
          role="button"
          tabindex="0"
          :aria-label="`${item.unit?.unitLabel ?? item.unitId} 점검 이어서 작성`"
          @click="openInspection(item.id)"
          @keydown.enter="openInspection(item.id)"
          @keydown.space.prevent="openInspection(item.id)"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink truncate">
                {{ item.unit?.unitLabel ?? item.unitId }}
              </p>
              <p class="text-xs text-muted mt-0.5">{{ labelOf(item.inspectionType) }}</p>
            </div>
            <StatusTag :status="item.status" />
          </div>
        </BaseCard>
      </template>
      <EmptyState
        v-else
        title="제출 대기 중인 점검이 없습니다"
        description="제출 대기 중인 점검이 여기에 표시됩니다."
      />
    </section>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout   from '../components/ui/AppLayout.vue'
import PageHeader  from '../components/ui/PageHeader.vue'
import BaseButton  from '../components/ui/BaseButton.vue'
import BaseCard    from '../components/ui/BaseCard.vue'
import StatusTag   from '../components/ui/StatusTag.vue'
import EmptyState  from '../components/ui/EmptyState.vue'
import { api } from '../api/client.js'
import { getRole } from '../lib/session.js'
import { labelOf } from '../constants/inspectionTypes.js'

const router = useRouter()

const inspections = ref([])
const listLoading = ref(true)

const draftItems     = computed(() => inspections.value.filter((i) => i.status === 'draft'))
const submittedItems = computed(() => inspections.value.filter((i) => i.status === 'submitted'))
const draftCount     = computed(() => draftItems.value.length)
const submittedCount = computed(() => submittedItems.value.length)

// Resume editing a saved draft (issue 5)
function openInspection(id) {
  router.push('/contractor/inspections/' + id)
}

onMounted(async () => {
  // guard: role must be contractor
  if (getRole() !== 'contractor') {
    router.replace('/')
    return
  }

  // best-effort list fetch — gap #1: endpoint may not exist yet
  try {
    const data = await api.get('/inspections')
    inspections.value = data?.inspections ?? data ?? []
  } catch {
    // endpoint not yet available — render empty state placeholders
    inspections.value = []
  } finally {
    listLoading.value = false
  }
})
</script>
