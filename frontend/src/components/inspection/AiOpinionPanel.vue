<template>
  <div class="flex flex-col gap-4">

    <!-- ── AI 도우미 헤더 ── -->
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-medium text-ink">AI 점검 도우미</p>
        <p class="text-xs text-muted mt-0.5">현재 점검 내용을 분석해 행동 가이드를 제공합니다.</p>
      </div>
      <BaseButton
        variant="primary"
        :disabled="loading || props.readonly"
        @click="runAi"
      >
        {{ loading ? '분석 중...' : 'AI 도우미 실행' }}
      </BaseButton>
    </div>

    <!-- ── 로딩 스켈레톤 ── -->
    <div v-if="loading" class="flex flex-col gap-3" aria-label="AI 분석 중" aria-busy="true">
      <div class="h-20 rounded-card bg-surface animate-pulse" />
      <div class="h-24 rounded-card bg-surface animate-pulse" />
      <div class="h-16 rounded-card bg-surface animate-pulse" />
    </div>

    <template v-else>
      <!-- ── Fallback / 네트워크 오류 안내 ── -->
      <AlertMessage v-if="fallback || error" tone="info">
        AI 자동 생성을 사용할 수 없어 기본 안내를 표시합니다. 최종 의견은 직접 작성하세요.
      </AlertMessage>

      <!-- ── 가이드 카드들 (guide 있을 때만) ── -->
      <template v-if="guide">

        <!-- 요약 -->
        <BaseCard title="현재 점검 요약" :bordered="true">
          <p class="text-sm text-body leading-relaxed">{{ guide.summary }}</p>
        </BaseCard>

        <!-- 행동 카드 -->
        <BaseCard v-if="guide.actionCards && guide.actionCards.length" title="행동 가이드" :bordered="true">
          <div class="flex flex-col gap-3">
            <div
              v-for="(card, idx) in guide.actionCards"
              :key="idx"
              class="flex items-start gap-3 p-3 rounded border border-hair bg-surface"
            >
              <!-- Type chip -->
              <BaseBadge :tone="actionCardTone(card.type)" class="shrink-0 mt-0.5">
                {{ actionTypeLabel(card.type) }}
              </BaseBadge>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-ink leading-snug">{{ card.title }}</p>
                <p class="text-xs text-muted mt-0.5 leading-relaxed">{{ card.description }}</p>
              </div>

              <!-- Action button (guidance only — no real action in F05) -->
              <BaseButton
                variant="secondary"
                class="shrink-0 !min-h-[32px] !px-3 !text-xs"
                @click="acknowledgeCard(idx)"
              >
                {{ card.buttonLabel || '확인' }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <!-- 확인이 필요한 자료 -->
        <BaseCard
          v-if="guide.requiredDocuments && guide.requiredDocuments.length"
          title="확인이 필요한 자료"
          :bordered="true"
        >
          <div class="flex flex-wrap gap-2">
            <BaseBadge
              v-for="(doc, idx) in guide.requiredDocuments"
              :key="idx"
              tone="subtle"
            >
              {{ doc }}
            </BaseBadge>
          </div>
        </BaseCard>

        <!-- 표현 주의 -->
        <BaseCard
          v-if="guide.cautionPhrases && guide.cautionPhrases.length"
          title="표현 주의"
          :bordered="true"
        >
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="(phrase, idx) in guide.cautionPhrases"
              :key="idx"
              class="flex items-start gap-2 text-xs text-muted"
            >
              <span class="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-muted inline-block" aria-hidden="true" />
              {{ phrase }}
            </li>
          </ul>
        </BaseCard>

        <!-- 의견 초안 -->
        <BaseCard title="의견 초안" :bordered="true">
          <p class="text-xs text-muted leading-relaxed whitespace-pre-wrap mb-3">{{ guide.opinionDraft || '(초안 없음)' }}</p>
          <BaseButton
            variant="primary"
            :disabled="!guide.opinionDraft || props.readonly"
            @click="applyDraft"
          >
            초안 적용
          </BaseButton>
        </BaseCard>

      </template>
    </template>

    <!-- ── 최종 의견 (AI 여부 무관, 항상 표시) ── -->
    <BaseCard :bordered="true">
      <FormField
        label="시공업자 최종 의견"
        hint="AI 초안은 참고용입니다. 리포트에는 이 최종 의견만 포함됩니다."
      >
        <textarea
          :value="modelValue"
          :disabled="props.readonly"
          rows="4"
          placeholder="최종 의견을 입력하세요..."
          class="w-full px-3 py-2 rounded border border-hair bg-white text-sm text-body focus:outline-none focus:border-brand transition-colors resize-none disabled:bg-surface disabled:text-muted"
          aria-label="시공업자 최종 의견"
          @input="$emit('update:modelValue', $event.target.value)"
        />
      </FormField>
    </BaseCard>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseButton   from '../ui/BaseButton.vue'
import BaseCard     from '../ui/BaseCard.vue'
import BaseBadge    from '../ui/BaseBadge.vue'
import FormField    from '../ui/FormField.vue'
import AlertMessage from '../ui/AlertMessage.vue'
import { api }      from '../../api/client.js'

// ── Props / emits ──
const props = defineProps({
  inspectionId: { type: Number, required: true },
  context:      { type: Object, required: true },
  modelValue:   { type: String, default: '' },
  readonly:     { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

// ── State ──
const loading  = ref(false)
const guide    = ref(null)
const fallback = ref(false)
const error    = ref(false)

// ── Run AI ──
async function runAi() {
  if (loading.value || props.readonly) return
  loading.value = true
  error.value   = false
  fallback.value = false
  try {
    const res = await api.post('/ai/inspection-guide', {
      inspectionId: props.inspectionId,
      ...props.context,
    })
    guide.value    = res.guide
    fallback.value = res.fallback ?? false
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

// ── Apply draft to final opinion ──
function applyDraft() {
  if (!guide.value?.opinionDraft || props.readonly) return
  emit('update:modelValue', guide.value.opinionDraft)
}

// ── Acknowledge action card (guidance only) ──
function acknowledgeCard(/* idx */) {
  // F05: action buttons are guidance only — no real action required
}

// ── Helpers ──
function actionTypeLabel(type) {
  const map = {
    photo:    '촬영',
    document: '자료',
    caution:  '주의',
    check:    '확인',
  }
  return map[type] ?? type ?? '확인'
}

function actionCardTone(type) {
  if (type === 'caution') return 'brand'
  if (type === 'photo')   return 'brand'
  return 'neutral'
}
</script>
