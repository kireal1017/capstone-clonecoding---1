<template>
  <div
    :class="[
      'relative flex items-start gap-3 bg-surface px-4 py-3 rounded text-sm text-body border-l-2',
      accentClass,
    ]"
    role="alert"
  >
    <div class="flex-1 min-w-0">
      <slot />
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="shrink-0 text-muted hover:text-ink transition-colors duration-200 mt-0.5"
      aria-label="닫기"
      @click="$emit('close')"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tone:        { type: String, default: 'info' }, // 'info' | 'success' | 'warning'
  dismissible: { type: Boolean, default: false },
})
defineEmits(['close'])

const accentClass = computed(() => {
  switch (props.tone) {
    case 'success': return 'border-l-ink'
    case 'warning': return 'border-l-ink'
    default:        return 'border-l-brand'
  }
})
</script>
