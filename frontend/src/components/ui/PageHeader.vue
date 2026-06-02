<template>
  <header class="flex items-center gap-3 py-4 border-b border-hair">
    <button
      v-if="hasBack"
      class="flex items-center justify-center w-8 h-8 rounded text-muted hover:text-ink transition-colors duration-200 shrink-0"
      type="button"
      aria-label="뒤로 가기"
      @click="$emit('back')"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <slot name="back" />
    <div class="flex-1 min-w-0">
      <h1 class="text-[20px] font-medium text-ink leading-tight truncate">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-muted mt-0.5 truncate">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="shrink-0 flex items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
  hasBack:  { type: Boolean, default: false },
})
defineEmits(['back'])
</script>
