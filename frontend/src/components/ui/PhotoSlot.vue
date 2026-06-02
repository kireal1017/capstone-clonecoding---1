<template>
  <div class="flex flex-col gap-1">
    <div
      :class="[
        'relative aspect-square rounded overflow-hidden',
        src ? '' : 'border border-dashed border-hair flex flex-col items-center justify-center bg-surface cursor-pointer hover:border-ph transition-colors duration-200',
      ]"
      @click="!src && $emit('add')"
    >
      <img
        v-if="src"
        :src="src"
        :alt="caption || '점검 사진'"
        class="w-full h-full object-cover"
      />
      <template v-else>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-ph mb-1" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M9 5L10.5 3H13.5L15 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="text-xs text-ph">사진 추가</span>
        <slot name="upload" />
      </template>
      <button
        v-if="src"
        type="button"
        class="absolute top-1 right-1 w-6 h-6 rounded bg-ink/50 text-white flex items-center justify-center hover:bg-ink/70 transition-colors duration-200"
        aria-label="사진 삭제"
        @click.stop="$emit('remove')"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M1 1L9 9M9 1L1 9" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <p v-if="caption" class="text-xs text-muted truncate">{{ caption }}</p>
  </div>
</template>

<script setup>
defineProps({
  src:     { type: String, default: '' },
  caption: { type: String, default: '' },
})
defineEmits(['add', 'remove'])
</script>
