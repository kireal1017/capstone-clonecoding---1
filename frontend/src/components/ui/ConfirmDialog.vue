<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="no-print fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <!-- backdrop -->
      <div class="absolute inset-0 bg-ink/40" @click="$emit('cancel')" />

      <!-- dialog -->
      <div
        class="relative w-full max-w-sm bg-white rounded-card border border-hair p-5"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <h2 class="text-base font-medium text-ink mb-2">{{ title }}</h2>
        <div class="text-sm text-body space-y-1 mb-5">
          <p v-for="(line, i) in lines" :key="i">{{ line }}</p>
        </div>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" :block="true" @click="$emit('confirm')">
            {{ confirmLabel }}
          </BaseButton>
          <BaseButton variant="ghost" :block="true" @click="$emit('cancel')">
            {{ cancelLabel }}
          </BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import BaseButton from './BaseButton.vue'

defineProps({
  open:         { type: Boolean, default: false },
  title:        { type: String, default: '' },
  lines:        { type: Array, default: () => [] },
  confirmLabel: { type: String, default: '확인' },
  cancelLabel:  { type: String, default: '취소' },
})
defineEmits(['confirm', 'cancel'])
</script>
