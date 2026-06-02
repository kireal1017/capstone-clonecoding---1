<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
      toneClasses,
    ]"
  >
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tone: { type: String, default: 'neutral' }, // 'neutral' | 'brand' | 'subtle'
})

const toneClasses = computed(() => {
  switch (props.tone) {
    case 'brand':
      return 'bg-brand/10 text-brand'
    case 'subtle':
      return 'bg-surface text-muted'
    default: // neutral
      return 'bg-surface text-body'
  }
})
</script>
