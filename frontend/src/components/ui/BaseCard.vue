<template>
  <div
    :class="[
      'bg-white rounded-card p-4',
      bordered ? 'border border-hair' : '',
    ]"
  >
    <p v-if="title" class="text-sm font-medium text-ink mb-3">{{ title }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title:    { type: String, default: '' },
  bordered: { type: Boolean, default: false },
})
</script>
