<template>
  <div class="flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
    <div v-if="$slots.icon" class="text-ph mb-1">
      <slot name="icon" />
    </div>
    <p v-if="title" class="text-base font-medium text-ink">{{ title }}</p>
    <p v-if="description" class="text-sm text-muted max-w-xs">{{ description }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
})
</script>
