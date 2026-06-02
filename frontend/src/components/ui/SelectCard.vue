<template>
  <button
    type="button"
    :class="[
      'w-full text-left flex items-center gap-4 min-h-[64px] px-4 py-3 rounded-card border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
      selected
        ? 'border-brand bg-brand/5'
        : 'border-hair bg-white hover:border-ph',
    ]"
    :aria-pressed="selected"
    @click="$emit('select')"
  >
    <div v-if="$slots.icon" class="shrink-0 text-muted">
      <slot name="icon" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-ink">{{ title }}</p>
      <p v-if="description" class="text-xs text-muted mt-0.5">{{ description }}</p>
    </div>
    <!-- selection indicator (radio/check) -->
    <span class="sr-only">{{ selected ? '선택됨' : '선택 가능' }}</span>
    <div
      :class="[
        'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200',
        selected ? 'border-brand bg-brand' : 'border-hair bg-white',
      ]"
      aria-hidden="true"
    >
      <svg v-if="selected" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.3l2.2 2.2 4.8-5" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  </button>
</template>

<script setup>
defineProps({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  selected:    { type: Boolean, default: false },
})
defineEmits(['select'])
</script>
