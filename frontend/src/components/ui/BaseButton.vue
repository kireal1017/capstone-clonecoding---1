<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center gap-2 min-h-[40px] px-5 text-sm font-medium rounded-btn transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
      block ? 'w-full' : '',
      variantClasses,
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
    ]"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant:  { type: String, default: 'primary' }, // 'primary' | 'secondary' | 'ghost'
  type:     { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  block:    { type: Boolean, default: false },
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-white text-body border border-hair hover:border-ph'
    case 'ghost':
      return 'bg-transparent text-muted hover:text-body'
    default: // primary
      return 'bg-brand text-white hover:opacity-90'
  }
})
</script>
