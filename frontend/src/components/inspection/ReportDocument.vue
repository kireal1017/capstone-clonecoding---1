<template>
  <div class="space-y-0">

    <!-- 1. 기본 정보 -->
    <ReportSection title="기본 정보">
      <div class="space-y-3">
        <!-- Grade -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-muted w-20 shrink-0">종합 등급</span>
          <StatusTag :status="snapshot.report.grade" />
        </div>
        <!-- Unit + building -->
        <div class="flex items-start gap-3">
          <span class="text-xs text-muted w-20 shrink-0">호실</span>
          <div>
            <p class="text-sm text-ink">{{ snapshot.unit.label }}</p>
            <p class="text-xs text-muted">{{ snapshot.unit.building.name }}</p>
            <p class="text-xs text-muted">{{ snapshot.unit.building.address }}</p>
          </div>
        </div>
        <!-- Inspection type + flow -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-muted w-20 shrink-0">점검 유형</span>
          <span class="text-sm text-body">{{ labelOf(snapshot.inspection.type) }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-muted w-20 shrink-0">점검 방식</span>
          <span class="text-sm text-body">{{ flowLabel(snapshot.inspection.flow) }}</span>
        </div>
        <!-- Dates -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-muted w-20 shrink-0">점검일</span>
          <span class="text-sm text-body">{{ formatDate(snapshot.inspection.inspectedAt) }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-muted w-20 shrink-0">생성일</span>
          <span class="text-sm text-body">{{ formatDate(snapshot.report.createdAt) }}</span>
        </div>
        <!-- Participants -->
        <div class="flex items-start gap-3">
          <span class="text-xs text-muted w-20 shrink-0">참여자</span>
          <div class="space-y-1 text-sm text-body">
            <p v-if="snapshot.participants.contractor">
              시공업자: {{ snapshot.participants.contractor.name }}
            </p>
            <p v-if="snapshot.participants.owner">
              임대인: {{ snapshot.participants.owner.name }}
            </p>
            <p v-if="snapshot.participants.tenant">
              임차인: {{ snapshot.participants.tenant.name }}
            </p>
          </div>
        </div>
      </div>
    </ReportSection>

    <!-- 2. 점검 항목 -->
    <ReportSection title="점검 항목" :description="snapshot.items.length + '개 항목'">
      <div v-if="snapshot.items.length === 0" class="text-sm text-muted">점검 항목이 없습니다.</div>
      <div v-else class="space-y-3">
        <div
          v-for="(item, idx) in snapshot.items"
          :key="idx"
          class="flex items-start gap-3 py-2 border-b border-hair last:border-b-0"
        >
          <!-- Left: space + detail -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-0.5">
              <span class="text-xs font-medium text-ink">
                {{ isIssueFlow ? (item.category || item.problemItem || item.detailItem) : spaceLabel(item.space) }}
              </span>
              <span class="text-xs text-muted">
                {{ isIssueFlow ? (item.location || '') : item.detailItem }}
              </span>
            </div>
            <p v-if="item.location && !isIssueFlow" class="text-xs text-muted mb-0.5">{{ item.location }}</p>
            <p v-if="item.description" class="text-xs text-body">{{ item.description }}</p>
          </div>
          <!-- Right: state badge -->
          <BaseBadge :tone="stateTone(item.state)" class="shrink-0 mt-0.5">
            {{ stateLabel(item.state) }}
          </BaseBadge>
        </div>
      </div>
    </ReportSection>

    <!-- 3. 현장 확인 (observations) -->
    <ReportSection v-if="snapshot.observations && snapshot.observations.length" title="현장 확인">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(obs, idx) in snapshot.observations"
          :key="idx"
          class="flex items-center gap-1.5 bg-surface rounded px-2.5 py-1.5"
        >
          <span class="text-xs text-body">{{ obs.observationKey }}</span>
          <BaseBadge :tone="obsValueTone(obs.value)">{{ obsValueLabel(obs.value) }}</BaseBadge>
          <span v-if="obs.note" class="text-xs text-muted">— {{ obs.note }}</span>
        </div>
      </div>
    </ReportSection>

    <!-- 4. 사진 증빙 -->
    <ReportSection v-if="validImages.length" title="사진 증빙" :description="validImages.length + '장'">
      <div class="grid grid-cols-3 gap-2">
        <div v-for="(img, idx) in validImages" :key="idx" class="space-y-1">
          <PhotoSlot
            :src="toDataUri(img)"
            :caption="photoTypeLabel(img.photoType) + (img.caption ? ' · ' + img.caption : '')"
          />
        </div>
      </div>
    </ReportSection>

    <!-- 5. 시공업자 최종 의견 -->
    <ReportSection title="시공업자 최종 의견">
      <p v-if="snapshot.finalOpinion" class="text-sm text-body whitespace-pre-wrap">{{ snapshot.finalOpinion }}</p>
      <p v-else class="text-sm text-muted">작성된 의견이 없습니다.</p>
    </ReportSection>

    <!-- 6. 확인 이력 -->
    <ReportSection title="확인 이력">
      <div v-if="!confirmations || confirmations.length === 0">
        <p class="text-sm text-muted">확인 완료 내역이 없습니다.</p>
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="(c, idx) in confirmations"
          :key="idx"
          class="flex items-center justify-between py-1.5 border-b border-hair last:border-b-0"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm text-body">{{ c.name }}</span>
            <BaseBadge tone="subtle">{{ confirmedRoleLabel(c.confirmedRole) }}</BaseBadge>
          </div>
          <span class="text-xs text-muted">{{ formatDate(c.confirmedAt) }}</span>
        </div>
      </div>
    </ReportSection>

    <!-- 7. 주의 문구 -->
    <ReportSection v-if="snapshot.caution" title="주의 문구">
      <p class="text-xs text-muted leading-relaxed">{{ snapshot.caution }}</p>
    </ReportSection>

  </div>
</template>

<script setup>
import { computed } from 'vue'

import ReportSection from '../ui/ReportSection.vue'
import BaseBadge     from '../ui/BaseBadge.vue'
import StatusTag     from '../ui/StatusTag.vue'
import PhotoSlot     from '../ui/PhotoSlot.vue'

import { labelOf, flowLabel }   from '../../constants/inspectionTypes.js'
import { STATES, WHOLE_SPACES }  from '../../constants/inspectionSpaces.js'
import { photoTypeLabel }        from '../../constants/photoTypes.js'

// Normalize whole-flow space values. Real snapshots store the Korean label
// (e.g. "현관"); seed/legacy snapshots store the English key (e.g. "entrance").
// Map known keys to their label and pass through anything already localized.
const SPACE_LABELS = Object.fromEntries(WHOLE_SPACES.map((s) => [s.key, s.label]))
function spaceLabel(value) {
  return SPACE_LABELS[value] ?? value
}

const props = defineProps({
  snapshot:      { type: Object, required: true },
  confirmations: { type: Array,  default: () => [] },
})

const isIssueFlow = computed(() => props.snapshot?.inspection?.flow === 'issue')

// Only render images that actually carry base64 payload. Seed/legacy snapshots
// may contain image entries with metadata only (e.g. { photoType }), which would
// otherwise produce a broken "data:image/jpeg;base64,undefined" request.
const validImages = computed(() =>
  (props.snapshot?.images ?? []).filter((img) => img && img.base64Data)
)

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function stateLabel(value) {
  return STATES.find((s) => s.value === value)?.label ?? value
}

function stateTone(value) {
  if (value === 'repair_needed') return 'brand'
  if (value === 'caution')       return 'neutral'
  return 'subtle'
}

function obsValueLabel(value) {
  if (value === 'present')    return '있음'
  if (value === 'absent')     return '없음'
  if (value === 'need_check') return '확인 필요'
  return value
}

function obsValueTone(value) {
  if (value === 'need_check') return 'brand'
  if (value === 'present')    return 'neutral'
  return 'subtle'
}

function confirmedRoleLabel(role) {
  if (role === 'owner')  return '임대인'
  if (role === 'tenant') return '임차인'
  return role
}

function toDataUri(img) {
  const mime = img.mimeType || 'image/jpeg'
  return `data:${mime};base64,${img.base64Data}`
}
</script>
