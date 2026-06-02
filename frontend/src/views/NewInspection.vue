<template>
  <AppLayout>
    <template #header>
      <PageHeader
        :title="step === 0 ? '어떤 점검인가요?' : '점검 대상'"
        :has-back="true"
        @back="onBack"
      />
    </template>

    <!-- step indicator -->
    <div class="mt-2 mb-6">
      <StepIndicator
        :steps="['점검 목적', '점검 대상', '점검 작성', '제출']"
        :current="step"
      />
    </div>

    <!-- ── Step 1: 점검 목적 선택 ── -->
    <div v-if="step === 0" class="flex flex-col gap-3">
      <SelectCard
        v-for="type in INSPECTION_TYPES"
        :key="type.value"
        :title="type.label"
        :description="type.description"
        :selected="selectedType === type.value"
        @select="selectedType = type.value"
      />
    </div>

    <!-- ── Step 2: 점검 대상 입력 ── -->
    <div v-else class="flex flex-col gap-4">
      <!-- summary card -->
      <BaseCard :bordered="true">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted">선택한 점검</span>
            <span class="text-sm font-medium text-ink">{{ selectedTypeObj?.label }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted">진행 방식</span>
            <span class="text-sm text-body">{{ flowLabel(selectedTypeObj?.flow) }}</span>
          </div>
        </div>
      </BaseCard>

      <!-- units select -->
      <FormField label="건물 / 호실" :required="true" :error="unitError">
        <template v-if="unitsLoading">
          <div class="h-10 rounded bg-surface animate-pulse" />
        </template>
        <select
          v-else
          v-model="selectedUnitId"
          class="w-full h-10 px-3 rounded border border-hair bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors"
          :class="{ 'border-ink': unitError }"
          @change="unitError = ''"
        >
          <option value="" disabled>건물 / 호실 선택</option>
          <option v-for="unit in units" :key="unit.id" :value="unit.id">
            {{ unit.building?.name }} {{ unit.unitLabel }}
          </option>
        </select>
      </FormField>

      <!-- inspection date -->
      <FormField label="점검일" :required="true">
        <input
          v-model="inspectedAt"
          type="date"
          class="w-full h-10 px-3 rounded border border-hair bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors"
        />
      </FormField>

      <!-- participants (gap #2: no owner/tenant names from /api/units) -->
      <FormField label="임대인 / 임차인">
        <div class="h-10 flex items-center px-3 rounded border border-hair bg-surface text-sm text-muted">
          리포트 생성 시 임대인·임차인 정보가 표시됩니다
        </div>
      </FormField>

      <!-- submit error -->
      <AlertMessage v-if="submitError" tone="warning" :dismissible="true" @close="submitError = ''">
        {{ submitError }}
      </AlertMessage>
    </div>

    <!-- footer actions -->
    <template #footer>
      <!-- step 1 footer -->
      <div v-if="step === 0">
        <BaseButton
          variant="primary"
          :block="true"
          :disabled="!selectedType"
          @click="step = 1"
        >
          다음
        </BaseButton>
      </div>

      <!-- step 2 footer -->
      <div v-else class="flex flex-col gap-2">
        <BaseButton
          variant="primary"
          :block="true"
          :disabled="submitting"
          @click="onStart"
        >
          {{ submitting ? '생성 중...' : '점검 시작' }}
        </BaseButton>
        <BaseButton
          variant="secondary"
          :block="true"
          :disabled="submitting"
          @click="onSave"
        >
          임시 저장
        </BaseButton>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout    from '../components/ui/AppLayout.vue'
import PageHeader   from '../components/ui/PageHeader.vue'
import BaseButton   from '../components/ui/BaseButton.vue'
import BaseCard     from '../components/ui/BaseCard.vue'
import FormField    from '../components/ui/FormField.vue'
import SelectCard   from '../components/ui/SelectCard.vue'
import StepIndicator from '../components/ui/StepIndicator.vue'
import AlertMessage from '../components/ui/AlertMessage.vue'
import { api } from '../api/client.js'
import { showToast } from '../lib/toast.js'
import { getRole } from '../lib/session.js'
import { INSPECTION_TYPES, flowLabel } from '../constants/inspectionTypes.js'

const router = useRouter()

const step          = ref(0)
const selectedType  = ref('')
const units         = ref([])
const unitsLoading  = ref(false)
const selectedUnitId = ref('')
const unitError     = ref('')
const inspectedAt   = ref('')
const submitting    = ref(false)
const submitError   = ref('')

const selectedTypeObj = computed(() =>
  INSPECTION_TYPES.find((t) => t.value === selectedType.value) ?? null
)

function onBack() {
  if (step.value === 1) {
    step.value = 0
  } else {
    router.push('/contractor')
  }
}

async function loadUnits() {
  unitsLoading.value = true
  try {
    const data = await api.get('/units')
    units.value = data?.units ?? []
  } catch {
    units.value = []
  } finally {
    unitsLoading.value = false
  }
}

async function createInspection() {
  if (!selectedUnitId.value) {
    unitError.value = '건물 / 호실을 선택하세요'
    return null
  }
  submitting.value = true
  submitError.value = ''
  try {
    const data = await api.post('/inspections', {
      unitId: selectedUnitId.value,
      inspectionType: selectedType.value,
      inspectedAt: inspectedAt.value || undefined,
    })
    return data?.inspection ?? data
  } catch (err) {
    submitError.value = err.message || '점검 생성에 실패했습니다. 다시 시도해 주세요.'
    return null
  } finally {
    submitting.value = false
  }
}

async function onStart() {
  const inspection = await createInspection()
  if (inspection) {
    router.push('/contractor/inspections/' + inspection.id)
  }
}

async function onSave() {
  const inspection = await createInspection()
  if (inspection) {
    // 임시 저장 → 메인 복귀 + toast (issue 5)
    showToast('점검 내용이 임시 저장되었습니다.')
    router.push('/contractor')
  }
}

onMounted(() => {
  // guard: role must be contractor
  if (getRole() !== 'contractor') {
    router.replace('/')
    return
  }

  // default inspectedAt to today
  inspectedAt.value = new Date().toISOString().slice(0, 10)

  loadUnits()
})
</script>
